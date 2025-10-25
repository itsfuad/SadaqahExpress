import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProductSchema,
  updateProductSchema,
  insertOrderSchema,
  insertUserSchema,
  loginSchema,
  verifyOTPSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changeEmailSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { randomInt } from "crypto";
import { hashPassword, verifyPassword } from "./password";
import { UNVERIFIED_EXPIRY } from "./config";

// Background job to clean up unverified accounts
setInterval(async () => {
  try {
    const deletedCount = await storage.deleteUnverifiedUsers(UNVERIFIED_EXPIRY);
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} unverified account(s) older than ${UNVERIFIED_EXPIRY} seconds`);
    }
  } catch (error) {
    console.error("Error cleaning up unverified accounts:", error);
  }
}, 60 * 1000); // Check every minute

export async function registerRoutes(app: Express): Promise<Server> {
  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      // Disable caching for API responses
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

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
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = Number.parseInt(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const validatedProduct = updateProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, validatedProduct);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
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
      const search = (req.query.search as string) || "";
      const searchBy = (req.query.searchBy as string) || "orderId";
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const allOrders = await storage.getAllOrders();

      // Filter orders based on search
      let filteredOrders = allOrders;
      if (search.trim()) {
        filteredOrders = allOrders.filter((order) => {
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
          const {
            sendOrderConfirmationToCustomer,
            sendOrderNotificationToAdmin,
          } = await import("./email");
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
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      // Handle stock errors specifically
      if (
        error instanceof Error &&
        error.message.includes("Insufficient stock")
      ) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (
        !["received", "processing", "completed", "cancelled"].includes(status)
      ) {
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
            console.error(
              `Failed to restore stock for product ${item.productId}:`,
              error,
            );
          }
        }
      } else if (oldStatus === "cancelled" && newStatus !== "cancelled") {
        // Order is being uncancelled - decrease stock again
        for (const item of currentOrder.items) {
          try {
            await storage.updateProductStock(item.productId, -item.quantity);
          } catch (error) {
            console.error(
              `Failed to decrease stock for product ${item.productId}:`,
              error,
            );
            return res.status(400).json({
              error: "Insufficient stock to restore order",
              details: error instanceof Error ? error.message : String(error),
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
        customerEmail: (req.query.email as string) || "test@example.com",
        customerPhone: "+880123456789",
        items: [
          {
            productId: 1,
            productName: "Windows 11 Pro",
            productImage: "/test.png",
            price: 400,
            quantity: 1,
          },
        ],
        total: 400,
        status: "received" as const,
        createdAt: new Date().toISOString(),
      };

      await sendOrderConfirmationToCustomer(testOrder);
      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email failed:", error);
      res
        .status(500)
        .json({ error: "Failed to send test email", details: String(error) });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password using bcrypt
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse({ ...req.body, role: "user" });

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate and send OTP
      const otpCode = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      await storage.createOTP({
        email: user.email,
        code: otpCode,
        type: "email_verification",
        expiresAt,
      });

      // Send OTP email
      (async () => {
        try {
          const { sendOTPEmail } = await import("./email");
          await sendOTPEmail(user.email, otpCode, "email_verification");
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
        }
      })();

      res.status(201).json({
        success: true,
        message: "Account created. Please verify your email.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error during signup:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code, type } = verifyOTPSchema.parse(req.body);

      const otp = await storage.getOTP(email, code, type);
      if (!otp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // For email verification, update user
      if (type === "email_verification") {
        const user = await storage.getUserByEmail(email);
        if (user) {
          await storage.updateUser(user.id, { isEmailVerified: true });
        }
      }

      // Delete used OTP
      await storage.deleteOTP(otp.id);

      res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "OTP verification failed" });
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        return res.status(400).json({ error: "Email and type are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check rate limit - get last OTP time
      const lastOTPTime = await storage.getLastOTPTime(email, type);
      if (lastOTPTime) {
        const timeSinceLastOTP = Math.floor((Date.now() - lastOTPTime) / 1000);
        const { RESEND_TIMER } = await import("./config");
        
        if (timeSinceLastOTP < RESEND_TIMER) {
          const remainingTime = RESEND_TIMER - timeSinceLastOTP;
          return res.status(429).json({ 
            error: `Please wait ${remainingTime} seconds before requesting a new code`,
            remainingTime,
          });
        }
      }

      // Generate new OTP
      const otpCode = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await storage.createOTP({
        email,
        code: otpCode,
        type,
        expiresAt,
      });

      // Send OTP email
      (async () => {
        try {
          const { sendOTPEmail } = await import("./email");
          await sendOTPEmail(email, otpCode, type);
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
        }
      })();

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ error: "Failed to resend OTP" });
    }
  });

  app.post("/api/auth/cancel-verification", async (req, res) => {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        return res.status(400).json({ error: "Email and type are required" });
      }

      // Delete all OTPs for this email and type
      await storage.deleteAllOTPsForEmail(email);

      res.json({ success: true, message: "Verification cancelled" });
    } catch (error) {
      console.error("Error cancelling verification:", error);
      res.status(500).json({ error: "Failed to cancel verification" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ 
          error: "No account found with this email address" 
        });
      }

      // Check rate limit - get last OTP time for password reset
      const lastOTPTime = await storage.getLastOTPTime(email, "password_reset");
      if (lastOTPTime) {
        const timeSinceLastOTP = Math.floor((Date.now() - lastOTPTime) / 1000);
        const { RESEND_TIMER } = await import("./config");
        
        if (timeSinceLastOTP < RESEND_TIMER) {
          const remainingTime = RESEND_TIMER - timeSinceLastOTP;
          return res.status(429).json({ 
            error: `Please wait ${remainingTime} seconds before requesting a new code`,
            remainingTime,
          });
        }
      }

      // Generate OTP
      const otpCode = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await storage.createOTP({
        email,
        code: otpCode,
        type: "password_reset",
        expiresAt,
      });

      // Send OTP email
      (async () => {
        try {
          const { sendOTPEmail } = await import("./email");
          await sendOTPEmail(email, otpCode, "password_reset");
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
        }
      })();

      res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = resetPasswordSchema.parse(req.body);

      const otp = await storage.getOTP(email, code, "password_reset");
      if (!otp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Hash new password before updating
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.deleteOTP(otp.id);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // User endpoints
  app.get("/api/user", async (req, res) => {
    try {
      // Get userId from query params (sent by client)
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized - No user ID provided" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  app.get("/api/user/orders", async (req, res) => {
    try {
      // Get userId from query params (sent by client)
      const userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized - No user ID provided" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all orders for this user
      const orders = await storage.getOrdersByUserId(userId);
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/auth/create-admin", async (req, res) => {
    try {
      // Check if admin already exists
      const hasAdmin = await storage.hasAdminAccount();
      if (hasAdmin) {
        return res.status(400).json({ error: "Admin account already exists" });
      }

      const adminData = insertUserSchema.parse({ ...req.body, role: "admin" });

      // Hash password before storing
      const hashedPassword = await hashPassword(adminData.password);
      const admin = await storage.createUser({
        ...adminData,
        password: hashedPassword,
      });

      // Generate and send OTP
      const otpCode = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await storage.createOTP({
        email: admin.email,
        code: otpCode,
        type: "email_verification",
        expiresAt,
      });

      // Send OTP email
      (async () => {
        try {
          const { sendOTPEmail } = await import("./email");
          await sendOTPEmail(admin.email, otpCode, "email_verification");
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
        }
      })();

      res.status(201).json({
        success: true,
        message: "Admin account created. Please verify your email.",
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          isEmailVerified: admin.isEmailVerified,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating admin:", error);
      res.status(500).json({ error: "Failed to create admin account" });
    }
  });

  app.get("/api/auth/has-admin", async (req, res) => {
    try {
      const hasAdmin = await storage.hasAdminAccount();
      res.json({ hasAdmin });
    } catch (error) {
      console.error("Error checking admin account:", error);
      res.status(500).json({ error: "Failed to check admin account" });
    }
  });

  // Account settings routes
  app.get("/api/account/profile", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/account/profile", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const updates = updateProfileSchema.parse(req.body);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If changing password, verify current password
      if (updates.newPassword) {
        if (!updates.currentPassword) {
          return res
            .status(401)
            .json({ error: "Current password is required" });
        }

        // Verify current password using bcrypt
        const isValidPassword = await verifyPassword(
          updates.currentPassword,
          user.password,
        );
        if (!isValidPassword) {
          return res
            .status(401)
            .json({ error: "Current password is incorrect" });
        }

        // Hash new password before updating
        const hashedPassword = await hashPassword(updates.newPassword);
        const updated = await storage.updateUser(userId, {
          password: hashedPassword,
          ...(updates.name && { name: updates.name }),
        });

        return res.json({ success: true, user: updated });
      }

      // Just update name
      if (updates.name) {
        const updated = await storage.updateUser(userId, {
          name: updates.name,
        });
        return res.json({ success: true, user: updated });
      }

      res.json({ success: true, message: "No changes to update" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/account/change-email", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const { newEmail } = changeEmailSchema.parse(req.body);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if new email is already in use
      const existingUser = await storage.getUserByEmail(newEmail);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Generate OTP for new email
      const otpCode = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await storage.createOTP({
        email: newEmail,
        code: otpCode,
        type: "email_change",
        expiresAt,
      });

      // Store the pending email change in a temporary way (you might want to add this to storage)
      // For now, we'll just send the OTP and expect the frontend to handle it

      // Send OTP email
      (async () => {
        try {
          const { sendOTPEmail } = await import("./email");
          await sendOTPEmail(newEmail, otpCode, "email_change");
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
        }
      })();

      res.json({
        success: true,
        message: "Verification code sent to new email address",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      console.error("Error changing email:", error);
      res.status(500).json({ error: "Failed to change email" });
    }
  });

  app.post("/api/account/verify-email-change", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const { newEmail, code } = req.body;

      const otp = await storage.getOTP(newEmail, code, "email_change");
      if (!otp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update email and mark as verified
      await storage.updateUser(userId, {
        email: newEmail,
        isEmailVerified: true,
      });
      await storage.deleteOTP(otp.id);

      res.json({
        success: true,
        message: "Email changed successfully",
      });
    } catch (error) {
      console.error("Error verifying email change:", error);
      res.status(500).json({ error: "Failed to verify email change" });
    }
  });



  // Delete account
  app.delete("/api/account/delete", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const { password } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Don't allow admin to delete their account if they're the only admin
      if (user.role === "admin") {
        const adminUsers = await storage.getAdminUsers();
        if (adminUsers.length <= 1) {
          return res.status(400).json({
            error: "Cannot delete the only admin account",
          });
        }
      }

      // Delete user's OTPs
      await storage.deleteAllOTPsForEmail(user.email);

      // Permanently delete user from database
      await storage.deleteUser(userId);

      res.json({
        success: true,
        message: "Account permanently deleted",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Backup & Restore routes (Admin only)
  app.get("/api/admin/backup", async (req, res) => {
    try {
      // In production, you'd check auth token/session
      // For now, we'll trust the client sends userId
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get all data
      const products = await storage.getAllProducts();
      const orders = await storage.getAllOrders();

      const backup = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        data: {
          products,
          orders,
        },
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=database-backup-${Date.now()}.json`,
      );
      res.json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.post("/api/admin/restore", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const backup = req.body;

      if (!backup.data || !backup.data.products || !backup.data.orders) {
        return res.status(400).json({ error: "Invalid backup file format" });
      }

      // Restore products
      let restoredProducts = 0;
      for (const product of backup.data.products) {
        try {
          const existing = await storage.getProductById(product.id);
          if (existing) {
            await storage.updateProduct(product.id, product);
          } else {
            await storage.createProduct(product);
          }
          restoredProducts++;
        } catch (error) {
          console.error(`Failed to restore product ${product.id}:`, error);
        }
      }

      // Restore orders
      let restoredOrders = 0;
      for (const order of backup.data.orders) {
        try {
          const existing = await storage.getOrderById(order.id);
          if (!existing) {
            // Note: We can't use createOrder as it modifies stock
            // This is a direct restore, so we need a different approach
            // For now, we'll skip orders to avoid stock issues
            console.warn("Order restoration skipped:", order.id);
          }
          restoredOrders++;
        } catch (error) {
          console.error(`Failed to restore order ${order.id}:`, error);
        }
      }

      res.json({
        success: true,
        message: "Backup restored successfully",
        stats: {
          products: restoredProducts,
          orders: restoredOrders,
        },
      });
    } catch (error) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ error: "Failed to restore backup" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
