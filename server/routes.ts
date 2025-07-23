import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInquirySchema, insertOrderSchema, insertInventoryMovementSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { Paynow } from "paynow";

// Admin middleware to check if user is admin
const isAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user || (user as any).role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inquiry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // Create order (with optional user authentication)
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // If user is authenticated, add userId to order
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const userId = (req.user as any).claims.sub;
        validatedData.userId = userId;
      }
      
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
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
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Update order status (protected route)
  app.patch("/api/orders/:id/status", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/inventory/low-stock", isAuthenticated, async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  // Get stock alerts
  app.get("/api/inventory/alerts", isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getActiveStockAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      res.status(500).json({ error: "Failed to fetch stock alerts" });
    }
  });

  // Acknowledge stock alert
  app.patch("/api/inventory/alerts/:id/acknowledge", isAuthenticated, async (req: any, res) => {
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
  app.patch("/api/products/:id/stock", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/inventory/adjust", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/inventory/movements", isAuthenticated, async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const movements = await storage.getInventoryMovements(productId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      res.status(500).json({ error: "Failed to fetch inventory movements" });
    }
  });

  // PayNow payment integration
  app.post("/api/create-paynow-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { items, total, phoneNumber, email, customerName } = req.body;
      const userId = req.user.claims.sub;

      // Initialize PayNow
      const paynow = new Paynow(
        process.env.PAYNOW_INTEGRATION_ID || "13431",
        process.env.PAYNOW_INTEGRATION_KEY || "mock-key",
        `${req.protocol}://${req.get('host')}/api/paynow/return`,
        `${req.protocol}://${req.get('host')}/api/paynow/result`
      );

      // Create a new payment
      const payment = paynow.createPayment(`Order-${Date.now()}`, email);

      // Add items to the payment
      items.forEach((item: any) => {
        payment.add(item.name, item.price * item.quantity);
      });

      // Send payment to PayNow
      const response = await paynow.send(payment);

      if (response.success) {
        // Create order in database
        const orderData = {
          userId,
          status: 'pending',
          total: Math.round(total * 100), // convert to cents
          paymentMethod: 'paynow',
          paymentStatus: 'pending',
          items: JSON.stringify(items),
          customerName,
          customerPhone: phoneNumber,
          phoneNumber,
          email,
          deliveryAddress: 'TBD', // Set default delivery address
          paynowReference: response.reference,
          pollUrl: response.pollurl
        };

        const order = await storage.createOrder(orderData);

        res.json({
          success: true,
          redirectUrl: response.redirecturl,
          pollUrl: response.pollurl,
          reference: response.reference,
          orderId: order.id
        });
      } else {
        console.error("PayNow payment creation failed:", response.error);
        res.status(400).json({
          success: false,
          error: response.error || "Failed to create payment"
        });
      }
    } catch (error) {
      console.error("PayNow payment error:", error);
      res.status(500).json({
        success: false,
        error: "Payment processing failed"
      });
    }
  });

  // PayNow return URL handler
  app.post("/api/paynow/return", async (req, res) => {
    try {
      const { reference, paynowreference, amount, status } = req.body;
      
      // Update order status based on payment result
      if (status === "Paid") {
        // Find and update the order
        const orders = await storage.getOrders();
        const order = orders.find(o => o.paynowReference === reference);
        
        if (order) {
          await storage.updateOrderStatus(order.id, 'confirmed');
          
          // Update inventory for paid orders
          const orderItems = JSON.parse(order.items || '[]');
          for (const item of orderItems) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Math.max(0, product.stockQuantity - item.quantity);
              await storage.updateProductStock(item.productId, newStock);
              
              // Create inventory movement
              await storage.createInventoryMovement({
                productId: item.productId,
                movementType: 'sale',
                quantity: -item.quantity,
                reason: 'order_fulfillment',
                notes: `Order #${order.id} - PayNow payment`
              });
            }
          }
        }
        
        res.redirect(`/?payment=success&order=${order?.id}`);
      } else {
        res.redirect(`/?payment=failed&reason=${status}`);
      }
    } catch (error) {
      console.error("PayNow return handler error:", error);
      res.redirect("/?payment=error");
    }
  });

  // PayNow result URL handler (webhook)
  app.post("/api/paynow/result", async (req, res) => {
    try {
      const { reference, paynowreference, amount, status } = req.body;
      
      console.log("PayNow webhook received:", { reference, status });
      
      // Update order status
      if (reference) {
        const orders = await storage.getOrders();
        const order = orders.find(o => o.paynowReference === reference);
        
        if (order) {
          if (status === "Paid") {
            await storage.updateOrderStatus(order.id, 'confirmed');
          } else if (status === "Cancelled" || status === "Failed") {
            await storage.updateOrderStatus(order.id, 'cancelled');
          }
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
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user status (admin only)
  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      
      if (!['active', 'suspended', 'deleted'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const user = await storage.updateUserStatus(userId, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Get all orders (admin only)
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get all products (admin only)
  app.get("/api/admin/products", isAdmin, async (req, res) => {
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
  app.put("/api/admin/email-settings", isAdmin, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.updateEmailSettings(req.body, userId);
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
