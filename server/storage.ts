import {
  users,
  products, 
  inquiries, 
  orders, 
  type User,
  type UpsertUser,
  type Product, 
  type InsertProduct, 
  type Inquiry, 
  type InsertInquiry, 
  type Order, 
  type InsertOrder 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: string): Promise<Order[]>;
  updateOrderStatus(orderId: number, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Initialize products in database if empty
  private async initializeProducts() {
    const existingProducts = await db.select().from(products);
    if (existingProducts.length > 0) return;

    const defaultProducts = [
      {
        name: "9kg Cylinder Refill",
        description: "Perfect for small households and apartments. Clean burning and efficient.",
        price: 1100, // $11.00 in cents
        category: "lpg",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
      {
        name: "19kg Cylinder Refill",
        description: "Ideal for families and medium-sized businesses. Long-lasting supply.",
        price: 2200, // $22.00 in cents
        category: "lpg",
        imageUrl: "https://images.unsplash.com/photo-1574263867128-2e2c9cf14319?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
      {
        name: "48kg Cylinder Purchase",
        description: "Heavy-duty cylinder for commercial use. Includes safety features.",
        price: 9500, // $95.00 in cents
        category: "lpg",
        imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
      {
        name: "Empty 48kg Dual Valve Cylinder",
        description: "Professional-grade empty cylinder with dual valve system for safety.",
        price: 6000, // $60.00 in cents
        category: "lpg",
        imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
      {
        name: "Regulator Set",
        description: "High-quality pressure regulator for safe gas flow control.",
        price: 1800, // $18.00 in cents
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1609696942946-a2cf2be57815?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
      {
        name: "1.5m LPG Hose",
        description: "Durable, flexible hose for connecting appliances to gas supply.",
        price: 600, // $6.00 in cents
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1619983081563-430f63602796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
      {
        name: "Conversion Kit",
        description: "Complete kit for converting appliances to LPG operation.",
        price: 2500, // $25.00 in cents
        category: "accessories",
        imageUrl: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        inStock: true,
      },
    ];

    await db.insert(products).values(defaultProducts);
  }

  async getProducts(): Promise<Product[]> {
    await this.initializeProducts();
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db
      .insert(inquiries)
      .values(insertInquiry)
      .returning();
    return inquiry;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }
}

export const storage = new DatabaseStorage();
