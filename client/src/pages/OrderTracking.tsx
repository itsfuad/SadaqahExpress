import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function OrderTracking() {
  const [, params] = useRoute("/track-order/:id");
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState("");
  const [searchOrderId, setSearchOrderId] = useState("");
  const { toast } = useToast();

  // Initialize from URL parameter
  useEffect(() => {
    if (params?.id) {
      setOrderId(params.id);
      setSearchOrderId(params.id);
    }
  }, [params?.id]);

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["/api/orders", searchOrderId],
    queryFn: async () => {
      if (!searchOrderId) return null;
      const response = await fetch(`/api/orders/${searchOrderId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Order not found");
        }
        throw new Error("Failed to fetch order");
      }
      return response.json();
    },
    enabled: !!searchOrderId,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast({
        title: "Order ID required",
        description: "Please enter your order ID to track your order.",
        variant: "destructive",
      });
      return;
    }
    setSearchOrderId(orderId.trim());
    // Update URL to include order ID
    setLocation(`/track-order/${orderId.trim()}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "received":
        return <Package className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "received":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">Track Your Order</h1>
              <p className="text-muted-foreground">Enter your order ID to check the status</p>
            </div>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter your order ID (e.g., ORDER-123)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Track Order
                  </Button>
                </form>
              </CardContent>
            </Card>

            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching for your order...</p>
              </div>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find an order with ID "{searchOrderId}". Please check your order ID and try again.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {order && !isLoading && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Order Details</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-semibold">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Order Date</p>
                        <p className="font-semibold">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Customer Name</p>
                        <p className="font-semibold">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{order.customerEmail}</p>
                      </div>
                      {order.customerPhone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-semibold">{order.customerPhone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-lg">৳ {order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {order.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="mt-1">{order.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">৳ {item.price.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Subtotal: ৳ {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Only show status timeline for non-cancelled orders */}
                {order.status !== 'cancelled' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Status Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 ${order.status === 'received' || order.status === 'processing' || order.status === 'completed' ? 'text-green-500' : 'text-gray-300'}`}>
                            <CheckCircle className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Order Received</h4>
                            <p className="text-sm text-muted-foreground">We've received your order</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 ${order.status === 'processing' || order.status === 'completed' ? 'text-blue-500' : 'text-gray-300'}`}>
                            <Clock className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Processing</h4>
                            <p className="text-sm text-muted-foreground">Your order is being processed</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 ${order.status === 'completed' ? 'text-green-500' : 'text-gray-300'}`}>
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Completed</h4>
                            <p className="text-sm text-muted-foreground">Your order has been completed</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
