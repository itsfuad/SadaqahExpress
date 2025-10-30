import { z } from "zod";

export interface Product {
  id: number;
  name: string;
  description?: string; // Made optional for future use
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
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PendingUser {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface OTP {
  id: string;
  email: string;
  code: string;
  type: "email_verification" | "password_reset" | "email_change";
  expiresAt: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  productId: number;
  rating: number; // 1-5 stars
  createdAt: string;
  updatedAt: string;
}

// Product schemas
const productBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""), // Made optional with default empty string
  image: z.string().url("Must be a valid URL"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0).optional(), // Truly optional
  rating: z.number().min(0).max(5),
  reviewCount: z.number().min(0),
  badge: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be non-negative"),
});

export const insertProductSchema = productBaseSchema.refine((data) => {
  // If originalPrice is provided, price (discount price) must be less than originalPrice
  if (data.originalPrice !== undefined && data.originalPrice !== null) {
    return data.price < data.originalPrice;
  }
  return true;
}, {
  message: "Discount price must be less than original price",
  path: ["price"],
});

export const updateProductSchema = productBaseSchema.partial().refine((data) => {
  // If both price and originalPrice are provided, price must be less than originalPrice
  if (data.originalPrice !== undefined && data.originalPrice !== null && data.price !== undefined) {
    return data.price < data.originalPrice;
  }
  return true;
}, {
  message: "Discount price must be less than original price",
  path: ["price"],
});

// Order schemas
export const insertOrderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        productName: z.string(),
        productImage: z.string(),
        price: z.number(),
        quantity: z.number().min(1),
      }),
    )
    .min(1, "At least one item is required"),
  total: z.number().min(0),
});

// User schemas
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["admin", "user"]).default("user"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// OTP schemas
export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  type: z.enum(["email_verification", "password_reset", "email_change"]),
});

export const resendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["email_verification", "password_reset", "email_change"]),
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Profile update schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

export const verifyEmailChangeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

// Rating schemas
export const insertRatingSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
});

// Type exports
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type VerifyOTP = z.infer<typeof verifyOTPSchema>;
export type ResendOTP = z.infer<typeof resendOTPSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangeEmail = z.infer<typeof changeEmailSchema>;
export type VerifyEmailChange = z.infer<typeof verifyEmailChangeSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
