// One-off catalogue corrections for databases created by an older version of the
// site. Each update only touches rows that still hold the OLD default value, so
// anything you have since changed in Admin is left alone. Safe to run on every start.
import { and, desc, eq, isNotNull, like } from "drizzle-orm";
import { db } from "./db";
import { galleryImages, products } from "@shared/schema";

const PRICE_FIXES = [
  { name: "9kg Cylinder Refill", oldPrice: 1100, newPrice: 1755 }, // 9kg x $1.95
  { name: "19kg Cylinder Refill", oldPrice: 2200, newPrice: 3705 }, // 19kg x $1.95
];

const IMAGE_FIXES = [
  { name: "Regulator Set", image: "/images/lpg-regulator.svg" },
  { name: "1.5m LPG Hose", image: "/images/lpg-hose.svg" },
  { name: "Conversion Kit", image: "/images/lpg-conversion-kit.svg" },
];

const CYLINDER_PHOTOS = [
  { name: "9kg Cylinder Refill", oldImage: "/images/lpg-9kg-cylinder.svg", image: "/images/db-gas-9kg.jpg" },
  { name: "19kg Cylinder Refill", oldImage: "/images/lpg-19kg-cylinder.svg", image: "/images/db-gas-19kg.jpg" },
  { name: "48kg Cylinder Purchase", oldImage: "/images/lpg-48kg-cylinder.svg", image: "/images/db-gas-48kg.jpg" },
  { name: "Empty 48kg Dual Valve Cylinder", oldImage: "/images/lpg-48kg-empty-cylinder.svg", image: "/images/db-gas-48kg-dual.jpg" },
];

export async function syncCatalogueDefaults() {
  try {
    for (const f of PRICE_FIXES) {
      await db
        .update(products)
        .set({ price: f.newPrice, updatedAt: new Date() })
        .where(and(eq(products.name, f.name), eq(products.price, f.oldPrice)));
    }
    for (const f of IMAGE_FIXES) {
      await db
        .update(products)
        .set({ image: f.image, updatedAt: new Date() })
        .where(and(eq(products.name, f.name), like(products.image, "https://images.unsplash.com/%")));
    }
    // Images linked to a product in the Gallery Manager before linking also set the
    // product picture: apply the newest one, but only over a built-in default drawing.
    const linked = await db
      .select()
      .from(galleryImages)
      .where(and(isNotNull(galleryImages.productId), eq(galleryImages.isActive, true)))
      .orderBy(desc(galleryImages.updatedAt));
    const done = new Set<number>();
    for (const g of linked) {
      if (!g.productId || done.has(g.productId)) continue;
      done.add(g.productId);
      await db
        .update(products)
        .set({ image: g.imageUrl, updatedAt: new Date() })
        .where(and(eq(products.id, g.productId), like(products.image, "/images/lpg-%")));
    }
    // Branded DB Gas cylinder photos replace the old built-in drawings
    // (only where the product still shows the original drawing).
    for (const f of CYLINDER_PHOTOS) {
      await db
        .update(products)
        .set({ image: f.image, updatedAt: new Date() })
        .where(and(eq(products.name, f.name), eq(products.image, f.oldImage)));
    }
  } catch (err) {
    console.error("Catalogue sync skipped:", err);
  }
}
