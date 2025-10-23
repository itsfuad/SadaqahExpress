import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag, DollarSign, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  // TODO: Replace with actual data from backend
  const stats = [
    {
      title: "Total Products",
      value: "8",
      icon: Package,
      change: "+2 this week",
    },
    {
      title: "Total Orders",
      value: "24",
      icon: ShoppingBag,
      change: "+6 today",
    },
    {
      title: "Revenue",
      value: "৳12,500",
      icon: DollarSign,
      change: "+15% this month",
    },
    {
      title: "Customers",
      value: "18",
      icon: Users,
      change: "+3 this week",
    },
  ];

  const recentOrders = [
    {
      id: "ORD-001",
      customer: "John Doe",
      email: "john@example.com",
      product: "Windows 11 Pro",
      amount: 400.00,
      status: "pending",
      date: "2025-01-23",
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      email: "jane@example.com",
      product: "Office 365",
      amount: 450.00,
      status: "completed",
      date: "2025-01-23",
    },
    {
      id: "ORD-003",
      customer: "Bob Johnson",
      email: "bob@example.com",
      product: "Windows 10 Pro",
      amount: 350.00,
      status: "pending",
      date: "2025-01-22",
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your digital products store</p>
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
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm" data-testid={`text-order-${order.id}`}>
                      {order.id}
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.email}
                    </TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell className="font-semibold">
                      ৳{order.amount.toFixed(2)}
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
                      {order.date}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-view-${order.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
