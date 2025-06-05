import { products, inquiries, orders, type Product, type InsertProduct, type Inquiry, type InsertInquiry, type Order, type InsertOrder } from "@shared/schema";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private inquiries: Map<number, Inquiry>;
  private orders: Map<number, Order>;
  private currentProductId: number;
  private currentInquiryId: number;
  private currentOrderId: number;

  constructor() {
    this.products = new Map();
    this.inquiries = new Map();
    this.orders = new Map();
    this.currentProductId = 1;
    this.currentInquiryId = 1;
    this.currentOrderId = 1;
    
    // Initialize with default products
    this.initializeProducts();
  }

  private initializeProducts() {
    const defaultProducts: Omit<Product, 'id'>[] = [
      {
        name: "9kg Cylinder Refill",
        description: "Perfect for small households and apartments. Clean burning and efficient.",
        price: 1100, // $11.00 in cents
        category: "lpg",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "ZERA Approved",
        inStock: true,
      },
      {
        name: "19kg Cylinder Refill",
        description: "Ideal for families and medium-sized businesses. Long-lasting supply.",
        price: 2200, // $22.00 in cents
        category: "lpg",
        image: "https://images.unsplash.com/photo-1574263867128-2e2c9cf14319?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Most Popular",
        inStock: true,
      },
      {
        name: "48kg Cylinder Purchase",
        description: "Heavy-duty cylinder for commercial use. Includes safety features.",
        price: 9500, // $95.00 in cents
        category: "lpg",
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Commercial Grade",
        inStock: true,
      },
      {
        name: "Empty 48kg Dual Valve Cylinder",
        description: "Professional-grade empty cylinder with dual valve system for safety.",
        price: 6000, // $60.00 in cents
        category: "lpg",
        image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Dual Valve",
        inStock: true,
      },
      {
        name: "Regulator Set",
        description: "High-quality pressure regulator for safe gas flow control.",
        price: 1800, // $18.00 in cents
        category: "accessories",
        image: "https://images.unsplash.com/photo-1609696942946-a2cf2be57815?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Safety Certified",
        inStock: true,
      },
      {
        name: "1.5m LPG Hose",
        description: "Durable, flexible hose for connecting appliances to gas supply.",
        price: 600, // $6.00 in cents
        category: "accessories",
        image: "https://images.unsplash.com/photo-1619983081563-430f63602796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "1.5m Length",
        inStock: true,
      },
      {
        name: "Conversion Kit",
        description: "Complete kit for converting appliances to LPG operation.",
        price: 2500, // $25.00 in cents
        category: "accessories",
        image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Universal",
        inStock: true,
      },
    ];

    defaultProducts.forEach(product => {
      const id = this.currentProductId++;
      this.products.set(id, { ...product, id });
    });
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.currentInquiryId++;
    const inquiry: Inquiry = {
      id,
      name: insertInquiry.name,
      phone: insertInquiry.phone,
      email: insertInquiry.email || null,
      inquiryType: insertInquiry.inquiryType,
      message: insertInquiry.message,
      createdAt: new Date(),
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      ...insertOrder,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
}

export const storage = new MemStorage();
