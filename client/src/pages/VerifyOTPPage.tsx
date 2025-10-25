import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_TIMER = 10; // 10 seconds for development, will be 120 in production

export default function VerifyOTPPage() {
  const [, setLocation] = useLocation();
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationType, setVerificationType] = useState<
    "email_verification" | "password_reset" | "email_change"
  >("email_verification");
  const [countdown, setCountdown] = useState(0);
  const [returnPath, setReturnPath] = useState("/");
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
      
      // Start countdown if resent recently
      const lastResent = sessionStorage.getItem("lastOTPResent");
      if (lastResent) {
        const elapsed = Math.floor((Date.now() - parseInt(lastResent)) / 1000);
        if (elapsed < RESEND_TIMER) {
          setCountdown(RESEND_TIMER - elapsed);
        }
      }
    } catch (err) {
      console.error("Failed to parse verification context:", err);
      setLocation("/");
    }
  }, [setLocation]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit code",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: otpValue,
          type: verificationType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      // Update user in localStorage with verified status if email verification
      if (verificationType === "email_verification") {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.email === email) {
            user.isEmailVerified = true;
            localStorage.setItem("user", JSON.stringify(user));
          }
        } else {
          // If no user in localStorage, fetch the user data
          try {
            const loginResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                // We can't login without password, so just update the session
                // The user will need to login manually
              }),
            });
          } catch (err) {
            // Ignore login error, user will login manually
            console.log("User needs to login manually after verification");
          }
        }
      }

      // Clear verification context
      sessionStorage.removeItem("verificationContext");
      sessionStorage.removeItem("lastOTPResent");

      toast({
        title: "Success",
        description: result.message || "Verification successful!",
      });
      
      // Redirect after success
      setTimeout(() => {
        setLocation(returnPath);
      }, 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: err instanceof Error ? err.message : "An error occurred during verification",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: verificationType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check for rate limit error
        if (response.status === 429 && result.remainingTime) {
          setCountdown(result.remainingTime);
          sessionStorage.setItem("lastOTPResent", Date.now().toString());
        }
        throw new Error(result.error || "Failed to resend OTP");
      }

      setOtpValue("");
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email",
      });
      setCountdown(RESEND_TIMER);
      sessionStorage.setItem("lastOTPResent", Date.now().toString());
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: err instanceof Error ? err.message : "Failed to resend OTP",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyLater = async () => {
    // Delete OTP from database
    try {
      await fetch("/api/auth/cancel-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: verificationType,
        }),
      });
    } catch (err) {
      console.error("Failed to cancel verification:", err);
    }

    // Clear verification context
    sessionStorage.removeItem("verificationContext");
    sessionStorage.removeItem("lastOTPResent");

    // Redirect back to return path
    setLocation(returnPath);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      {/* Logo Header - Top Left */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="SadaqahExpress Logo"
              className="w-10 h-10 md:w-12 md:h-12"
            />
            <div>
              <h1 className="text-xl font-bold font-serif">SadaqahExpress</h1>
              <p className="text-xs text-muted-foreground">Digital Products</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Verify Email Section - Outside Card */}
      <div className="w-full max-w-md mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to{" "}
          <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-center block">Verification Code</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button
            onClick={handleVerifyOtp}
            className="w-full"
            disabled={isVerifying || otpValue.length !== 6}
          >
            {isVerifying && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Verify Email
          </Button>

          <div className="space-y-2">
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOtp}
                disabled={isResending || countdown > 0}
                className="text-sm"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : (
                  "Resend verification code"
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleVerifyLater}
                className="text-sm text-muted-foreground"
              >
                I'll verify later
              </Button>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground text-center">
            <p>The verification code will expire in 10 minutes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}