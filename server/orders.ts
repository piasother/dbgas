// Order building and PayNow payment verification.
//
// Rules this module enforces:
//   - Prices always come from the database, never from the browser.
//   - An order is only marked paid after Paynow itself confirms it, by polling
//     the order's pollUrl (the response is hash-checked with the integration key).
//   - Stock is deducted exactly once per paid order.
import crypto from "crypto";
import { Paynow } from "paynow";
import { and, eq, ne, inArray } from "drizzle-orm";
import { db } from "./db";
import { orders, products, type Order, type Product } from "@shared/schema";
import { storage } from "./storage";
import { notifyBusiness } from "./mailer";

export type StoredOrderItem = {
  product: Pick<Product, "id" | "name" | "price" | "image" | "category">;
  quantity: number;
};

/** Paynow statuses that mean the money has been received. */
const PAID_STATUSES = new Set(["paid", "awaiting delivery", "delivered"]);
const FAILED_STATUSES = new Set(["cancelled", "failed", "disputed", "refunded"]);

export class OrderInputError extends Error {}

/**
 * Turn whatever the browser sent ([{productId, quantity}], [{product:{id}, quantity}],
 * or a JSON string of either) into priced order lines using current DB prices.
 */
export async function buildOrderItems(raw: unknown): Promise<{ items: StoredOrderItem[]; totalCents: number }> {
  let list: any = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      throw new OrderInputError("Invalid cart data");
    }
  }
  if (!Array.isArray(list) || list.length === 0) throw new OrderInputError("Your cart is empty");
  if (list.length > 50) throw new OrderInputError("Too many items in one order");

  const wanted = new Map<number, number>();
  for (const line of list) {
    const id = Number(line?.productId ?? line?.product?.id);
    const qty = Number(line?.quantity);
    if (!Number.isInteger(id) || id <= 0) throw new OrderInputError("Invalid product in cart");
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) throw new OrderInputError("Invalid quantity in cart");
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  const rows = await db.select().from(products).where(inArray(products.id, Array.from(wanted.keys())));
  const byId = new Map(rows.map((p) => [p.id, p]));

  const items: StoredOrderItem[] = [];
  let totalCents = 0;
  for (const [id, quantity] of Array.from(wanted.entries())) {
    const p = byId.get(id);
    if (!p) throw new OrderInputError("A product in your cart is no longer available");
    if (!p.inStock || p.stockQuantity < quantity) {
      throw new OrderInputError(`Sorry, ${p.name} doesn't have enough stock for that quantity`);
    }
    items.push({ product: { id: p.id, name: p.name, price: p.price, image: p.image, category: p.category }, quantity });
    totalCents += p.price * quantity;
  }
  return { items, totalCents };
}

export function newPaymentReference() {
  return `DBG-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function getPaynow(resultUrl: string, returnUrl: string) {
  const id = process.env.PAYNOW_INTEGRATION_ID;
  const key = process.env.PAYNOW_INTEGRATION_KEY;
  if (!id || !key) {
    throw new Error("PayNow is not configured (PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY).");
  }
  // Paynow(integrationId, integrationKey, resultUrl, returnUrl)
  return new Paynow(id, key, resultUrl, returnUrl);
}

/**
 * Ask Paynow for the real status of an order and apply it.
 * Returns the Paynow status string (lower-case), or null if it couldn't be checked.
 */
export async function verifyAndApplyPaynowStatus(order: Order): Promise<string | null> {
  if (!order.pollUrl) return null;
  let status: string;
  try {
    const paynow = getPaynow("", "");
    const response: any = await paynow.pollTransaction(order.pollUrl);
    status = String(response?.status || "").toLowerCase();
  } catch (err) {
    console.error(`PayNow poll failed for order #${order.id}:`, err);
    return null;
  }

  if (PAID_STATUSES.has(status)) {
    await markOrderPaid(order.id);
  } else if (FAILED_STATUSES.has(status)) {
    await db
      .update(orders)
      .set({ paymentStatus: "failed", status: "cancelled", updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), ne(orders.paymentStatus, "paid")));
  }
  return status;
}

/** Mark paid and deduct stock — only the first caller wins, so stock moves once. */
export async function markOrderPaid(orderId: number): Promise<boolean> {
  const [claimed] = await db
    .update(orders)
    .set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), ne(orders.paymentStatus, "paid")))
    .returning();
  if (!claimed) return false; // already processed

  let items: StoredOrderItem[] = [];
  try {
    items = JSON.parse(claimed.items || "[]");
  } catch {
    items = [];
  }
  for (const item of items) {
    try {
      await storage.adjustStock(
        item.product.id,
        -item.quantity,
        "sale",
        claimed.userId ?? undefined,
        `Order #${claimed.id} - ${item.product.name} (PayNow payment confirmed)`,
      );
    } catch (err) {
      console.error(`Stock adjustment failed for product ${item.product.id}:`, err);
    }
  }
  try {
    await storage.createDeliveryEvent({
      orderId: claimed.id,
      eventType: "confirmed",
      eventDescription: "Payment confirmed - order ready for pickup/delivery",
      createdBy: claimed.userId,
    } as any);
  } catch (err) {
    console.error("Error creating delivery event:", err);
  }
  notifyBusiness(`Payment received - order #${claimed.id}`, [
    ["Order", `#${claimed.id}`],
    ["Total", `$${(claimed.total / 100).toFixed(2)}`],
    ["Payment", claimed.paymentMethod],
    ["Customer", claimed.customerName],
    ["Phone", claimed.customerPhone || claimed.phoneNumber],
    ["Email", claimed.email],
    ["Items", describeItems(items)],
  ], claimed.email || undefined);
  return true;
}

export function describeItems(items: StoredOrderItem[]) {
  return items.map((i) => `${i.quantity} x ${i.product.name} @ $${(i.product.price / 100).toFixed(2)}`).join("\n");
}

export async function findOrderByReference(reference: string) {
  const [order] = await db.select().from(orders).where(eq(orders.paynowReference, reference));
  return order;
}

export async function findOrderById(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  return order;
}
