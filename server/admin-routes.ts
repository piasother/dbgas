// Admin/staff tools: products, orders, enquiries, installation bookings,
// editable site images and an SMTP test.
import type { Express } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { adminSettings, inquiries, orders, products } from "@shared/schema";
import { isAdmin, isStaff } from "./auth";
import { markOrderPaid } from "./orders";
import { getNotifyAddress, notifyBusiness, sendMailDetailed } from "./mailer";

// ---- product input --------------------------------------------------------
const money = z.coerce.number().min(0).max(10_000_000); // dollars (new form) or cents (old form)
const productInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1000),
  price: money, // dollars in the form; stored as cents
  category: z.enum(["lpg", "accessories"]),
  image: z.string().trim().max(500).optional().default(""),
  badge: z.string().trim().max(40).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000).default(5),
  reorderLevel: z.coerce.number().int().min(0).max(1_000_000).default(2),
  leadTime: z.coerce.number().int().min(0).max(365).default(0),
  sku: z.string().trim().max(60).optional().nullable(),
  supplier: z.string().trim().max(120).optional().nullable(),
  inStock: z.coerce.boolean().optional(),
});

function toProductRow(data: z.infer<typeof productInput>) {
  return {
    name: data.name,
    description: data.description,
    price: Math.round(data.price * 100),
    category: data.category,
    image: data.image || (data.category === "lpg" ? "/images/lpg-19kg-cylinder.svg" : "/images/lpg-regulator.svg"),
    badge: data.badge || null,
    stockQuantity: data.stockQuantity,
    lowStockThreshold: data.lowStockThreshold,
    reorderLevel: data.reorderLevel,
    leadTime: data.leadTime,
    sku: data.sku || null,
    supplier: data.supplier || null,
    inStock: data.inStock ?? data.stockQuantity > 0,
  };
}

// ---- site images (editable from Admin) ------------------------------------
export const SITE_IMAGE_DEFAULTS: Record<string, string> = {
  hero: "/images/hero-lpg-facility.svg",
  about: "/images/installation-team.svg",
  commercial: "/images/commercial-kitchen-lpg.svg",
  safety: "/images/lpg-safety-equipment.svg",
};
const siteImageKey = (k: string) => `site_image_${k}`;
const safeImageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => u.startsWith("/") || /^https:\/\//i.test(u), "Image must be an uploaded image or an https:// link");

const ORDER_STATUSES = ["pending", "confirmed", "processing", "out_for_delivery", "delivered", "completed", "cancelled"];
const INQUIRY_STATUSES = ["new", "contacted", "closed"];

