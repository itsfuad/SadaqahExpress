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
import { Loader2, Mail, User, ShieldCheck } from "lucide-react";

const adminSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AdminForm = z.infer<typeof adminSchema>;

export default function NewAdmin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
  });

  // Check if admin already exists
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/has-admin");
        const data = await response.json();

        if (data.hasAdmin) {
          // Admin already exists, redirect to login
          setLocation("/login");
        }
      } catch (err) {
        console.error("Error checking admin:", err);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [setLocation]);

  const onSubmit = async (data: AdminForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: "admin",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create admin account");
      }

      // Set verification context for OTP page
      sessionStorage.setItem(
        "verificationContext",
        JSON.stringify({
          email: data.email,
          type: "email_verification",
          returnPath: "/admin/dashboard",
        })
      );

      // Redirect to OTP verification page
      setLocation("/verify-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin account");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Admin Setup - Centered */}
      <div className="flex flex-col items-center justify-center mt-8">
        <div className="w-full max-w-md mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Create Admin Account</h1>
          </div>
          <p className="text-muted-foreground">
            This is the first-time setup. Create your admin account to manage the store.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl border-primary/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Admin Name"
                    className="pl-10"
                    {...register("name")}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    className="pl-10"
                    {...register("email")}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Account
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                This account will have full access to manage products, orders,
                and settings. Make sure to use a strong password and keep your
                credentials secure.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
