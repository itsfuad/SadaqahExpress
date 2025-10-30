import {
  type Product,
  type Order,
  type User,
  type OTP,
  type PendingUser,
  type Rating,
  type InsertProduct,
  type InsertOrder,
  type InsertUser,
  type InsertRating,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { createClient } from "redis";

export interface IStorage {
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsPaginated(params: {
    page: number;
    limit: number;
    category?: string;
    sortBy?: 'default' | 'price-low' | 'price-high';
    search?: string;
  }): Promise<{ products: Product[]; total: number; hasMore: boolean }>;
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

  // Rating methods
  createOrUpdateRating(userId: string, rating: InsertRating): Promise<Rating>;
  getUserRatingForProduct(userId: string, productId: number): Promise<Rating | undefined>;
  getProductRatings(productId: number): Promise<Rating[]>;
  getAverageRating(productId: number): Promise<{ average: number; count: number }>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private orders: Map<string, Order>;
  private users: Map<string, User>;
  private pendingUsers: Map<string, PendingUser>;
  private otps: Map<string, OTP>;
  private ratings: Map<string, Rating>; // key: userId:productId
  private nextProductId: number;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.users = new Map();
    this.pendingUsers = new Map();
    this.otps = new Map();
    this.ratings = new Map();
    this.nextProductId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample products only if empty
    if (this.products.size > 0) return;

    const sampleProducts: Omit<Product, "id">[] = [
      {
        name: "Windows 11 Pro",
        description:
          "Windows 11 Pro Digital License - Lifetime activation for 1 PC with all latest features including enhanced security, gaming performance, and productivity tools.",
        image: "/images/windows.jpg",
        price: 899.0,
        originalPrice: 1299.0,
        rating: 5,
        reviewCount: 124,
        badge: "Bestseller",
        category: "microsoft",
        stock: 50,
      },
      {
        name: "Windows 10 Pro",
        description: "Windows 10 Pro Digital License - Lifetime activation with full security updates and professional features for businesses and power users.",
        image: "/images/windows.jpg",
        price: 699.0,
        originalPrice: 999.0,
        rating: 5,
        reviewCount: 287,
        category: "microsoft",
        stock: 100,
      },
      {
        name: "Microsoft Office 2021 Professional Plus",
        description: "Office 2021 Professional Plus - Lifetime License including Word, Excel, PowerPoint, Outlook, Access, Publisher, and OneNote for Windows.",
        image: "/images/office.jpg",
        price: 1299.0,
        originalPrice: 2499.0,
        rating: 5,
        reviewCount: 356,
        badge: "Sale",
        category: "microsoft",
        stock: 75,
      },
      {
        name: "Microsoft Office 365 Personal",
        description: "Office 365 Personal - 1 Year Subscription with 1TB OneDrive cloud storage, premium Office apps, and ongoing updates.",
        image: "/images/office.jpg",
        price: 499.0,
        originalPrice: 699.0,
        rating: 4,
        reviewCount: 198,
        category: "microsoft",
        stock: 60,
      },
      {
        name: "ChatGPT Plus Subscription",
        description: "ChatGPT Plus - 1 Month Premium Access with GPT-4, faster response times, and priority access during peak hours.",
        image: "/images/gpt.jpg",
        price: 1999.0,
        originalPrice: 2499.0,
        rating: 5,
        reviewCount: 542,
        badge: "Hot",
        category: "ai",
        stock: 200,
      },
      {
        name: "Internet Download Manager",
        description: "IDM - Premium Download Manager with 5x faster downloads, video grabber, resume capability, and lifetime license.",
        image: "/images/idm.jpg",
        price: 399.0,
        originalPrice: 599.0,
        rating: 5,
        reviewCount: 421,
        category: "utilities",
        stock: 150,
      },
      {
        name: "Windows 11 + Office 2021 Bundle",
        description: "Complete productivity bundle with Windows 11 Pro and Office 2021 Professional Plus at a special discounted price.",
        image: "/images/office.jpg",
        price: 1899.0,
        originalPrice: 3299.0,
        rating: 5,
        reviewCount: 167,
        badge: "Bundle",
        category: "microsoft",
        stock: 30,
      },
      {
        name: "Adobe Creative Cloud All Apps",
        description: "Adobe Creative Cloud - 1 Month subscription with access to Photoshop, Illustrator, Premiere Pro, After Effects, and 20+ creative apps.",
        image: "/images/office.jpg",
        price: 3499.0,
        originalPrice: 4999.0,
        rating: 5,
        reviewCount: 289,
        category: "creative",
        stock: 40,
      },
    ];

    sampleProducts.forEach((product) => {
      const id = this.nextProductId++;
      this.products.set(id, { id, ...product });
    });
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

  async getProductsPaginated(params: {
    page: number;
    limit: number;
    category?: string;
    sortBy?: 'default' | 'price-low' | 'price-high';
    search?: string;
  }): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const { page, limit, category, sortBy = 'default', search } = params;
    
    // Get all products (or by category)
    let products = category && category !== 'all' 
      ? await this.getProductsByCategory(category)
      : await this.getAllProducts();

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.category && p.category.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    }
    // 'default' maintains the order from database

    const total = products.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    return {
      products: paginatedProducts,
      total,
      hasMore
    };
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

  // Rating methods
  async createOrUpdateRating(userId: string, rating: InsertRating): Promise<Rating> {
    const key = `${userId}:${rating.productId}`;
    const existingRating = this.ratings.get(key);
    const now = new Date().toISOString();

    const newRating: Rating = {
      id: existingRating?.id || randomUUID(),
      userId,
      productId: rating.productId,
      rating: rating.rating,
      createdAt: existingRating?.createdAt || now,
      updatedAt: now,
    };

    this.ratings.set(key, newRating);
    
    // Update product average rating
    await this.updateProductRating(rating.productId);
    
    return newRating;
  }

  async getUserRatingForProduct(userId: string, productId: number): Promise<Rating | undefined> {
    const key = `${userId}:${productId}`;
    return this.ratings.get(key);
  }

  async getProductRatings(productId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(
      (rating) => rating.productId === productId
    );
  }

  async getAverageRating(productId: number): Promise<{ average: number; count: number }> {
    const ratings = await this.getProductRatings(productId);
    
    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    return { average: Math.round(average * 10) / 10, count: ratings.length };
  }

  private async updateProductRating(productId: number): Promise<void> {
    const product = this.products.get(productId);
    if (!product) return;

    const { average, count } = await this.getAverageRating(productId);
    product.rating = average;
    product.reviewCount = count;
    this.products.set(productId, product);
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
        reconnectStrategy: false,
      },
    });

    this.client.on("error", (err) => {
      // Suppress error logs when intentionally not using Redis
    });
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

  async getProductsPaginated(params: {
    page: number;
    limit: number;
    category?: string;
    sortBy?: 'default' | 'price-low' | 'price-high';
    search?: string;
  }): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const { page, limit, category, sortBy = 'default', search } = params;
    
    // Get all products (or by category)
    let products = category && category !== 'all' 
      ? await this.getProductsByCategory(category)
      : await this.getAllProducts();

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.category && p.category.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    }
    // 'default' maintains the order from database

    const total = products.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    return {
      products: paginatedProducts,
      total,
      hasMore
    };
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

  // Rating methods
  async createOrUpdateRating(userId: string, rating: InsertRating): Promise<Rating> {
    const key = `rating:${userId}:${rating.productId}`;
    const now = new Date().toISOString();
    
    const existingData = await this.client.hGetAll(key);
    
    const newRating: Rating = {
      id: existingData?.id || randomUUID(),
      userId,
      productId: rating.productId,
      rating: rating.rating,
      createdAt: existingData?.createdAt || now,
      updatedAt: now,
    };

    await this.client.hSet(key, {
      id: newRating.id,
      userId: newRating.userId,
      productId: newRating.productId.toString(),
      rating: newRating.rating.toString(),
      createdAt: newRating.createdAt,
      updatedAt: newRating.updatedAt,
    });

    // Add to product ratings set
    await this.client.sAdd(`product:${rating.productId}:ratings`, userId);
    
    // Update product average rating
    await this.updateProductRating(rating.productId);
    
    return newRating;
  }

  async getUserRatingForProduct(userId: string, productId: number): Promise<Rating | undefined> {
    const key = `rating:${userId}:${productId}`;
    const data = await this.client.hGetAll(key);
    
    if (!data || Object.keys(data).length === 0) {
      return undefined;
    }

    return {
      id: data.id,
      userId: data.userId,
      productId: parseInt(data.productId),
      rating: parseInt(data.rating),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async getProductRatings(productId: number): Promise<Rating[]> {
    const userIds = await this.client.sMembers(`product:${productId}:ratings`);
    const ratings: Rating[] = [];

    for (const userId of userIds) {
      const rating = await this.getUserRatingForProduct(userId, productId);
      if (rating) {
        ratings.push(rating);
      }
    }

    return ratings;
  }

  async getAverageRating(productId: number): Promise<{ average: number; count: number }> {
    const ratings = await this.getProductRatings(productId);
    
    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    return { average: Math.round(average * 10) / 10, count: ratings.length };
  }

  private async updateProductRating(productId: number): Promise<void> {
    const { average, count } = await this.getAverageRating(productId);
    
    await this.client.hSet(`product:${productId}`, {
      rating: average.toString(),
      reviewCount: count.toString(),
    });
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
  async getProductsPaginated(params: {
    page: number;
    limit: number;
    category?: string;
    sortBy?: 'default' | 'price-low' | 'price-high';
    search?: string;
  }): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    return this.active.getProductsPaginated(params);
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

  // Rating methods
  async createOrUpdateRating(userId: string, rating: InsertRating): Promise<Rating> {
    return this.active.createOrUpdateRating(userId, rating);
  }
  async getUserRatingForProduct(userId: string, productId: number): Promise<Rating | undefined> {
    return this.active.getUserRatingForProduct(userId, productId);
  }
  async getProductRatings(productId: number): Promise<Rating[]> {
    return this.active.getProductRatings(productId);
  }
  async getAverageRating(productId: number): Promise<{ average: number; count: number }> {
    return this.active.getAverageRating(productId);
  }
}

export const storage = new StorageProxy();
