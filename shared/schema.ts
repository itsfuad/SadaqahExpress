import { z } from "zod";

export interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  category: string;
  stock: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  items: OrderItem[];
  total: number;
  status: "received" | "processing" | "completed" | "cancelled";
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
}

export const insertProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Must be a valid URL"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0).optional(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().min(0),
  badge: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be non-negative"),
});

export const insertOrderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    productImage: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
  })).min(1, "At least one item is required"),
  total: z.number().min(0),
});

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
