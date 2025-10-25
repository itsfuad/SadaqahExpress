// Configuration constants for the application

// OTP and verification settings
export const RESEND_TIMER = 10; // seconds (will be 120 in production - 2 minutes)
export const UNVERIFIED_EXPIRY = 10 * 60; // seconds (will be 3 * 24 * 60 * 60 in production - 3 days)
export const OTP_EXPIRY = 10 * 60; // seconds - 10 minutes for OTP validity

// Email settings
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "admin@sadaqahexpress.com";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sadaqahexpress.com";

// App settings
export const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
