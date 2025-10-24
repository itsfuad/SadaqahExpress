import { type Product, type Order, type User, type InsertProduct, type InsertOrder, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { createClient } from "redis";

export interface IStorage {
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Order methods
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined>;
  
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private orders: Map<string, Order>;
  private users: Map<string, User>;
  private nextProductId: number;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.users = new Map();
    this.nextProductId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample products
    const sampleProducts: Omit<Product, "id">[] = [
      {
        name: "Windows 11 Pro",
        description: "Windows 11 Pro Digital License - Lifetime activation for 1 PC",
        image: "/placeholder-win11.png",
        price: 400.00,
        originalPrice: 850.00,
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
        price: 350.00,
        originalPrice: 399.00,
        rating: 4,
        reviewCount: 62,
        category: "microsoft",
        stock: 100,
      },
      {
        name: "Windows + Office Combo",
        description: "Windows 10 Pro + Office 2021 Bundle",
        image: "/placeholder-combo.png",
        price: 600.00,
        originalPrice: 800.00,
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
        price: 400.00,
        originalPrice: 600.00,
        rating: 4,
        reviewCount: 14,
        category: "microsoft",
        stock: 75,
      },
      {
        name: "Microsoft Office 2021 Pro Plus",
        description: "Office 2021 Professional Plus - Lifetime License",
        image: "/placeholder-office2021.png",
        price: 500.00,
        originalPrice: 1500.00,
        rating: 5,
        reviewCount: 86,
        category: "microsoft",
        stock: 60,
      },
    ];

    sampleProducts.forEach(product => {
      const id = this.nextProductId++;
      this.products.set(id, { id, ...product });
    });

    // Create default admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123", // In production, this should be hashed
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
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.nextProductId++;
    const product: Product = { id, ...insertProduct };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
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

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

// Redis Storage Implementation
export class RedisStorage implements IStorage {
  private client: ReturnType<typeof createClient>;
  private connected: boolean = false;
  private nextProductId: number = 1;

  constructor() {
    // Parse host and port from REDIS_HOST if it contains a colon
    const redisHost = process.env.REDIS_HOST || '';
    const [host, hostPort] = redisHost.includes(':') 
      ? redisHost.split(':') 
      : [redisHost, ''];
    
    const port = hostPort 
      ? parseInt(hostPort) 
      : parseInt(process.env.REDIS_PORT || '12110');

    this.client = createClient({
      username: 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: host,
        port: port
      }
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
      console.log('Redis connected successfully');
      await this.initializeData();
    }
  }

  private async initializeData() {
    // Check if data already exists
    const productsExist = await this.client.exists('products:list');
    if (productsExist) {
      console.log('Redis data already initialized');
      return;
    }

    console.log('Initializing Redis with sample data...');

    // Initialize with sample products
    const sampleProducts: Omit<Product, "id">[] = [
      {
        name: "Windows 11 Pro",
        description: "Windows 11 Pro Digital License - Lifetime activation for 1 PC",
        image: "/placeholder-win11.png",
        price: 400.00,
        originalPrice: 850.00,
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
        price: 350.00,
        originalPrice: 399.00,
        rating: 4,
        reviewCount: 62,
        category: "microsoft",
        stock: 100,
      },
      {
        name: "Windows + Office Combo",
        description: "Windows 10 Pro + Office 2021 Bundle",
        image: "/placeholder-combo.png",
        price: 600.00,
        originalPrice: 800.00,
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
        price: 400.00,
        originalPrice: 600.00,
        rating: 4,
        reviewCount: 14,
        category: "microsoft",
        stock: 75,
      },
      {
        name: "Microsoft Office 2021 Pro Plus",
        description: "Office 2021 Professional Plus - Lifetime License",
        image: "/placeholder-office2021.png",
        price: 500.00,
        originalPrice: 1500.00,
        rating: 5,
        reviewCount: 86,
        category: "microsoft",
        stock: 60,
      },
    ];

    // Store products
    for (const productData of sampleProducts) {
      const id = this.nextProductId++;
      const product: Product = { id, ...productData };
      await this.client.hSet(`product:${id}`, product as any);
      await this.client.sAdd('products:list', id.toString());
    }

    await this.client.set('products:nextId', this.nextProductId.toString());

    // Create default admin user
    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      username: "admin",
      password: "admin123",
    };
    await this.client.hSet(`user:${adminId}`, adminUser as any);
    await this.client.set('user:admin', adminId);

    console.log('Redis data initialized successfully');
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    const productIds = await this.client.sMembers('products:list');
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
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
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
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
      rating: parseInt(product.rating),
      reviewCount: parseInt(product.reviewCount),
      badge: product.badge || undefined,
      category: product.category,
      stock: parseInt(product.stock),
    };
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter(p => p.category === category);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const nextId = await this.client.get('products:nextId');
    const id = nextId ? parseInt(nextId) : 1;
    
    const product: Product = { id, ...insertProduct };
    
    // Filter out undefined values to prevent Redis errors
    const filteredProduct = Object.fromEntries(
      Object.entries(product).filter(([_, value]) => value !== undefined)
    );
    
    await this.client.hSet(`product:${id}`, filteredProduct as any);
    await this.client.sAdd('products:list', id.toString());
    await this.client.set('products:nextId', (id + 1).toString());
    
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = await this.getProductById(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    
    // Filter out undefined values to prevent Redis errors
    const filteredUpdates = Object.fromEntries(
      Object.entries(updated).filter(([_, value]) => value !== undefined)
    );
    
    await this.client.hSet(`product:${id}`, filteredUpdates as any);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const exists = await this.client.exists(`product:${id}`);
    if (!exists) return false;
    
    await this.client.del(`product:${id}`);
    await this.client.sRem('products:list', id.toString());
    return true;
  }

  // Order methods
  async getAllOrders(): Promise<Order[]> {
    const orderIds = await this.client.sMembers('orders:list');
    const orders: Order[] = [];
    
    for (const id of orderIds) {
      const orderData = await this.client.get(`order:${id}`);
      if (orderData) {
        orders.push(JSON.parse(orderData));
      }
    }
    
    return orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const orderData = await this.client.get(`order:${id}`);
    return orderData ? JSON.parse(orderData) : undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = `ORD-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const order: Order = {
      id,
      ...insertOrder,
      status: "received",
      createdAt: new Date().toISOString(),
    };
    
    await this.client.set(`order:${id}`, JSON.stringify(order));
    await this.client.sAdd('orders:list', id);
    return order;
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
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
    
    return {
      id: userData.id,
      username: userData.username,
      password: userData.password,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const userId = await this.client.get(`user:${username}`);
    if (!userId) return undefined;
    return this.getUser(userId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    
    await this.client.hSet(`user:${id}`, user as any);
    await this.client.set(`user:${user.username}`, id);
    return user;
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
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Redis connect timeout')), 5000));
      await Promise.race([connectPromise, timeout]);
      this.active = redisStore;
      console.log('Storage: connected to Redis and will use RedisStorage');
    } catch (err) {
      console.warn('Storage: failed to connect to Redis, falling back to MemStorage:', err);
      this.active = new MemStorage();
    }
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> { return this.active.getAllProducts(); }
  async getProductById(id: number): Promise<Product | undefined> { return this.active.getProductById(id); }
  async getProductsByCategory(category: string): Promise<Product[]> { return this.active.getProductsByCategory(category); }
  async createProduct(product: InsertProduct): Promise<Product> { return this.active.createProduct(product); }
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> { return this.active.updateProduct(id, product); }
  async deleteProduct(id: number): Promise<boolean> { return this.active.deleteProduct(id); }

  // Order methods
  async getAllOrders(): Promise<Order[]> { return this.active.getAllOrders(); }
  async getOrderById(id: string): Promise<Order | undefined> { return this.active.getOrderById(id); }
  async createOrder(order: InsertOrder): Promise<Order> { return this.active.createOrder(order); }
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | undefined> { return this.active.updateOrderStatus(id, status); }

  // User methods
  async getUser(id: string): Promise<User | undefined> { return this.active.getUser(id); }
  async getUserByUsername(username: string): Promise<User | undefined> { return this.active.getUserByUsername(username); }
  async createUser(user: InsertUser): Promise<User> { return this.active.createUser(user); }
}

export const storage = new StorageProxy();
