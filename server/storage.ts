import {
  users,
  products, 
  inquiries, 
  orders,
  inventoryMovements,
  stockAlerts,
  emailSettings,
  deliveryEvents,
  galleryImages,
  type User,
  type UpsertUser,
  type Product, 
  type InsertProduct, 
  type Inquiry, 
  type InsertInquiry, 
  type Order, 
  type InsertOrder,
  type InventoryMovement,
  type InsertInventoryMovement,
  type StockAlert,
  type InsertStockAlert,
  type EmailSetting,
  type InsertEmailSetting,
  type DeliveryEvent,
  type InsertDeliveryEvent,
  type GalleryImage,
  type InsertGalleryImage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: string, status: string): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  updateProductStock(productId: number, newStock: number): Promise<Product>;
  
  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: string): Promise<Order[]>;
  updateOrderStatus(orderId: number, status: string): Promise<Order>;
  
  // Inventory Management
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  getInventoryMovements(productId?: number): Promise<InventoryMovement[]>;
  getLowStockProducts(): Promise<Product[]>;
  createStockAlert(alert: InsertStockAlert): Promise<StockAlert>;
  getActiveStockAlerts(): Promise<StockAlert[]>;
  acknowledgeStockAlert(alertId: number, userId: string): Promise<StockAlert>;
  adjustStock(productId: number, quantity: number, reason: string, userId?: string, notes?: string): Promise<void>;
  
  // Admin operations
  getEmailSettings(): Promise<EmailSetting | undefined>;
  updateEmailSettings(settings: any, userId: string): Promise<EmailSetting>;
  
  // Delivery tracking
  updateOrderDeliveryStatus(orderId: number, status: string, trackingNumber?: string, estimatedDelivery?: Date): Promise<Order>;
  createDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent>;
  getDeliveryEvents(orderId: number): Promise<DeliveryEvent[]>;
  
  // Gallery management
  getGalleryImages(category?: string): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, updates: Partial<GalleryImage>): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<void>;
  
  // Enhanced product features
  getProductsByStockStatus(): Promise<{ inStock: Product[], lowStock: Product[], outOfStock: Product[] }>;
  getUserPreviousOrders(userId: string): Promise<Order[]>;
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
        image: "/images/lpg-9kg-cylinder.svg",
        badge: "ZERA Approved",
        inStock: true,
        stockQuantity: 150,
        lowStockThreshold: 20,
        reorderLevel: 10,
        sku: "CYL-9KG-001",
        supplier: "Zimbabwe Gas Suppliers Ltd",
      },
      {
        name: "19kg Cylinder Refill",
        description: "Ideal for families and medium-sized businesses. Long-lasting supply.",
        price: 2200, // $22.00 in cents
        category: "lpg",
        image: "/images/lpg-19kg-cylinder.svg",
        badge: "Most Popular",
        inStock: true,
        stockQuantity: 85,
        lowStockThreshold: 15,
        reorderLevel: 8,
        sku: "CYL-19KG-002",
        supplier: "Zimbabwe Gas Suppliers Ltd",
      },
      {
        name: "48kg Cylinder Purchase",
        description: "Heavy-duty cylinder for commercial use. Includes safety features.",
        price: 9500, // $95.00 in cents
        category: "lpg",
        image: "/images/lpg-48kg-cylinder.svg",
        badge: "Commercial Grade",
        inStock: true,
        stockQuantity: 25,
        lowStockThreshold: 5,
        reorderLevel: 3,
        sku: "CYL-48KG-003",
        supplier: "Commercial Gas Zimbabwe",
      },
      {
        name: "Empty 48kg Dual Valve Cylinder",
        description: "Professional-grade empty cylinder with dual valve system for safety.",
        price: 6000, // $60.00 in cents
        category: "lpg",
        image: "/images/lpg-48kg-empty-cylinder.svg",
        badge: "Dual Valve",
        inStock: true,
        stockQuantity: 12,
        lowStockThreshold: 5,
        reorderLevel: 2,
        sku: "CYL-48KG-EMPTY-004",
        supplier: "Commercial Gas Zimbabwe",
      },
      {
        name: "Regulator Set",
        description: "High-quality pressure regulator for safe gas flow control.",
        price: 1800, // $18.00 in cents
        category: "accessories",
        image: "https://images.unsplash.com/photo-1609696942946-a2cf2be57815?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Safety Certified",
        inStock: true,
        stockQuantity: 45,
        lowStockThreshold: 10,
        reorderLevel: 5,
        sku: "REG-STD-005",
        supplier: "Safety Parts Zimbabwe",
      },
      {
        name: "1.5m LPG Hose",
        description: "Durable, flexible hose for connecting appliances to gas supply.",
        price: 600, // $6.00 in cents
        category: "accessories",
        image: "https://images.unsplash.com/photo-1619983081563-430f63602796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "1.5m Length",
        inStock: true,
        stockQuantity: 8,
        lowStockThreshold: 15,
        reorderLevel: 10,
        sku: "HOSE-1.5M-006",
        supplier: "Safety Parts Zimbabwe",
      },
      {
        name: "Conversion Kit",
        description: "Complete kit for converting appliances to LPG operation.",
        price: 2500, // $25.00 in cents
        category: "accessories",
        image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        badge: "Universal",
        inStock: true,
        stockQuantity: 22,
        lowStockThreshold: 8,
        reorderLevel: 5,
        sku: "CONV-KIT-007",
        supplier: "Gas Solutions Zimbabwe",
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

  // Inventory Management Methods
  async updateProductStock(productId: number, newStock: number): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ 
        stockQuantity: newStock, 
        inStock: newStock > 0,
        updatedAt: new Date() 
      })
      .where(eq(products.id, productId))
      .returning();
    
    // Check if stock alert should be created
    if (newStock <= product.lowStockThreshold) {
      await this.createStockAlert({
        productId,
        alertType: newStock === 0 ? 'out_of_stock' : 'low_stock',
        currentStock: newStock,
        threshold: product.lowStockThreshold,
      });
    }
    
    return product;
  }

  async createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement> {
    const [created] = await db
      .insert(inventoryMovements)
      .values(movement)
      .returning();
    return created;
  }

  async getInventoryMovements(productId?: number): Promise<InventoryMovement[]> {
    if (productId) {
      return await db
        .select()
        .from(inventoryMovements)
        .where(eq(inventoryMovements.productId, productId))
        .orderBy(desc(inventoryMovements.createdAt));
    }
    return await db
      .select()
      .from(inventoryMovements)
      .orderBy(desc(inventoryMovements.createdAt));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(lt(products.stockQuantity, products.lowStockThreshold));
  }

  async createStockAlert(alert: InsertStockAlert): Promise<StockAlert> {
    // Check if similar alert already exists and is active
    const existingAlert = await db
      .select()
      .from(stockAlerts)
      .where(
        and(
          eq(stockAlerts.productId, alert.productId),
          eq(stockAlerts.alertType, alert.alertType),
          eq(stockAlerts.isActive, true)
        )
      );

    if (existingAlert.length > 0) {
      return existingAlert[0];
    }

    const [created] = await db
      .insert(stockAlerts)
      .values(alert)
      .returning();
    return created;
  }

  async getActiveStockAlerts(): Promise<StockAlert[]> {
    return await db
      .select()
      .from(stockAlerts)
      .where(eq(stockAlerts.isActive, true))
      .orderBy(desc(stockAlerts.createdAt));
  }

  async acknowledgeStockAlert(alertId: number, userId: string): Promise<StockAlert> {
    const [updated] = await db
      .update(stockAlerts)
      .set({
        isActive: false,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      })
      .where(eq(stockAlerts.id, alertId))
      .returning();
    return updated;
  }

  async adjustStock(
    productId: number, 
    quantity: number, 
    reason: string, 
    userId?: string, 
    notes?: string
  ): Promise<void> {
    // Get current product
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.stockQuantity + quantity;
    const movementType = quantity > 0 ? 'in' : 'out';

    // Update product stock
    await this.updateProductStock(productId, newStock);

    // Create inventory movement record
    await this.createInventoryMovement({
      productId,
      movementType,
      quantity: Math.abs(quantity),
      reason,
      userId,
      notes,
    });
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(userId: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        status: status as any,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getEmailSettings(): Promise<EmailSetting | undefined> {
    const [settings] = await db.select().from(emailSettings).limit(1);
    return settings || undefined;
  }

  async updateEmailSettings(settingsData: any, userId: string): Promise<EmailSetting> {
    const existing = await this.getEmailSettings();
    
    if (existing) {
      const [updated] = await db
        .update(emailSettings)
        .set({
          ...settingsData,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(emailSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(emailSettings)
        .values({
          ...settingsData,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .returning();
      return created;
    }
  }

  // Delivery tracking methods
  async updateOrderDeliveryStatus(orderId: number, status: string, trackingNumber?: string, estimatedDelivery?: Date): Promise<Order> {
    const updateData: any = { 
      deliveryStatus: status,
      updatedAt: new Date() 
    };
    
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;
    if (status === 'delivered') updateData.actualDelivery = new Date();
    
    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async createDeliveryEvent(event: InsertDeliveryEvent): Promise<DeliveryEvent> {
    const [created] = await db
      .insert(deliveryEvents)
      .values(event)
      .returning();
    return created;
  }

  async getDeliveryEvents(orderId: number): Promise<DeliveryEvent[]> {
    return await db
      .select()
      .from(deliveryEvents)
      .where(eq(deliveryEvents.orderId, orderId))
      .orderBy(desc(deliveryEvents.eventTimestamp));
  }

  // Gallery management methods
  async getGalleryImages(category?: string): Promise<GalleryImage[]> {
    if (category) {
      return await db
        .select()
        .from(galleryImages)
        .where(and(
          eq(galleryImages.category, category),
          eq(galleryImages.isActive, true)
        ))
        .orderBy(galleryImages.displayOrder);
    }
    return await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.isActive, true))
      .orderBy(galleryImages.displayOrder);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const [created] = await db
      .insert(galleryImages)
      .values(image)
      .returning();
    return created;
  }

  async updateGalleryImage(id: number, updates: Partial<GalleryImage>): Promise<GalleryImage> {
    const [updated] = await db
      .update(galleryImages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(galleryImages.id, id))
      .returning();
    return updated;
  }

  async deleteGalleryImage(id: number): Promise<void> {
    await db
      .update(galleryImages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(galleryImages.id, id));
  }

  // Enhanced product features
  async getProductsByStockStatus(): Promise<{ inStock: Product[], lowStock: Product[], outOfStock: Product[] }> {
    const allProducts = await this.getProducts();
    
    const inStock = allProducts.filter(p => p.stockQuantity > p.lowStockThreshold);
    const lowStock = allProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
    const outOfStock = allProducts.filter(p => p.stockQuantity === 0);
    
    return { inStock, lowStock, outOfStock };
  }

  async getUserPreviousOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.status, 'completed')
      ))
      .orderBy(desc(orders.createdAt));
  }

  // Update product details including price
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
