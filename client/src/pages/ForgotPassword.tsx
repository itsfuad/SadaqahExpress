import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_TIMER = 10; // 10 seconds for development, will be 120 in production

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Timer for resend countdown
  useEffect(() => {
    if (countdown > 0 && step === "otp") {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown, step]);

  // Initialize countdown from localStorage on mount if on OTP step
  useEffect(() => {
    if (step === "otp") {
      const lastResent = localStorage.getItem(`otp_resend_${email}`);
      if (lastResent) {
        const elapsed = Math.floor((Date.now() - Number.parseInt(lastResent)) / 1000);
        if (elapsed < RESEND_TIMER) {
          setCountdown(RESEND_TIMER - elapsed);
        }
      }
    }
  }, [step, email]);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

    const onSubmitEmail = async (data: EmailForm) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check for rate limit error - only set countdown if rate limited
        if (response.status === 429 && result.remainingTime) {
          setCountdown(result.remainingTime);
          localStorage.setItem(`otp_resend_${data.email}`, Date.now().toString());
        }
        // Don't proceed to OTP step if there's an error
        throw new Error(result.error || "Failed to send reset code");
      }

      // Only proceed if successful
      setEmail(data.email);
      setSuccess("Verification code sent to your email");
      setStep("otp");
      // Set initial countdown
      setCountdown(RESEND_TIMER);
      localStorage.setItem(`otp_resend_${data.email}`, Date.now().toString());
    } catch (err) {
      // Stay on email step and show error
      setError(
        err instanceof Error ? err.message : "Failed to send reset code",
      );
      // Make sure we stay on email step
      setStep("email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setStep("reset");
  };

  const onSubmitReset = async (data: ResetForm) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: otpValue,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check for rate limit error
        if (response.status === 429 && result.remainingTime) {
          setCountdown(result.remainingTime);
          localStorage.setItem(`otp_resend_${email}`, Date.now().toString());
        }
        throw new Error(result.error || "Failed to resend code");
      }

      setOtpValue("");
      setSuccess("A new verification code has been sent to your email");
      setCountdown(RESEND_TIMER);
      localStorage.setItem(`otp_resend_${email}`, Date.now().toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      {/* Logo Header - Top Left */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3 w-fit">
          <img
            src="/favicon.png"
            alt="SadaqahExpress Logo"
            className="w-10 h-10 md:w-12 md:h-12"
          />
          <div>
            <h1 className="text-xl font-bold font-serif leading-tight">
              SadaqahExpress
            </h1>
            <p className="text-xs text-muted-foreground">
              Digital Products
            </p>
          </div>
        </Link>
      </div>

      {/* Forgot Password - Centered */}
      <div className="flex flex-col items-center justify-center mt-8">
        {step === "email" && (
          <>
            <div className="w-full max-w-md mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
              <p className="text-muted-foreground">
                Enter your email address and we'll send you a verification code
              </p>
            </div>

            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="pt-6">
              <form
                onSubmit={handleSubmitEmail(onSubmitEmail)}
                className="space-y-4"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert variant="success">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...registerEmail("email")}
                      disabled={isLoading}
                    />
                  </div>
                  {emailErrors.email && (
                    <p className="text-sm text-destructive">
                      {emailErrors.email.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Verification Code
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground text-center w-full">
                Accidentally came here?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Go to login
                </Link>
              </div>
            </CardFooter>
          </Card>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="w-full max-w-md mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Verify Code</h1>
              <p className="text-muted-foreground">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
            </div>

            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="pt-6 space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
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
                disabled={otpValue.length !== 6}
              >
                Verify Code
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isResending || countdown > 0}
                >
                  {isResending ? (
                    "Sending..."
                  ) : countdown > 0 ? (
                    `Resend code in ${countdown}s`
                  ) : (
                    "Didn't receive the code? Resend"
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        {step === "reset" && (
          <>
            <div className="w-full max-w-md mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
              <p className="text-muted-foreground">
                Enter your new password
              </p>
            </div>

            <Card className="w-full max-w-md shadow-xl">
              <CardContent className="pt-6">
              <form
                onSubmit={handleSubmitReset(onSubmitReset)}
                className="space-y-4"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert variant="success">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput
                    id="newPassword"
                    placeholder="••••••••"
                    {...registerReset("newPassword")}
                    disabled={isLoading}
                  />
                  {resetErrors.newPassword && (
                    <p className="text-sm text-destructive">
                      {resetErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="••••••••"
                    {...registerReset("confirmPassword")}
                    disabled={isLoading}
                  />
                  {resetErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {resetErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Reset Password
                </Button>
              </form>
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}
