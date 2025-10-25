import {
  type Product,
  type Order,
  type User,
  type OTP,
  type PendingUser,
  type InsertProduct,
  type InsertOrder,
  type InsertUser,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { createClient } from "redis";

export interface IStorage {
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: number,
    product: Partial<InsertProduct>,
  ): Promise<Product | undefined>;
  updateProductStock(
    id: number,
    quantityChange: number,
  ): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Order methods
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  linkOrdersByEmail(email: string, userId: string): Promise<number>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(
    id: string,
    status: Order["status"],
  ): Promise<Order | undefined>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  hasAdminAccount(): Promise<boolean>;
  getAdminUsers(): Promise<User[]>;

  // Pending User methods
  createPendingUser(user: InsertUser): Promise<void>;
  getPendingUser(email: string): Promise<PendingUser | undefined>;
  deletePendingUser(email: string): Promise<boolean>;

  // OTP methods
  createOTP(otp: {
    email: string;
    code: string;
    type: OTP["type"];
    expiresAt: string;
  }): Promise<OTP>;
  getOTP(
    email: string,
    code: string,
    type: OTP["type"],
  ): Promise<OTP | undefined>;
  getLastOTPTime(email: string, type: OTP["type"]): Promise<number | null>;
  deleteOTP(id: string): Promise<boolean>;
  deleteAllOTPsForEmail(email: string): Promise<void>;
  
  // Cleanup methods
  deleteUnverifiedUsers(olderThanSeconds: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private orders: Map<string, Order>;
  private users: Map<string, User>;
  private pendingUsers: Map<string, PendingUser>;
  private otps: Map<string, OTP>;
  private nextProductId: number;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.users = new Map();
    this.pendingUsers = new Map();
    this.otps = new Map();
    this.nextProductId = 1;
    // this.initializeData(); // Removed - no dummy data
  }

  private initializeData() {
    // Initialize with sample products
    const sampleProducts: Omit<Product, "id">[] = [
      {
        name: "Windows 11 Pro",
        description:
          "Windows 11 Pro Digital License - Lifetime activation for 1 PC",
        image: "/placeholder-win11.png",
        price: 400.0,
        originalPrice: 850.0,
        rating: 5,
        reviewCount: 19,
        badge: "Bestseller",
        category: "microsoft",
        stock: 50,
      },
      {
        name: "Windows 10 Pro",
        description: "Windows 10 Pro Digital License - Lifetime activation",
        image: "/placeholder-win10.png",
        price: 350.0,
        originalPrice: 399.0,
        rating: 4,
        reviewCount: 62,
        category: "microsoft",
        stock: 100,
      },
      {
        name: "Windows + Office Combo",
        description: "Windows 10 Pro + Office 2021 Bundle",
        image: "/placeholder-combo.png",
        price: 600.0,
        originalPrice: 800.0,
        rating: 5,
        reviewCount: 45,
        badge: "Sale",
        category: "microsoft",
        stock: 30,
      },
      {
        name: "Microsoft Office 365",
        description: "Office 365 Personal - 1 Year Subscription",
        image: "/placeholder-office365.png",
        price: 400.0,
        originalPrice: 600.0,
        rating: 4,
        reviewCount: 14,
        category: "microsoft",
        stock: 75,
      },
      {
        name: "Microsoft Office 2021 Pro Plus",
        description: "Office 2021 Professional Plus - Lifetime License",
        image: "/placeholder-office2021.png",
        price: 500.0,
        originalPrice: 1500.0,
        rating: 5,
        reviewCount: 86,
        category: "microsoft",
        stock: 60,
      },
    ];

    sampleProducts.forEach((product) => {
      const id = this.nextProductId++;
      this.products.set(id, { id, ...product });
    });

    // Create default admin user
    // No default admin - removed
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (p) => p.category === category,
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.nextProductId++;
    const product: Product = { id, ...insertProduct };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(
    id: number,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async updateProductStock(
    id: number,
    quantityChange: number,
  ): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const newStock = product.stock + quantityChange;
    if (newStock < 0) {
      throw new Error(
        `Insufficient stock for product ${id}. Available: ${product.stock}, Requested: ${Math.abs(quantityChange)}`,
      );
    }

    const updated = { ...product, stock: newStock };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    // Get user to fetch their email
    const user = this.users.get(userId);
    if (!user) return [];
    
    // Filter orders by email
    return Array.from(this.orders.values())
      .filter(order => order.customerEmail === user.email)
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async linkOrdersByEmail(email: string, userId: string): Promise<number> {
    // No need to link - orders are already tracked by email
    // This method is kept for compatibility but does nothing
    return 0;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Decrease stock for all products in the order
    for (const item of insertOrder.items) {
      await this.updateProductStock(item.productId, -item.quantity);
    }

    const id = `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const order: Order = {
      id,
      ...insertOrder,
      status: "received",
      createdAt: new Date().toISOString(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(
    id: string,
    status: Order["status"],
  ): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    order.status = status;
    this.orders.set(id, order);
    return order;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role || "user",
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async hasAdminAccount(): Promise<boolean> {
    return Array.from(this.users.values()).some(
      (user) => user.role === "admin",
    );
  }

  async getAdminUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "admin",
    );
  }

  // Pending User methods
  async createPendingUser(insertUser: InsertUser): Promise<void> {
    const now = new Date().toISOString();
    const pendingUser: PendingUser = {
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role || "user",
      createdAt: now,
    };
    this.pendingUsers.set(insertUser.email.toLowerCase(), pendingUser);

    // Auto-expire after 15 minutes
    setTimeout(
      () => {
        this.pendingUsers.delete(insertUser.email.toLowerCase());
      },
      15 * 60 * 1000,
    );
  }

  async getPendingUser(email: string): Promise<PendingUser | undefined> {
    return this.pendingUsers.get(email.toLowerCase());
  }

  async deletePendingUser(email: string): Promise<boolean> {
    return this.pendingUsers.delete(email.toLowerCase());
  }

  // OTP methods
  async createOTP(otpData: {
    email: string;
    code: string;
    type: OTP["type"];
    expiresAt: string;
  }): Promise<OTP> {
    const id = randomUUID();
    const otp: OTP = {
      id,
      email: otpData.email.toLowerCase(),
      code: otpData.code,
      type: otpData.type,
      expiresAt: otpData.expiresAt,
      createdAt: new Date().toISOString(),
    };
    this.otps.set(id, otp);

    // Auto-delete after expiry
    const expiryTime = new Date(otpData.expiresAt).getTime() - Date.now();
    if (expiryTime > 0) {
      setTimeout(() => {
        this.otps.delete(id);
      }, expiryTime);
    }

    return otp;
  }

  async getOTP(
    email: string,
    code: string,
    type: OTP["type"],
  ): Promise<OTP | undefined> {
    const now = new Date();
    return Array.from(this.otps.values()).find(
      (otp) =>
        otp.email === email.toLowerCase() &&
        otp.code === code &&
        otp.type === type &&
        new Date(otp.expiresAt) > now,
    );
  }

  async getLastOTPTime(email: string, type: OTP["type"]): Promise<number | null> {
    const otps = Array.from(this.otps.values())
      .filter((otp) => otp.email === email.toLowerCase() && otp.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (otps.length === 0) return null;
    return new Date(otps[0].createdAt).getTime();
  }

  async deleteOTP(id: string): Promise<boolean> {
    return this.otps.delete(id);
  }

  async deleteAllOTPsForEmail(email: string): Promise<void> {
    const entries = Array.from(this.otps.entries());
    for (const [id, otp] of entries) {
      if (otp.email === email.toLowerCase()) {
        this.otps.delete(id);
      }
    }
  }

  async deleteUnverifiedUsers(olderThanSeconds: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanSeconds * 1000);
    const entries = Array.from(this.users.entries());
    let deletedCount = 0;

    for (const [id, user] of entries) {
      if (!user.isEmailVerified && new Date(user.createdAt) < cutoffTime) {
        this.users.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

// Redis Storage Implementation
export class RedisStorage implements IStorage {
  private client: ReturnType<typeof createClient>;
  private connected: boolean = false;
  private nextProductId: number = 1;

  constructor() {
    // Parse host and port from REDIS_HOST if it contains a colon
    const redisHost = process.env.REDIS_HOST || "";
    const [host, hostPort] = redisHost.includes(":")
      ? redisHost.split(":")
      : [redisHost, ""];

    const port = hostPort
      ? parseInt(hostPort)
      : parseInt(process.env.REDIS_PORT || "12110");

    this.client = createClient({
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: host,
        port: port,
      },
    });

    this.client.on("error", (err) => console.error("Redis Client Error", err));
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
      console.log("Redis connected successfully");
      // await this.initializeData(); // Removed - no dummy data
    }
  }



  // Product methods
  async getAllProducts(): Promise<Product[]> {
    const productIds = await this.client.sMembers("products:list");
    const products: Product[] = [];

    for (const id of productIds) {
      const product = await this.client.hGetAll(`product:${id}`);
      if (product && Object.keys(product).length > 0) {
        products.push({
          id: parseInt(product.id),
          name: product.name,
          description: product.description,
          image: product.image,
          price: parseFloat(product.price),
          originalPrice: product.originalPrice
            ? parseFloat(product.originalPrice)
            : undefined,
          rating: parseInt(product.rating),
          reviewCount: parseInt(product.reviewCount),
          badge: product.badge || undefined,
          category: product.category,
          stock: parseInt(product.stock),
        });
      }
    }

    return products;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const product = await this.client.hGetAll(`product:${id}`);
    if (!product || Object.keys(product).length === 0) return undefined;

    return {
      id: parseInt(product.id),
      name: product.name,
      description: product.description,
      image: product.image,
      price: parseFloat(product.price),
      originalPrice: product.originalPrice
        ? parseFloat(product.originalPrice)
        : undefined,
      rating: parseInt(product.rating),
      reviewCount: parseInt(product.reviewCount),
      badge: product.badge || undefined,
      category: product.category,
      stock: parseInt(product.stock),
    };
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter((p) => p.category === category);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const nextId = await this.client.get("products:nextId");
    const id = nextId ? parseInt(nextId) : 1;

    const product: Product = { id, ...insertProduct };

    // Filter out undefined values to prevent Redis errors
    const filteredProduct = Object.fromEntries(
      Object.entries(product).filter(([_, value]) => value !== undefined),
    );

    await this.client.hSet(`product:${id}`, filteredProduct as any);
    await this.client.sAdd("products:list", id.toString());
    await this.client.set("products:nextId", (id + 1).toString());

    return product;
  }

  async updateProduct(
    id: number,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    const existing = await this.getProductById(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };

    // Filter out undefined values to prevent Redis errors
    const filteredUpdates = Object.fromEntries(
      Object.entries(updated).filter(([_, value]) => value !== undefined),
    );

    await this.client.hSet(`product:${id}`, filteredUpdates as any);
    return updated;
  }

  async updateProductStock(
    id: number,
    quantityChange: number,
  ): Promise<Product | undefined> {
    const product = await this.getProductById(id);
    if (!product) return undefined;

    const newStock = product.stock + quantityChange;
    if (newStock < 0) {
      throw new Error(
        `Insufficient stock for product ${id}. Available: ${product.stock}, Requested: ${Math.abs(quantityChange)}`,
      );
    }

    const updated = { ...product, stock: newStock };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updated).filter(([_, value]) => value !== undefined),
    );

    await this.client.hSet(`product:${id}`, filteredUpdates as any);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const exists = await this.client.exists(`product:${id}`);
    if (!exists) return false;

    await this.client.del(`product:${id}`);
    await this.client.sRem("products:list", id.toString());
    return true;
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    const orderIds = await this.client.sMembers("orders:list");
    const orders: Order[] = [];

    for (const id of orderIds) {
      const orderData = await this.client.get(`order:${id}`);
      if (orderData) {
        orders.push(JSON.parse(orderData));
      }
    }

    return orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const orderData = await this.client.get(`order:${id}`);
    return orderData ? JSON.parse(orderData) : undefined;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    // Get user to fetch their email
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Get order IDs for this email
    const orderIds = await this.client.sMembers(`email:orders:${user.email}`);
    const orders: Order[] = [];

    for (const id of orderIds) {
      const orderData = await this.client.get(`order:${id}`);
      if (orderData) {
        orders.push(JSON.parse(orderData));
      }
    }

    return orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async linkOrdersByEmail(email: string, userId: string): Promise<number> {
    // No need to link - orders are already tracked by email
    // This method is kept for compatibility but does nothing
    return 0;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Decrease stock for all products in the order
    for (const item of insertOrder.items) {
      await this.updateProductStock(item.productId, -item.quantity);
    }

    const id = `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const order: Order = {
      id,
      ...insertOrder,
      status: "received",
      createdAt: new Date().toISOString(),
    };

    await this.client.set(`order:${id}`, JSON.stringify(order));
    await this.client.sAdd("orders:list", id);
    
    // Add order ID to email-based set for efficient lookup
    await this.client.sAdd(`email:orders:${order.customerEmail}`, id);
    
    return order;
  }

  async updateOrderStatus(
    id: string,
    status: Order["status"],
  ): Promise<Order | undefined> {
    const order = await this.getOrderById(id);
    if (!order) return undefined;

    order.status = status;
    await this.client.set(`order:${id}`, JSON.stringify(order));
    return order;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const userData = await this.client.hGetAll(`user:${id}`);
    if (!userData || Object.keys(userData).length === 0) return undefined;
    if (!userData || !userData.id) return undefined;

    return {
      id: userData.id,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role as "admin" | "user",
      isEmailVerified: userData.isEmailVerified === "true",
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userId = await this.client.get(`user:email:${email.toLowerCase()}`);
    if (!userId) return undefined;
    return this.getUser(userId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role || "user",
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    const userForRedis = {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified.toString(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    await this.client.hSet(`user:${id}`, userForRedis as any);
    await this.client.set(`user:email:${user.email.toLowerCase()}`, id);
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const userForRedis = {
      id: updated.id,
      email: updated.email,
      password: updated.password,
      name: updated.name,
      role: updated.role,
      isEmailVerified: updated.isEmailVerified.toString(),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    if (updates.email && updates.email !== user.email) {
      await this.client.del(`user:email:${user.email.toLowerCase()}`);
      await this.client.set(`user:email:${updated.email.toLowerCase()}`, id);
    }

    await this.client.hSet(`user:${id}`, userForRedis as any);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;

    // Delete user's email index
    await this.client.del(`user:email:${user.email.toLowerCase()}`);
    // Delete user hash
    const result = await this.client.del(`user:${id}`);
    return result > 0;
  }

  async hasAdminAccount(): Promise<boolean> {
    try {
      const userKeys = await this.client.keys("user:*");
      for (const key of userKeys) {
        if (key.includes(":email:")) {
          continue;
        }

        try {
          const keyType = await this.client.type(key);
          if (keyType !== "hash") {
            continue;
          }

          const userData = await this.client.hGetAll(key);
          if (userData && userData.role === "admin") {
            return true;
          }
        } catch (err) {
          continue;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking admin account:", error);
      return false;
    }
  }

  async getAdminUsers(): Promise<User[]> {
    try {
      const userKeys = await this.client.keys("user:*");
      const admins: User[] = [];

      for (const key of userKeys) {
        if (key.includes(":email:")) {
          continue;
        }

        try {
          const keyType = await this.client.type(key);
          if (keyType !== "hash") {
            continue;
          }

          const userData = await this.client.hGetAll(key);
          if (userData && userData.role === "admin" && userData.id) {
            admins.push({
              id: userData.id,
              email: userData.email,
              password: userData.password,
              name: userData.name,
              role: "admin",
              isEmailVerified: userData.isEmailVerified === "true",
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt,
            });
          }
        } catch (err) {
          continue;
        }
      }
      return admins;
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
  }

  // Pending User methods
  async createPendingUser(insertUser: InsertUser): Promise<void> {
    const now = new Date().toISOString();
    const pendingUser: PendingUser = {
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role || "user",
      createdAt: now,
    };

    await this.client.setEx(
      `pending:user:${insertUser.email.toLowerCase()}`,
      900,
      JSON.stringify(pendingUser),
    );
  }

  async getPendingUser(email: string): Promise<PendingUser | undefined> {
    const data = await this.client.get(`pending:user:${email.toLowerCase()}`);
    if (!data) return undefined;
    return JSON.parse(data) as PendingUser;
  }

  async deletePendingUser(email: string): Promise<boolean> {
    const result = await this.client.del(`pending:user:${email.toLowerCase()}`);
    return result > 0;
  }

  // OTP methods
  async createOTP(otpData: {
    email: string;
    code: string;
    type: OTP["type"];
    expiresAt: string;
  }): Promise<OTP> {
    const id = randomUUID();
    const otp: OTP = {
      id,
      email: otpData.email.toLowerCase(),
      code: otpData.code,
      type: otpData.type,
      expiresAt: otpData.expiresAt,
      createdAt: new Date().toISOString(),
    };

    const expiryTime = Math.floor(
      (new Date(otpData.expiresAt).getTime() - Date.now()) / 1000,
    );
    if (expiryTime > 0) {
      await this.client.setEx(
        `otp:${otpData.email.toLowerCase()}:${otpData.type}`,
        expiryTime,
        JSON.stringify(otp),
      );
    }

    return otp;
  }

  async getOTP(
    email: string,
    code: string,
    type: OTP["type"],
  ): Promise<OTP | undefined> {
    const otpKey = `otp:${email.toLowerCase()}:${type}`;
    const otpData = await this.client.get(otpKey);

    if (!otpData) return undefined;

    const otp = JSON.parse(otpData) as OTP;

    const now = new Date();
    if (otp.code === code && new Date(otp.expiresAt) > now) {
      return otp;
    }

    return undefined;
  }

  async getLastOTPTime(email: string, type: OTP["type"]): Promise<number | null> {
    const otpKey = `otp:${email.toLowerCase()}:${type}`;
    const otpData = await this.client.get(otpKey);

    if (!otpData) return null;

    const otp = JSON.parse(otpData) as OTP;
    return new Date(otp.createdAt).getTime();
  }

  async deleteOTP(id: string): Promise<boolean> {
    const keys = await this.client.keys(`otp:*`);
    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        const otp = JSON.parse(data) as OTP;
        if (otp.id === id) {
          await this.client.del(key);
          return true;
        }
      }
    }
    return false;
  }

  async deleteAllOTPsForEmail(email: string): Promise<void> {
    const keys = await this.client.keys(`otp:${email.toLowerCase()}:*`);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async deleteUnverifiedUsers(olderThanSeconds: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanSeconds * 1000);
    const userKeys = await this.client.keys("user:*");
    let deletedCount = 0;

    for (const key of userKeys) {
      if (key.includes(":email:")) {
        continue;
      }

      try {
        const keyType = await this.client.type(key);
        if (keyType !== "hash") {
          continue;
        }

        const userData = await this.client.hGetAll(key);
        if (
          userData &&
          userData.isEmailVerified === "false" &&
          new Date(userData.createdAt) < cutoffTime
        ) {
          // Delete user email index
          await this.client.del(`user:email:${userData.email.toLowerCase()}`);
          // Delete user hash
          await this.client.del(key);
          // Delete all OTPs for this user
          await this.deleteAllOTPsForEmail(userData.email);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Error processing user key ${key}:`, err);
        continue;
      }
    }

    return deletedCount;
  }
}

// Storage proxy: try Redis, fall back to in-memory storage if Redis is unavailable
class StorageProxy implements IStorage {
  private active: IStorage;

  constructor() {
    // default to in-memory until connect() is called
    this.active = new MemStorage();
  }

  async connect(): Promise<void> {
    try {
      const redisStore = new RedisStorage();
      // attempt to connect to Redis with a timeout
      const connectPromise = redisStore.connect();
      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error("Redis connect timeout")), 5000),
      );
      await Promise.race([connectPromise, timeout]);
      this.active = redisStore;
      console.log("Storage: connected to Redis and will use RedisStorage", process.env.REDIS_HOST);
    } catch (err) {
      console.warn(
        "Storage: failed to connect to Redis, falling back to MemStorage:",
        err,
      );
      this.active = new MemStorage();
    }
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return this.active.getAllProducts();
  }
  async getProductById(id: number): Promise<Product | undefined> {
    return this.active.getProductById(id);
  }
  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.active.getProductsByCategory(category);
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    return this.active.createProduct(product);
  }
  async updateProduct(
    id: number,
    product: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    return this.active.updateProduct(id, product);
  }
  async updateProductStock(
    id: number,
    quantityChange: number,
  ): Promise<Product | undefined> {
    return this.active.updateProductStock(id, quantityChange);
  }
  async deleteProduct(id: number): Promise<boolean> {
    return this.active.deleteProduct(id);
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return this.active.getAllOrders();
  }
  async getOrderById(id: string): Promise<Order | undefined> {
    return this.active.getOrderById(id);
  }
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return this.active.getOrdersByUserId(userId);
  }
  async linkOrdersByEmail(email: string, userId: string): Promise<number> {
    return this.active.linkOrdersByEmail(email, userId);
  }
  async createOrder(order: InsertOrder): Promise<Order> {
    return this.active.createOrder(order);
  }
  async updateOrderStatus(
    id: string,
    status: Order["status"],
  ): Promise<Order | undefined> {
    return this.active.updateOrderStatus(id, status);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.active.getUser(id);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.active.getUserByEmail(email);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.active.getUserByUsername(username);
  }
  async createUser(user: InsertUser): Promise<User> {
    return this.active.createUser(user);
  }
  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    return this.active.updateUser(id, updates);
  }
  async deleteUser(id: string): Promise<boolean> {
    return this.active.deleteUser(id);
  }
  async hasAdminAccount(): Promise<boolean> {
    return this.active.hasAdminAccount();
  }
  async getAdminUsers(): Promise<User[]> {
    return this.active.getAdminUsers();
  }

  // Pending User methods
  async createPendingUser(user: InsertUser): Promise<void> {
    return this.active.createPendingUser(user);
  }
  async getPendingUser(email: string): Promise<PendingUser | undefined> {
    return this.active.getPendingUser(email);
  }
  async deletePendingUser(email: string): Promise<boolean> {
    return this.active.deletePendingUser(email);
  }

  // OTP methods
  async createOTP(otp: {
    email: string;
    code: string;
    type: OTP["type"];
    expiresAt: string;
  }): Promise<OTP> {
    return this.active.createOTP(otp);
  }
  async getOTP(
    email: string,
    code: string,
    type: OTP["type"],
  ): Promise<OTP | undefined> {
    return this.active.getOTP(email, code, type);
  }
  async getLastOTPTime(email: string, type: OTP["type"]): Promise<number | null> {
    return this.active.getLastOTPTime(email, type);
  }
  async deleteOTP(id: string): Promise<boolean> {
    return this.active.deleteOTP(id);
  }
  async deleteAllOTPsForEmail(email: string): Promise<void> {
    return this.active.deleteAllOTPsForEmail(email);
  }

  async deleteUnverifiedUsers(olderThanSeconds: number): Promise<number> {
    return this.active.deleteUnverifiedUsers(olderThanSeconds);
  }
}

export const storage = new StorageProxy();
