// Configuration constants for the application

// OTP and verification settings
export const RESEND_TIMER = 2 * 60;
export const UNVERIFIED_EXPIRY = 10 * 60; 
export const OTP_EXPIRY = 5 * 60;

// Email settings
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "admin@sadaqahexpress.com";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sadaqahexpress.com";

// App settings
export const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_RATINGS: false, // Set to true to enable the rating system
};
