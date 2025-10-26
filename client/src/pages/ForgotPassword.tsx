import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type EmailForm = z.infer<typeof emailSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmitEmail = async (data: EmailForm) => {
    setIsLoading(true);
    setError("");

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
        throw new Error(result.error || "Failed to send reset code");
      }

      // Set verification context for OTP page
      sessionStorage.setItem(
        "verificationContext",
        JSON.stringify({
          email: data.email,
          type: "password_reset",
          returnPath: "/forgot-password",
        })
      );

      // Redirect to OTP verification page
      setLocation("/verify-otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset code",
      );
    } finally {
      setIsLoading(false);
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

      {/* Forgot Password - Centered */}
      <div className="flex flex-col items-center justify-center mt-8">
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
      </div>
    </div>
  );
}
