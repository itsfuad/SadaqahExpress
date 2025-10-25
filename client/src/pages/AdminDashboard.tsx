import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Product, Order } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrderStatusColor } from "@/lib/orderUtils";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    if (!admin) {
      setLocation("/admin");
    }
  }, []);

  // Fetch all orders without pagination for dashboard stats
  const { data: ordersResponse } = useQuery({
    queryKey: ["/api/orders", "all"],
    queryFn: async () => {
      const response = await fetch("/api/orders?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const orders: Order[] = ordersResponse?.orders || [];

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const totalRevenue = orders
    .filter((o: Order) => o.status === "completed")
    .reduce((sum: number, o: Order) => sum + o.total, 0);

  const uniqueCustomers = new Set(orders.map((o: Order) => o.customerEmail))
    .size;

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
      change: `${orders.filter((o: Order) => o.status === "received" || o.status === "processing").length} active`,
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
      <Header onSearchClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your digital products store
            </p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => setLocation("/admin/products")}
            variant="outline"
            className="h-20"
          >
            <div className="text-left">
              <div className="font-semibold">Manage Products</div>
              <div className="text-sm text-muted-foreground">
                Add, edit, or remove products
              </div>
            </div>
          </Button>
          <Button
            onClick={() => setLocation("/admin/orders")}
            variant="outline"
            className="h-20"
          >
            <div className="text-left">
              <div className="font-semibold">Manage Orders</div>
              <div className="text-sm text-muted-foreground">
                View and update order status
              </div>
            </div>
          </Button>
          <Button
            onClick={() => setLocation("/admin/backup")}
            variant="outline"
            className="h-20"
          >
            <div className="text-left flex items-center gap-2">
              <Database className="h-5 w-5" />
              <div>
                <div className="font-semibold">Backup & Restore</div>
                <div className="text-sm text-muted-foreground">
                  Download and restore data
                </div>
              </div>
            </div>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Recent Orders</CardTitle>
              <Button
                onClick={() => setLocation("/admin/orders")}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.slice(0, 5).map((order: Order) => {
                    return (
                      <TableRow key={order.id}>
                        <TableCell
                          className="font-mono text-sm"
                          data-id={`text-order-${order.id}`}
                        >
                          {order.id}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="text-sm">
                          {order.items.length} item
                          {order.items.length > 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={getOrderStatusColor(order.status) + " p-1 rounded-md"}
                            data-id={`badge-status-${order.id}`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