export async function registerAdminRoutes(app: Express) {
  // Self-migration for enquiry status (older databases).
  await db.execute(sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status text DEFAULT 'new'`);

  // ---------- Products ----------
  app.post("/api/admin/products", isAdmin, async (req, res) => {
    const parsed = productInput.safeParse(req.body);
    if (!parsed.success) {
      const f = parsed.error.errors[0];
      return res.status(400).json({ error: `${f?.path.join(".") || "Product"}: ${f?.message || "invalid"}` });
    }
    try {
      const [created] = await db.insert(products).values(toProductRow(parsed.data)).returning();
      res.status(201).json(created);
    } catch (err: any) {
      if (String(err?.message || "").includes("sku")) return res.status(409).json({ error: "That SKU is already used by another product." });
      console.error("Create product failed:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Replaces the old "update anything" handler with a validated one.
  app.put("/api/admin/products/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid product ID" });
    const partial = productInput.partial().safeParse(req.body);
    if (!partial.success) {
      const f = partial.error.errors[0];
      return res.status(400).json({ error: `${f?.path.join(".") || "Product"}: ${f?.message || "invalid"}` });
    }
    const d = partial.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["name", "description", "category", "badge", "stockQuantity", "lowStockThreshold", "reorderLevel", "leadTime", "sku", "supplier", "inStock"] as const) {
      if (d[k] !== undefined) update[k] = d[k] === "" ? null : d[k];
    }
    if (d.image !== undefined && d.image !== "") update.image = d.image;
    // The existing Admin form sends price already in cents (an integer > 1000 for most items),
    // the new form sends dollars with priceInDollars=true.
    if (d.price !== undefined) {
      update.price = req.body?.priceInDollars ? Math.round(d.price * 100) : Math.round(d.price);
    }
    if (d.stockQuantity !== undefined && d.inStock === undefined) update.inStock = d.stockQuantity > 0;
    try {
      const [updated] = await db.update(products).set(update).where(eq(products.id, id)).returning();
      if (!updated) return res.status(404).json({ error: "Product not found" });
      res.json(updated);
    } catch (err) {
      console.error("Update product failed:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid product ID" });
    try {
      const [gone] = await db.delete(products).where(eq(products.id, id)).returning();
      if (!gone) return res.status(404).json({ error: "Product not found" });
      res.json({ ok: true, deleted: true });
    } catch {
      // Has stock history or images linked - hide it from the shop instead.
      await db.update(products).set({ inStock: false, stockQuantity: 0, updatedAt: new Date() }).where(eq(products.id, id));
      res.json({ ok: true, deleted: false, message: "This product has stock history, so it was marked out of stock instead of deleted." });
    }
  });

  // ---------- Orders ----------
  app.patch("/api/admin/orders/:id/manage", isStaff, async (req: any, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid order ID" });
    const { status, paymentStatus, deliveryNotes } = req.body || {};
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });

    try {
      if (paymentStatus === "paid" && order.paymentStatus !== "paid") {
        if (order.paymentMethod === "paynow" && req.user.role !== "admin") {
          return res.status(403).json({ error: "PayNow orders are confirmed automatically. Only an admin can mark them paid by hand." });
        }
        await markOrderPaid(id); // also deducts stock and emails you
      } else if (paymentStatus && ["pending", "failed", "refunded"].includes(paymentStatus)) {
        await db.update(orders).set({ paymentStatus, updatedAt: new Date() }).where(eq(orders.id, id));
      }
      const update: Record<string, unknown> = {};
      if (status) {
        if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
        update.status = status;
        if (status === "delivered" || status === "completed") update.actualDelivery = new Date();
        if (["out_for_delivery", "delivered"].includes(status)) update.deliveryStatus = status === "delivered" ? "delivered" : "in_transit";
      }
      if (typeof deliveryNotes === "string") update.deliveryNotes = deliveryNotes.slice(0, 1000);
      if (Object.keys(update).length) {
        update.updatedAt = new Date();
        await db.update(orders).set(update).where(eq(orders.id, id));
      }
      const [fresh] = await db.select().from(orders).where(eq(orders.id, id));
      res.json(fresh);
    } catch (err) {
      console.error("Order update failed:", err);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // ---------- Enquiries ----------
  app.get("/api/admin/inquiries", isStaff, async (_req, res) => {
    const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(500);
    res.json(rows);
  });

  app.patch("/api/admin/inquiries/:id", isStaff, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body?.status || "");
    if (!Number.isInteger(id) || !INQUIRY_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid request" });
    const [row] = await db.update(inquiries).set({ status }).where(eq(inquiries.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Enquiry not found" });
    res.json(row);
  });

  // ---------- Installation bookings (public form) ----------
  const bookingInput = z.object({
    name: z.string().trim().min(2, "Please enter your name").max(120),
    phone: z.string().trim().min(7, "Please enter a phone number").max(40),
    email: z.string().trim().email("Please enter a valid email").max(200).optional().or(z.literal("")),
    address: z.string().trim().min(3, "Please enter the installation address").max(300),
    service: z.string().trim().max(80),
    preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
    details: z.string().trim().max(2000).optional().or(z.literal("")),
  });

  app.post("/api/installation-bookings", async (req, res) => {
    const parsed = bookingInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message || "Please check the form" });
    const b = parsed.data;
    const message = [
      `Service: ${b.service}`,
      `Address: ${b.address}`,
      b.preferredDate ? `Preferred date: ${b.preferredDate}` : "",
      b.details ? `Details: ${b.details}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const [row] = await db
        .insert(inquiries)
        .values({ name: b.name, phone: b.phone, email: b.email || null, inquiryType: "installation", message })
        .returning();
      notifyBusiness(
        `New installation booking from ${b.name}`,
        [
          ["Name", b.name],
          ["Phone", b.phone],
          ["Email", b.email],
          ["Service", b.service],
          ["Address", b.address],
          ["Preferred date", b.preferredDate],
          ["Details", b.details],
        ],
        b.email || undefined,
      );
      res.status(201).json({ id: row.id });
    } catch (err) {
      console.error("Booking failed:", err);
      res.status(500).json({ error: "Could not send your booking. Please WhatsApp us on 0713 314 920." });
    }
  });

  // ---------- Site images ----------
  app.get("/api/site-images", async (_req, res) => {
    const out = { ...SITE_IMAGE_DEFAULTS };
    try {
      const rows = await db.select().from(adminSettings);
      for (const key of Object.keys(SITE_IMAGE_DEFAULTS)) {
        const row = rows.find((r) => r.settingKey === siteImageKey(key));
        if (row?.settingValue) out[key] = row.settingValue;
      }
    } catch (err) {
      console.error("Site images lookup failed:", err);
    }
    res.set("Cache-Control", "no-cache").json(out);
  });

  app.put("/api/admin/site-images", isAdmin, async (req: any, res) => {
    const key = String(req.body?.key || "");
    if (!(key in SITE_IMAGE_DEFAULTS)) return res.status(400).json({ error: "Unknown image slot" });
    const reset = req.body?.reset === true;
    const url = reset ? SITE_IMAGE_DEFAULTS[key] : req.body?.url;
    const ok = safeImageUrl.safeParse(url);
    if (!ok.success) return res.status(400).json({ error: ok.error.errors[0]?.message });
    await db
      .insert(adminSettings)
      .values({ settingKey: siteImageKey(key), settingValue: ok.data, settingType: "text", description: `Website image: ${key}`, updatedBy: req.user.claims.sub })
      .onConflictDoUpdate({ target: adminSettings.settingKey, set: { settingValue: ok.data, updatedBy: req.user.claims.sub, updatedAt: new Date() } });
    res.json({ key, url: ok.data });
  });

  // ---------- Email test ----------
  app.post("/api/admin/test-email", isAdmin, async (req: any, res) => {
    const to = String(req.body?.to || "") || (await getNotifyAddress());
    const result = await sendMailDetailed(
      to,
      "DB Gas website: test email",
      "This is a test email from dbgas.co.zw. If you can read this, website emails are working.",
    );
    res.status(result.ok ? 200 : 502).json(result.ok ? { ok: true, to } : { ok: false, to, error: result.error });
  });
}
