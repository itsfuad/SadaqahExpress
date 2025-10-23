import { type Product, type Order, type User, type InsertProduct, type InsertOrder, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

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
      password: "admin", // In production, this should be hashed
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
      status: "pending",
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

export const storage = new MemStorage();
