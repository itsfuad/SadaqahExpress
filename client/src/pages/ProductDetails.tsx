import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Star, Package, Shield, Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "@/components/StarRating";
import { FEATURE_FLAGS } from "@/config";
import type { Product } from "@/components/ProductCard";

export default function ProductDetails() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = params?.id ? parseInt(params.id) : null;

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!productId,
  });

  const { data: productRating } = useQuery({
    queryKey: [`/api/ratings/product/${productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/ratings/product/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch ratings");
      return response.json();
    },
    enabled: !!productId && FEATURE_FLAGS.ENABLE_RATINGS,
  });

  const { data: userRating } = useQuery({
    queryKey: [`/api/ratings/user/${productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/ratings/user/${productId}`, {
        credentials: 'include',
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!productId && !!currentUser?.id && FEATURE_FLAGS.ENABLE_RATINGS,
  });

  const handleRate = async (rating: number) => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "Please login to rate this product.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          rating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit rating");
      }

      queryClient.invalidateQueries({ queryKey: [`/api/ratings/product/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/user/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });

      toast({
        title: "Rating submitted",
        description: `You rated this product ${rating} star${rating > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item: any) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Product not found</h2>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-fit"
            >
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {isOutOfStock && (
                  <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                    Out of Stock
                  </Badge>
                )}
                {!isOutOfStock && discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-chart-3 text-foreground">
                    -{discount}% OFF
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                {product.category && (
                  <Badge variant="outline" className="mb-4">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </Badge>
                )}
                
                {FEATURE_FLAGS.ENABLE_RATINGS && (
                  <div className="mb-4">
                    <StarRating
                      productId={product.id}
                      currentRating={userRating?.rating}
                      averageRating={productRating?.average || product.rating}
                      totalRatings={productRating?.count || product.reviewCount}
                      userId={currentUser?.id}
                      onRate={handleRate}
                      size="lg"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold">৳ {product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      ৳ {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-green-600 font-medium">
                    You save ৳ {(product.originalPrice! - product.price).toFixed(2)} ({discount}%)
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-muted-foreground">{product.description}</p>
                
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {isOutOfStock ? (
                      <span className="text-destructive font-medium">Out of Stock</span>
                    ) : (
                      <span>{product.stock} units available</span>
                    )}
                  </span>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  variant={isOutOfStock ? "destructive" : "default"}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
