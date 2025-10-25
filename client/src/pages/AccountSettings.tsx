import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  Mail,
  ArrowLeft,
  Trash2,
  Package,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@shared/schema";
import { getOrderStatusColor } from "@/lib/orderUtils";

const updateNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type UpdateNameForm = z.infer<typeof updateNameSchema>;
type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;
type ChangeEmailForm = z.infer<typeof changeEmailSchema>;

export default function AccountSettings() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Fetch user orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/user/orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/user/orders?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    enabled: !!user?.id,
  });  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    formState: { errors: nameErrors },
    setValue: setNameValue,
  } = useForm<UpdateNameForm>({
    resolver: zodResolver(updateNameSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
    reset: resetEmail,
  } = useForm<ChangeEmailForm>({
    resolver: zodResolver(changeEmailSchema),
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/login");
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    setNameValue("name", userData.name);
  }, [setLocation, setNameValue]);

  const onSubmitName = async (data: UpdateNameForm) => {
    if (!user) return;

    setIsLoadingName(true);

    try {
      const response = await fetch(`/api/account/profile?userId=${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update name");
      }

      // Update localStorage
      const updatedUser = { ...user, name: data.name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: "Success",
        description: "Name updated successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update name",
      });
    } finally {
      setIsLoadingName(false);
    }
  };

  const onSubmitPassword = async (data: UpdatePasswordForm) => {
    if (!user) return;

    setIsLoadingPassword(true);

    try {
      const response = await fetch(`/api/account/profile?userId=${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update password");
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      resetPassword();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update password",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const onSubmitEmail = async (data: ChangeEmailForm) => {
    if (!user) return;

    setIsLoadingEmail(true);

    try {
      const response = await fetch(
        `/api/account/change-email?userId=${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEmail: data.newEmail,
            password: data.password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change email");
      }

      setNewEmail(data.newEmail);
      setShowEmailOtp(true);
      toast({
        title: "Success",
        description: "Verification code sent to your new email",
      });
      resetEmail();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to change email",
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!user || otpValue.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoadingEmail(true);
    setError("");

    try {
      const response = await fetch(
        `/api/account/verify-email-change?userId=${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEmail,
            code: otpValue,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify email");
      }

      // Update localStorage
      const updatedUser = { ...user, email: newEmail, isEmailVerified: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: "Success",
        description: "Email changed successfully",
      });
      setShowEmailOtp(false);
      setOtpValue("");
      setNewEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user) return;

    setIsSendingVerification(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: user.email,
          type: "email_verification"
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send verification code");
      }

      // Set verification context for OTP page
      sessionStorage.setItem(
        "verificationContext",
        JSON.stringify({
          email: user.email,
          type: "email_verification",
          returnPath: "/account-settings",
        })
      );

      // Redirect to OTP verification page
      setLocation("/verify-otp");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send verification code",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (!deletePassword) {
      setDeleteError("Password is required to delete account");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/account/delete?userId=${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      // Clear localStorage and redirect
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      localStorage.removeItem("cart");
      setShowDeleteDialog(false);
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete account";
      setDeleteError(errorMessage);
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showEmailOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Verify New Email</CardTitle>
              <CardDescription>
                We've sent a 6-digit verification code to{" "}
                <strong>{newEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                onClick={handleVerifyEmailOtp}
                className="w-full"
                disabled={isLoadingEmail || otpValue.length !== 6}
              >
                {isLoadingEmail && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify Email
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setShowEmailOtp(false);
                  setOtpValue("");
                  setNewEmail("");
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href={user.role === "admin" ? "/admin/dashboard" : "/"}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {user.role === "admin" ? "Dashboard" : "Home"}
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your account information
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={user.role === "admin" ? "Administrator" : "User"}
                    disabled
                    className="capitalize"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                  {user.isEmailVerified ? (
                    <p className="text-xs text-green-600">✓ Verified</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={isSendingVerification}
                        className="text-primary hover:underline font-medium"
                      >
                        {isSendingVerification ? "Sending..." : "Click to verify"}
                      </button>
                    </p>
                  )}
                </div>

                <Separator />

                <form
                  onSubmit={handleSubmitName(onSubmitName)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        className="pl-10"
                        {...registerName("name")}
                        disabled={isLoadingName}
                      />
                    </div>
                    {nameErrors.name && (
                      <p className="text-sm text-destructive">
                        {nameErrors.name.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoadingName}>
                    {isLoadingName && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Name
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitPassword(onSubmitPassword)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <PasswordInput
                      id="currentPassword"
                      placeholder="••••••••"
                      {...registerPassword("currentPassword")}
                      disabled={isLoadingPassword}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <PasswordInput
                      id="newPassword"
                      placeholder="••••••••"
                      {...registerPassword("newPassword")}
                      disabled={isLoadingPassword}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="••••••••"
                      {...registerPassword("confirmPassword")}
                      disabled={isLoadingPassword}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoadingPassword}>
                    {isLoadingPassword && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Change Email Address</CardTitle>
                <CardDescription>
                  Update your email address. You'll need to verify the new email
                  with an OTP code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitEmail(onSubmitEmail)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Current Email</Label>
                    <Input value={user.email} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newEmail">New Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="newemail@example.com"
                        className="pl-10"
                        {...registerEmail("newEmail")}
                        disabled={isLoadingEmail}
                      />
                    </div>
                    {emailErrors.newEmail && (
                      <p className="text-sm text-destructive">
                        {emailErrors.newEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailPassword">Confirm with Password</Label>
                    <PasswordInput
                      id="emailPassword"
                      placeholder="••••••••"
                      {...registerEmail("password")}
                      disabled={isLoadingEmail}
                    />
                    {emailErrors.password && (
                      <p className="text-sm text-destructive">
                        {emailErrors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoadingEmail}>
                    {isLoadingEmail && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Change Email
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order History
                </CardTitle>
                <CardDescription>
                  View all your past orders and track their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Link href="/">
                      <Button variant="ghost" className="mt-2">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="overflow-hidden">
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-sm">Order #{order.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="h-10 w-10 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Quantity: {item.quantity} × ৳{item.price}
                                  </p>
                                </div>
                                <p className="font-semibold">
                                  ৳{(item.quantity * item.price).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-lg">৳{order.total.toFixed(2)}</span>
                          </div>

                          <Link href={`/track-order/${order.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              Track Order
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone - Delete Account */}
        <Card className="border-destructive mt-8">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeletingAccount}>
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4 py-4">
                  {deleteError && (
                    <Alert variant="destructive">
                      <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="deletePassword">Confirm your password</Label>
                    <PasswordInput
                      id="deletePassword"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={isDeletingAccount}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your password to confirm account deletion
                    </p>
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setDeletePassword("");
                    setDeleteError("");
                  }}>Cancel</AlertDialogCancel>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAccount();
                    }}
                    disabled={isDeletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeletingAccount && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Account
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
