import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      // Disable caching for API responses
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const category = req.query.category as string | undefined;
      
      if (category && category !== "all") {
        const products = await storage.getProductsByCategory(category);
        return res.json(products);
      }
      
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const validatedProduct = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedProduct);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || "";
      const searchBy = req.query.searchBy as string || "orderId";
      const sortBy = req.query.sortBy as string || "createdAt";
      const sortOrder = req.query.sortOrder as string || "desc";

      const allOrders = await storage.getAllOrders();
      
      // Filter orders based on search
      let filteredOrders = allOrders;
      if (search.trim()) {
        filteredOrders = allOrders.filter(order => {
          const searchLower = search.toLowerCase();
          switch (searchBy) {
            case "orderId":
              return order.id.toLowerCase().includes(searchLower);
            case "customerName":
              return order.customerName.toLowerCase().includes(searchLower);
            case "customerEmail":
              return order.customerEmail.toLowerCase().includes(searchLower);
            default:
              return order.id.toLowerCase().includes(searchLower);
          }
        });
      }

      // Sort orders
      filteredOrders.sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sortBy) {
          case "orderId":
            aVal = a.id;
            bVal = b.id;
            break;
          case "customerName":
            aVal = a.customerName.toLowerCase();
            bVal = b.customerName.toLowerCase();
            break;
          case "customerEmail":
            aVal = a.customerEmail.toLowerCase();
            bVal = b.customerEmail.toLowerCase();
            break;
          case "createdAt":
          default:
            aVal = new Date(a.createdAt).getTime();
            bVal = new Date(b.createdAt).getTime();
        }
        
        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Paginate
      const total = filteredOrders.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      res.json({
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedOrder = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedOrder);
      
      // Send email notifications asynchronously
      (async () => {
        try {
          const { sendOrderConfirmationToCustomer, sendOrderNotificationToAdmin } = await import("./email");
          await Promise.all([
            sendOrderConfirmationToCustomer(order),
            sendOrderNotificationToAdmin(order),
          ]);
        } catch (emailError) {
          console.error("Failed to send order emails:", emailError);
        }
      })();
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      // Handle stock errors specifically
      if (error instanceof Error && error.message.includes("Insufficient stock")) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["received", "processing", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Get the current order to check its current status
      const currentOrder = await storage.getOrderById(req.params.id);
      if (!currentOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      const oldStatus = currentOrder.status;
      const newStatus = status;

      // Handle stock updates based on status changes
      if (oldStatus !== "cancelled" && newStatus === "cancelled") {
        // Order is being cancelled - restore stock
        for (const item of currentOrder.items) {
          try {
            await storage.updateProductStock(item.productId, item.quantity);
          } catch (error) {
            console.error(`Failed to restore stock for product ${item.productId}:`, error);
          }
        }
      } else if (oldStatus === "cancelled" && newStatus !== "cancelled") {
        // Order is being uncancelled - decrease stock again
        for (const item of currentOrder.items) {
          try {
            await storage.updateProductStock(item.productId, -item.quantity);
          } catch (error) {
            console.error(`Failed to decrease stock for product ${item.productId}:`, error);
            return res.status(400).json({ 
              error: "Insufficient stock to restore order", 
              details: error instanceof Error ? error.message : String(error) 
            });
          }
        }
      }

      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Product delivery email is disabled for now
      // if (status === "completed") {
      //   (async () => {
      //     try {
      //       const { sendProductDeliveryEmail } = await import("./email");
      //       await sendProductDeliveryEmail(order);
      //     } catch (emailError) {
      //       console.error("Failed to send delivery email:", emailError);
      //     }
      //   })();
      // }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Test email endpoint (for debugging)
  app.get("/api/test-email", async (req, res) => {
    try {
      const { sendOrderConfirmationToCustomer } = await import("./email");
      const testOrder = {
        id: "TEST-001",
        customerName: "Test User",
        customerEmail: req.query.email as string || "test@example.com",
        customerPhone: "+880123456789",
        items: [{
          productId: 1,
          productName: "Windows 11 Pro",
          productImage: "/test.png",
          price: 400,
          quantity: 1,
        }],
        total: 400,
        status: "received" as const,
        createdAt: new Date().toISOString(),
      };
      
      await sendOrderConfirmationToCustomer(testOrder);
      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email failed:", error);
      res.status(500).json({ error: "Failed to send test email", details: String(error) });
    }
  });

  // User/Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // In production, use proper session management
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username } 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
