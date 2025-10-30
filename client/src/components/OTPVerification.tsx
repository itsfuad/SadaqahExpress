import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RESEND_TIMER = 10; // 10 seconds for development, will be 120 in production

interface OTPVerificationProps {
  email: string;
  verificationType: "email_verification" | "password_reset" | "email_change";
  title?: string;
  description?: string;
  onVerifySuccess: (result: any) => void;
  onCancel?: () => void;
  verifyEndpoint?: string;
  showCancelButton?: boolean;
  startTimer?: boolean; // New prop to control initial timer
}

export function OTPVerification({
  email,
  verificationType,
  title = "Enter Verification Code",
  description = "Code sent to",
  onVerifySuccess,
  onCancel,
  verifyEndpoint = "/api/auth/verify-otp",
  showCancelButton = true,
  startTimer = false,
}: OTPVerificationProps) {
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Load countdown from localStorage if exists, or start timer if requested
  useEffect(() => {
    const storageKey = `otpTimer_${email}_${verificationType}`;
    const lastResent = localStorage.getItem(storageKey);
    if (lastResent) {
      const elapsed = Math.floor((Date.now() - Number.parseInt(lastResent)) / 1000);
      if (elapsed < RESEND_TIMER) {
        setCountdown(RESEND_TIMER - elapsed);
      }
    } else if (startTimer) {
      // Start timer on first send
      setCountdown(RESEND_TIMER);
      localStorage.setItem(storageKey, Date.now().toString());
    }
  }, [email, verificationType, startTimer]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(verifyEndpoint, {
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

      // Clear timer from localStorage
      const storageKey = `otpTimer_${email}_${verificationType}`;
      localStorage.removeItem(storageKey);

      toast({
        title: "Success",
        description: result.message || "Verification successful!",
      });

      onVerifySuccess(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Verification failed";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: errorMsg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError("");

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
          const storageKey = `otpTimer_${email}_${verificationType}`;
          localStorage.setItem(storageKey, Date.now().toString());
        }
        throw new Error(result.error || "Failed to resend OTP");
      }

      setOtpValue("");
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email",
      });
      
      setCountdown(RESEND_TIMER);
      const storageKey = `otpTimer_${email}_${verificationType}`;
      localStorage.setItem(storageKey, Date.now().toString());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to resend OTP";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: errorMsg,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      // Delete OTP from database
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

      // Clear timer from localStorage
      const storageKey = `otpTimer_${email}_${verificationType}`;
      localStorage.removeItem(storageKey);

      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error("Failed to cancel verification:", err);
      // Still call onCancel even if API fails
      if (onCancel) {
        onCancel();
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
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
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      <Button
        onClick={handleVerifyOtp}
        className="w-full"
        disabled={isVerifying || otpValue.length !== 6}
      >
        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify Code
      </Button>

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

      {showCancelButton && onCancel && (
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isCancelling}
            className="text-sm text-muted-foreground"
          >
            {isCancelling && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Verify later
          </Button>
        </div>
      )}

      <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground text-center">
        <p>The verification code will expire in 10 minutes.</p>
      </div>
    </div>
  );
}
