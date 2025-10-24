import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export default function Checkout() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        toast({
          title: "Error",
          description: "Failed to load cart. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      }
    } else {
      // No cart found, redirect to home
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart first.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
      window.dispatchEvent(new Event("cartUpdated"));
    } else if (!isLoading) {
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Cart is empty",
        description: "Redirecting to home page...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    }
  }, [cartItems, isLoading]);

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
      window.dispatchEvent(new Event("cartUpdated"));
      toast({
        title: "Order Submitted Successfully!",
        description: "Check your email for order confirmation and payment instructions.",
      });
      setCartItems([]);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        setLocation("/");
      }, 2000);
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

  // Show loading state while checking cart
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearchClick={() => {}} />
      
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
