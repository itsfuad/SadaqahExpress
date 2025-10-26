import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OTPVerification } from "@/components/OTPVerification";
import { useToast } from "@/hooks/use-toast";

export default function VerifyOTPPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [verificationType, setVerificationType] = useState<
    "email_verification" | "password_reset" | "email_change"
  >("email_verification");
  const [returnPath, setReturnPath] = useState("/");
  const [userId, setUserId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get verification context from sessionStorage
    const verificationContext = sessionStorage.getItem("verificationContext");
    if (!verificationContext) {
      // Redirect to home if no verification context
      setLocation("/");
      return;
    }

    try {
      const context = JSON.parse(verificationContext);
      setEmail(context.email || "");
      setVerificationType(context.type || "email_verification");
      setReturnPath(context.returnPath || "/");
      setUserId(context.userId || null);
    } catch (err) {
      console.error("Failed to parse verification context:", err);
      setLocation("/");
    }
  }, [setLocation]);

  const handleVerifySuccess = (result: any) => {
    // Update user in localStorage with verified status if email verification
    if (verificationType === "email_verification") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.email === email) {
            user.isEmailVerified = true;
            localStorage.setItem("user", JSON.stringify(user));
          }
        } catch (err) {
          console.error("Failed to update user:", err);
        }
      }
    }

    // For password reset, store the verified code and redirect to reset form
    if (verificationType === "password_reset") {
      sessionStorage.setItem(
        "passwordResetContext",
        JSON.stringify({
          email,
          code: result.code,
        })
      );
      sessionStorage.removeItem("verificationContext");
      setLocation("/reset-password");
      return;
    }

    // For email change, show success and redirect back
    if (verificationType === "email_change") {
      toast({
        title: "Success",
        description: "Email changed successfully",
      });
    }

    // Clear verification context
    sessionStorage.removeItem("verificationContext");

    // Redirect after success
    setTimeout(() => {
      setLocation(returnPath);
    }, 1500);
  };

  const handleCancel = () => {
    // Clear verification context
    sessionStorage.removeItem("verificationContext");
    // Redirect back to return path
    setLocation(returnPath);
  };

  if (!email) {
    return null;
  }

  const getTitleByType = () => {
    switch (verificationType) {
      case "email_verification":
        return "Verify Your Email";
      case "password_reset":
        return "Verify Code";
      case "email_change":
        return "Verify New Email";
      default:
        return "Verify Your Email";
    }
  };

  const getDescriptionByType = () => {
    switch (verificationType) {
      case "email_verification":
        return "We've sent a 6-digit verification code to your email";
      case "password_reset":
        return "Enter the 6-digit code sent to your email";
      case "email_change":
        return "We've sent a 6-digit verification code to your new email";
      default:
        return "We've sent a 6-digit verification code to your email";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      {/* Logo Header - Top Left */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3 w-fit">
          <img
            src="/favicon.png"
            alt="Sadaqah Express Logo"
            className="w-10 h-10 md:w-12 md:h-12"
          />
          <div>
            <h1 className="text-xl font-bold font-serif leading-tight">
              Sadaqah Express
            </h1>
            <p className="text-xs text-muted-foreground">
              Digital Products
            </p>
          </div>
        </Link>
      </div>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center mt-8">
        <div className="w-full max-w-md mb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{getTitleByType()}</h1>
          <p className="text-muted-foreground">
            {getDescriptionByType()}
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <OTPVerification
              email={email}
              verificationType={verificationType}
              onVerifySuccess={handleVerifySuccess}
              onCancel={handleCancel}
              verifyEndpoint={
                verificationType === "email_change" && userId
                  ? `/api/account/verify-email-change?userId=${userId}`
                  : "/api/auth/verify-otp"
              }
              showCancelButton={true}
              startTimer={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
