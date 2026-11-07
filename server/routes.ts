import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { orders, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { insertInquirySchema, insertOrderSchema, insertInventoryMovementSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, isStaff, toPublicUser, ROLES, isOwnerEmail } from "./auth";
import { syncCatalogueDefaults } from "./content-sync";
import { registerAdminRoutes } from "./admin-routes";
import { notifyBusiness } from "./mailer";
import { describeItems } from "./orders";
import {
  buildOrderItems,
  newPaymentReference,
  getPaynow,
  verifyAndApplyPaynowStatus,
  findOrderByReference,
  findOrderById,
  OrderInputError,
} from "./orders";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  await syncCatalogueDefaults();
  await registerAdminRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user ? toPublicUser(user) : null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Create inquiry
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      notifyBusiness(`New website enquiry from ${inquiry.name}`, [
        ["Name", inquiry.name],
        ["Phone", inquiry.phone],
        ["Email", inquiry.email],
        ["Type", inquiry.inquiryType],
        ["Message", inquiry.message],
      ], inquiry.email || undefined);
      res.status(201).json({ id: inquiry.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inquiry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // Create order (cash / EcoCash on delivery). Prices are computed on the server.
  app.post("/api/orders", async (req: any, res) => {
    try {
      const body = req.body || {};
      const customerName = String(body.customerName || "").trim().slice(0, 120);
      const customerPhone = String(body.customerPhone || body.phoneNumber || "").trim().slice(0, 40);
      const deliveryAddress = String(body.deliveryAddress || "").trim().slice(0, 500);
      const paymentMethod = String(body.paymentMethod || "").trim().slice(0, 40);
      if (!customerName || !customerPhone || !deliveryAddress || !paymentMethod) {
        return res.status(400).json({ error: "Name, phone, delivery address and payment method are required" });
      }

      const { items, totalCents } = await buildOrderItems(body.items);
      const userId = req.isAuthenticated && req.isAuthenticated() && req.user ? req.user.claims.sub : null;

      const order = await storage.createOrder({
        userId,
        customerName,
        customerPhone,
        phoneNumber: customerPhone,
        email: body.email ? String(body.email).slice(0, 200) : null,
        deliveryAddress,
        paymentMethod,
        paymentStatus: "pending",
        items: JSON.stringify(items),
        total: totalCents,
        totalAmount: totalCents,
      } as any);
      notifyBusiness(`New order #${order.id} (${paymentMethod}, pay on delivery)`, [
        ["Order", `#${order.id}`],
        ["Total", `$${(totalCents / 100).toFixed(2)}`],
        ["Payment", paymentMethod],
        ["Customer", customerName],
        ["Phone", customerPhone],
        ["Delivery address", deliveryAddress],
        ["Items", describeItems(items)],
      ]);
      res.status(201).json({ id: order.id, total: order.total, status: order.status });
    } catch (error) {
      if (error instanceof OrderInputError) return res.status(400).json({ error: error.message });
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get user's order history (protected route)
  app.get("/api/my-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get all orders (for admin purposes)
  app.get("/api/orders", isStaff, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Update order status (protected route)
  app.patch("/api/orders/:id/status", isStaff, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Inventory Management Routes

  // Get low stock products
  app.get("/api/inventory/low-stock", isStaff, async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  // Get stock alerts
  app.get("/api/inventory/alerts", isStaff, async (req, res) => {
    try {
      const alerts = await storage.getActiveStockAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      res.status(500).json({ error: "Failed to fetch stock alerts" });
    }
  });

  // Acknowledge stock alert
  app.patch("/api/inventory/alerts/:id/acknowledge", isStaff, async (req: any, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      if (isNaN(alertId)) {
        return res.status(400).json({ error: "Invalid alert ID" });
      }

      const alert = await storage.acknowledgeStockAlert(alertId, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error acknowledging stock alert:", error);
      res.status(500).json({ error: "Failed to acknowledge stock alert" });
    }
  });

  // Update product stock
  app.patch("/api/products/:id/stock", isStaff, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { stockQuantity } = req.body;
      const userId = req.user.claims.sub;

      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Valid stock quantity is required" });
      }

      const product = await storage.updateProductStock(productId, stockQuantity);
      
      // Create inventory movement record
      await storage.createInventoryMovement({
        productId,
        movementType: 'adjustment',
        quantity: stockQuantity,
        reason: 'manual_adjustment',
        userId,
        notes: 'Stock updated via admin interface',
      });

      res.json(product);
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({ error: "Failed to update product stock" });
    }
  });

  // Adjust stock (add/remove inventory)
  app.post("/api/inventory/adjust", isStaff, async (req: any, res) => {
    try {
      const { productId, quantity, reason, notes } = req.body;
      const userId = req.user.claims.sub;

      if (!productId || typeof quantity !== 'number' || !reason) {
        return res.status(400).json({ error: "Product ID, quantity, and reason are required" });
      }

      await storage.adjustStock(productId, quantity, reason, userId, notes);
      res.json({ message: "Stock adjusted successfully" });
    } catch (error) {
      console.error("Error adjusting stock:", error);
      res.status(500).json({ error: "Failed to adjust stock" });
    }
  });

  // Get inventory movements
  app.get("/api/inventory/movements", isStaff, async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const movements = await storage.getInventoryMovements(productId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      res.status(500).json({ error: "Failed to fetch inventory movements" });
    }
  });

  // PayNow payment integration. Prices come from the database, and an order is
  // only marked paid after Paynow confirms it (see server/orders.ts).
  app.post("/api/create-paynow-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { phoneNumber, email } = req.body || {};
      const userId = req.user.claims.sub;
      const customerName = String(req.body?.customerName || req.user.claims.email || "Customer").slice(0, 120);
      const payerEmail = String(email || req.user.claims.email || "").trim();
      if (!payerEmail) return res.status(400).json({ success: false, error: "Email is required" });
      if (!phoneNumber) return res.status(400).json({ success: false, error: "Phone number is required" });

      const { items, totalCents } = await buildOrderItems(req.body?.items);
      const reference = newPaymentReference();

      // Create the order first so the return link can carry its id.
      const order = await storage.createOrder({
        userId,
        status: "pending",
        total: totalCents,
        totalAmount: totalCents,
        paymentMethod: "paynow",
        paymentStatus: "pending",
        items: JSON.stringify(items),
        customerName,
        customerPhone: String(phoneNumber).slice(0, 40),
        phoneNumber: String(phoneNumber).slice(0, 40),
        email: payerEmail,
        deliveryAddress: "TBD",
        paynowReference: reference,
      } as any);

      const base = `${req.protocol}://${req.get("host")}`;
      const paynow = getPaynow(`${base}/api/paynow/result`, `${base}/api/paynow/return?order=${order.id}`);
      const payment = paynow.createPayment(reference, payerEmail);
      for (const item of items) {
        // Paynow expects amounts in dollars; our prices are stored in cents.
        payment.add(`${item.product.name} x${item.quantity}`, (item.product.price * item.quantity) / 100);
      }

      const response: any = await paynow.send(payment);
      if (!response?.success) {
        console.error("PayNow payment creation failed:", response?.error);
        await storage.updateOrderStatus(order.id, "cancelled");
        return res.status(400).json({ success: false, error: response?.error || "Failed to create payment" });
      }

      await db.update(orders).set({ pollUrl: response.pollUrl, updatedAt: new Date() }).where(eq(orders.id, order.id));

      try {
        await storage.createDeliveryEvent({
          orderId: order.id,
          eventType: "pending",
          eventDescription: "Order placed and awaiting payment confirmation",
          createdBy: userId,
        } as any);
      } catch (error) {
        console.error("Error creating delivery event:", error);
      }

      res.json({
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        reference,
        orderId: order.id,
      });
    } catch (error) {
      if (error instanceof OrderInputError) return res.status(400).json({ success: false, error: error.message });
      console.error("PayNow payment error:", error);
      res.status(500).json({ success: false, error: "Payment processing failed" });
    }
  });

  // Where Paynow sends the customer's browser after paying (a normal link, so GET).
  const handlePaynowReturn = async (req: any, res: any) => {
    try {
      const orderId = parseInt(String(req.query.order || req.body?.order || ""), 10);
      const order = Number.isInteger(orderId) ? await findOrderById(orderId) : undefined;
      if (!order) return res.redirect("/?payment=error");

      const status = await verifyAndApplyPaynowStatus(order);
      if (status && ["paid", "awaiting delivery", "delivered"].includes(status)) {
        return res.redirect(`/?payment=success&order=${order.id}`);
      }
      if (status && ["cancelled", "failed"].includes(status)) {
        return res.redirect(`/?payment=failed&order=${order.id}`);
      }
      // Not confirmed yet (e.g. EcoCash prompt still open) - Paynow will notify us.
      return res.redirect(`/?payment=pending&order=${order.id}`);
    } catch (error) {
      console.error("PayNow return handler error:", error);
      res.redirect("/?payment=error");
    }
  };
  app.get("/api/paynow/return", handlePaynowReturn);
  app.post("/api/paynow/return", handlePaynowReturn);

  // Paynow server-to-server notification. We never trust the posted status:
  // we look the order up by reference and ask Paynow directly.
  app.post("/api/paynow/result", async (req, res) => {
    try {
      const reference = String(req.body?.reference || "");
      if (reference) {
        const order = await findOrderByReference(reference);
        if (order) {
          const status = await verifyAndApplyPaynowStatus(order);
          console.log(`PayNow update for order #${order.id}: ${status ?? "unverified"}`);
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("PayNow webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Admin API Routes
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(toPublicUser));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user status (admin only)
  app.patch("/api/admin/users/:id", isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      
      if (!['active', 'suspended', 'deleted'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      if (userId === req.user.claims.sub) {
        return res.status(400).json({ error: "You can't change your own account status." });
      }
      const target = await storage.getUser(userId);
      if (!target) return res.status(404).json({ error: "User not found" });
      if (isOwnerEmail(target.email)) {
        return res.status(400).json({ error: "The owner account can't be suspended." });
      }

      const user = await storage.updateUserStatus(userId, status);
      res.json(toPublicUser(user));
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Change a user's role (admin only): user | staff | admin
  app.patch("/api/admin/users/:id/role", isAdmin, async (req: any, res) => {
    try {
      const targetId = String(req.params.id);
      const role = String(req.body?.role || "");
      if (!(ROLES as readonly string[]).includes(role)) {
        return res.status(400).json({ error: "Role must be user, staff or admin" });
      }
      if (targetId === req.user.claims.sub) {
        return res.status(400).json({ error: "You can't change your own role." });
      }
      const target = await storage.getUser(targetId);
      if (!target) return res.status(404).json({ error: "User not found" });
      if (isOwnerEmail(target.email)) {
        return res.status(400).json({ error: "The owner account is always an admin." });
      }
      const [updated] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, targetId))
        .returning();
      console.log(`Role change: ${req.user.claims.email} set ${target.email} to ${role}`);
      res.json(toPublicUser(updated));
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // Get all orders (admin only)
  app.get("/api/admin/orders", isStaff, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get all products (admin only)
  app.get("/api/admin/products", isStaff, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get email settings (admin only)
  app.get("/api/admin/email-settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ error: "Failed to fetch email settings" });
    }
  });

  // Update email settings (admin only)
  app.put("/api/admin/email-settings", isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.updateEmailSettings(req.body, userId);
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  // Delivery tracking routes (admin only)
  app.patch("/api/admin/orders/:id/delivery", isStaff, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { deliveryStatus, trackingNumber } = req.body;
      const userId = req.user.claims.sub;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const order = await storage.updateOrderDeliveryStatus(orderId, deliveryStatus, trackingNumber);
      
      // Create delivery event
      await storage.createDeliveryEvent({
        orderId,
        eventType: deliveryStatus,
        eventDescription: `Order status updated to ${deliveryStatus}`,
        createdBy: userId
      });

      res.json(order);
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  app.get("/api/admin/delivery-events/:orderId", isStaff, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const events = await storage.getDeliveryEvents(orderId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching delivery events:", error);
      res.status(500).json({ error: "Failed to fetch delivery events" });
    }
  });

  // Stock management routes (admin only)
  app.get("/api/admin/stock-status", isStaff, async (req, res) => {
    try {
      const stockStatus = await storage.getProductsByStockStatus();
      res.json(stockStatus);
    } catch (error) {
      console.error("Error fetching stock status:", error);
      res.status(500).json({ error: "Failed to fetch stock status" });
    }
  });

  // Gallery management routes (admin only)
  app.get("/api/admin/gallery-images", isAdmin, async (req, res) => {
    try {
      const category = req.query.category as string;
      const images = await storage.getGalleryImages(category);
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  // Upload new image to gallery (admin only)
  app.post("/api/admin/gallery/upload", isAdmin, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { category, altText, productId, imageName } = req.body;
      const userId = req.user.claims.sub;
      
      // Create gallery image record
      const imageData = {
        category: category || 'gallery',
        productId: productId ? parseInt(productId) : null,
        imageName: imageName || req.file.originalname,
        imageUrl: `/uploads/${req.file.filename}`,
        altText: altText || '',
        fileSize: req.file.size,
        uploadedBy: userId,
        isActive: true
      };

      const galleryImage = await storage.createGalleryImage(imageData);
      // Uploading straight to a product makes it that product's shop picture.
      if (imageData.productId) {
        await storage.updateProduct(imageData.productId, { image: galleryImage.imageUrl } as any);
      }
      res.status(201).json(galleryImage);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Link existing gallery image to product (admin only)
  app.put("/api/admin/gallery-images/:id/link-product", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { productId } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid gallery image ID" });
      }

      const updated = await storage.updateGalleryImage(id, { 
        productId: productId ? parseInt(productId) : null,
        category: productId ? 'product' : 'gallery'
      });
      // Linking an image to a product makes it that product's picture in the shop.
      if (productId && updated?.imageUrl) {
        await storage.updateProduct(parseInt(productId), { image: updated.imageUrl } as any);
      }
      res.json(updated);
    } catch (error) {
      console.error("Error linking image to product:", error);
      res.status(500).json({ error: "Failed to link image to product" });
    }
  });

  // Update gallery image
  app.put("/api/admin/gallery-images/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }
      
      const updated = await storage.updateGalleryImage(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      res.status(500).json({ error: "Failed to update gallery image" });
    }
  });

  // Update product image specifically
  app.put("/api/admin/products/:id/image", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const { image } = req.body;
      const updated = await storage.updateProduct(id, { image });
      res.json(updated);
    } catch (error) {
      console.error("Error updating product image:", error);
      res.status(500).json({ error: "Failed to update product image" });
    }
  });

  // Previous orders for reordering (authenticated users)
  app.get("/api/user/previous-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserPreviousOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching previous orders:", error);
      res.status(500).json({ error: "Failed to fetch previous orders" });
    }
  });

  // Get user's previous orders for reorder functionality
  app.get("/api/user/previous-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      
      // Return only delivered orders for reorder functionality
      const deliveredOrders = orders.filter(order => 
        order.status === 'delivered' || order.status === 'confirmed'
      );
      
      res.json(deliveredOrders);
    } catch (error) {
      console.error("Error fetching user's previous orders:", error);
      res.status(500).json({ error: "Failed to fetch previous orders" });
    }
  });

  // Serve uploaded images (express.static blocks path traversal like /uploads/../..)
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "client", "public", "uploads"), { fallthrough: false, maxAge: "7d" }),
  );

  const httpServer = createServer(app);
  return httpServer;
}
