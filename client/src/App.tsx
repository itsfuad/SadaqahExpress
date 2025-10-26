import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Checkout from "@/pages/Checkout";
import OrderTracking from "@/pages/OrderTracking";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NewAdmin from "@/pages/NewAdmin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AccountSettings from "@/pages/AccountSettings";
import VerifyOTPPage from "@/pages/VerifyOTPPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ManageProducts from "@/pages/ManageProducts";
import ManageOrders from "@/pages/ManageOrders";
import BackupRestore from "@/pages/BackupRestore";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/track-order" component={OrderTracking} />
      <Route path="/track-order/:id" component={OrderTracking} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/new-admin" component={NewAdmin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/verify-otp" component={VerifyOTPPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products" component={ManageProducts} />
      <Route path="/admin/orders" component={ManageOrders} />
      <Route path="/admin/backup" component={BackupRestore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
