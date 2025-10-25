import { Resend } from "resend";
import type { Order } from "@shared/schema";

// Initialize Resend client with API key from environment variable
const resendClient = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@sadaqahexpress.com";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return {
    client: resendClient,
    fromEmail: fromEmail,
  };
}

export async function sendOrderConfirmationToCustomer(order: Order) {
  try {
    const { client, fromEmail } = getResendClient();

    const itemsList = order.items
      .map(
        (item) =>
          `- ${item.productName} x${item.quantity} - ৳${(item.price * item.quantity).toFixed(2)}`,
      )
      .join("\n");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Thank you for your order!</h1>
        <p>Dear ${order.customerName},</p>
        <p>We have received your order and will process it shortly.</p>

        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>

        <h3>Items:</h3>
        <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">${itemsList}</pre>

        <p><strong>Total Amount:</strong> ৳${order.total.toFixed(2)}</p>

        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ""}

        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e7eb;" />

        <h3>Next Steps:</h3>
        <p>You will receive payment instructions via email shortly. Once payment is confirmed, we will deliver your digital products to this email address.</p>

        <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
          If you have any questions, please contact us at our Whatsapp or Telegram: 017 856 856 54
        </p>

        <p style="color: #6b7280; font-size: 0.875rem;">
          Best regards,<br/>
          SadaqahExpress Team
        </p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: order.customerEmail,
      subject: `Order Confirmation - ${order.id}`,
      html,
    });

    console.log(`Order confirmation email sent to ${order.customerEmail}`);
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
    throw error;
  }
}

export async function sendOrderNotificationToAdmin(
  order: Order,
  adminEmail?: string,
) {
  try {
    const { client, fromEmail } = getResendClient();
    
    // Get admin email from database if not provided
    let targetEmail = adminEmail;
    if (!targetEmail) {
      const { storage } = await import("./storage");
      const admins = await storage.getAdminUsers();
      
      // Send to the first admin found, or use environment variable as fallback
      if (admins.length > 0) {
        targetEmail = admins[0].email;
      } else {
        targetEmail = process.env.ADMIN_EMAIL || "admin@sadaqahexpress.com";
      }
    }
    
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    const itemsList = order.items
      .map(
        (item) =>
          `- ${item.productName} x${item.quantity} - ৳${(item.price * item.quantity).toFixed(2)}`,
      )
      .join("\n");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">New Order Received</h1>

        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> ${order.status}</p>

        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>

        <h3>Items:</h3>
        <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem;">${itemsList}</pre>

        <p><strong>Total Amount:</strong> ৳${order.total.toFixed(2)}</p>

        ${order.notes ? `<h3>Customer Notes:</h3><p>${order.notes}</p>` : ""}

        <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="margin-top: 2rem;">
          <a href="${baseUrl}/admin/dashboard"
             style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
            View in Dashboard
          </a>
        </p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: targetEmail,
      subject: `New Order: ${order.id} - ৳${order.total.toFixed(2)}`,
      html,
    });

    console.log(`Order notification email sent to admin at ${targetEmail}`);
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
    throw error;
  }
}

export async function sendProductDeliveryEmail(order: Order) {
  try {
    const { client, fromEmail } = getResendClient();

    const itemsList = order.items
      .map((item) => `${item.productName} x${item.quantity}`)
      .join(", ");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Thank you for your purchase!</h1>
        <p>Dear ${order.customerName},</p>
        <p>Payment confirmed! Your digital products are now being delivered.</p>

        <h2>Order: ${order.id}</h2>
        <p><strong>Products:</strong> ${itemsList}</p>

        <div style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Important:</strong> Your product license keys and download instructions will be sent in a separate email within 24 hours. Please check your inbox and spam folder.</p>
        </div>

        <p>For immediate assistance, please contact us at our Whatsapp or Telegram: 017 856 856 54

        <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
          Thank you for choosing SadaqahExpress!
        </p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: order.customerEmail,
      subject: `Product Delivery - ${order.id}`,
      html,
    });

    console.log(`Product delivery email sent to ${order.customerEmail}`);
  } catch (error) {
    console.error("Failed to send product delivery email:", error);
    throw error;
  }
}



export async function sendOTPEmail(
  email: string,
  code: string,
  type: "email_verification" | "password_reset" | "email_change",
) {
  try {
    const { client, fromEmail } = getResendClient();

    let subject = "";
    let heading = "";
    let message = "";

    switch (type) {
      case "email_verification":
        subject = "Verify Your Email - SadaqahExpress";
        heading = "Verify Your Email Address";
        message =
          "Thank you for signing up! Please use the code below to verify your email address:";
        break;
      case "password_reset":
        subject = "Reset Your Password - SadaqahExpress";
        heading = "Reset Your Password";
        message =
          "You requested to reset your password. Please use the code below to continue:";
        break;
      case "email_change":
        subject = "Verify Your New Email - SadaqahExpress";
        heading = "Verify Your New Email Address";
        message =
          "You requested to change your email address. Please use the code below to verify your new email:";
        break;
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">${heading}</h1>
        <p>${message}</p>

        <div style="background: #f3f4f6; padding: 2rem; border-radius: 0.5rem; margin: 2rem 0; text-align: center;">
          <p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
            Your Verification Code
          </p>
          <h2 style="margin: 0; font-size: 2.5rem; font-weight: bold; color: #1f2937; letter-spacing: 0.5rem;">
            ${code}
          </h2>
        </div>

        <div style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Important:</strong> This code will expire in 10 minutes. Do not share this code with anyone.</p>
        </div>

        <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
          If you didn't request this code, please ignore this email or contact us if you have concerns.
        </p>

        <p style="color: #6b7280; font-size: 0.875rem;">
          Best regards,<br/>
          SadaqahExpress Team
        </p>
      </div>
    `;

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
    });

    console.log(`OTP email sent to ${email} for ${type}`);
  } catch (error) {
    console.error(`Failed to send OTP email for ${type}:`, error);
    throw error;
  }
}
