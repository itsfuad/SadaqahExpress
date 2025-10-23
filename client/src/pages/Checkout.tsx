import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem } from "@/components/ShoppingCart";

export default function Checkout() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      window.location.href = "/";
    }
  }, []);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem("cart");
      toast({
        title: "Order Submitted Successfully!",
        description: "Check your email for order confirmation and payment instructions.",
      });

      // clear form
      setCartItems([]);
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOrderSubmit = (data: any) => {
    const orderData = {
      customerName: data.fullName,
      customerEmail: data.email,
      customerPhone: data.phone,
      notes: data.notes,
      items: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        productImage: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
    };

    createOrderMutation.mutate(orderData);
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemCount={0}
        onCartClick={() => {}}
        onSearchClick={() => {}}
      />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold font-serif">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your order information</p>
        </div>
        
        <CheckoutForm 
          total={total}
          onSubmit={handleOrderSubmit}
        />
      </main>

      <Footer />
    </div>
  );
}
