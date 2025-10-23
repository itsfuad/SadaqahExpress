import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag, DollarSign, Users, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order, Product } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  const { toast } = useToast();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) {
      window.location.href = "/admin";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    window.location.href = "/";
  };

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update order status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
  });

  const totalRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  const uniqueCustomers = new Set(orders.map(o => o.customerEmail)).size;

  const stats = [
    {
      title: "Total Products",
      value: products.length.toString(),
      icon: Package,
      change: "Active products",
    },
    {
      title: "Total Orders",
      value: orders.length.toString(),
      icon: ShoppingBag,
      change: `${orders.filter(o => o.status === "pending").length} pending`,
    },
    {
      title: "Revenue",
      value: `৳${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: "Completed orders",
    },
    {
      title: "Customers",
      value: uniqueCustomers.toString(),
      icon: Users,
      change: "Unique customers",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        cartItemCount={0}
        onCartClick={() => {}}
        onSearchClick={() => {}}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your digital products store</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="gap-2"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Recent Orders</CardTitle>
              <Button data-testid="button-manage-products">Manage Products</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.slice(0, 10).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm" data-testid={`text-order-${order.id}`}>
                        {order.id}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {order.customerEmail}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.items.map(item => item.productName).join(", ")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ৳{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={order.status === "completed" ? "default" : "secondary"}
                          data-testid={`badge-status-${order.id}`}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === "pending" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateOrderStatusMutation.mutate({ 
                              orderId: order.id, 
                              status: "completed" 
                            })}
                            data-testid={`button-complete-${order.id}`}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
