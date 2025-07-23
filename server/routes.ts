import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInquirySchema, insertOrderSchema, insertInventoryMovementSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { Paynow } from "paynow";

// Admin middleware to check if user is admin (andrewsbulle@gmail.com)
const isAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userEmail = req.user?.claims?.email;
  if (userEmail !== "andrewsbulle@gmail.com") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
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

  // Update product (admin only)
  app.put("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const updated = await storage.updateProduct(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
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
        
        // Create initial delivery event
        try {
          await storage.createDeliveryEvent({
            orderId: order.id,
            eventType: 'pending',
            eventDescription: 'Order placed and awaiting payment confirmation',
            createdBy: userId
          });
        } catch (error) {
          console.error("Error creating delivery event:", error);
        }

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
          
          // Update inventory for paid orders and trigger delivery tracking
          const orderItems = JSON.parse(order.items || '[]');
          for (const item of orderItems) {
            try {
              // Use the new adjustStock method which handles both stock update and inventory movement
              await storage.adjustStock(
                item.product.id,
                -item.quantity,
                'sale',
                order.userId,
                `Order #${order.id} - ${item.product.name} (PayNow payment confirmed)`
              );
            } catch (error) {
              console.error(`Error adjusting stock for product ${item.product.id}:`, error);
            }
          }
          
          // Create delivery tracking event for confirmed payment
          try {
            await storage.createDeliveryEvent({
              orderId: order.id,
              eventType: 'confirmed',
              eventDescription: 'Payment confirmed - Order ready for pickup/delivery',
              createdBy: order.userId
            });
          } catch (error) {
            console.error("Error creating delivery event:", error);
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

  // Delivery tracking routes (admin only)
  app.patch("/api/admin/orders/:id/delivery", isAdmin, async (req, res) => {
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

  app.get("/api/admin/delivery-events/:orderId", isAdmin, async (req, res) => {
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
  app.get("/api/admin/stock-status", isAdmin, async (req, res) => {
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

  app.post("/api/admin/gallery/upload", isAdmin, async (req, res) => {
    try {
      // This is a placeholder for file upload functionality
      // In a real implementation, you'd use multer or similar for file handling
      res.json({ 
        success: true, 
        message: "File upload endpoint - would need multer implementation" 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
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

  const httpServer = createServer(app);
  return httpServer;
}
