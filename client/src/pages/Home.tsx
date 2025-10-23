import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { HeroCarousel, type CarouselSlide } from "@/components/HeroCarousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ShoppingCart, type CartItem } from "@/components/ShoppingCart";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

import heroImage1 from '@assets/generated_images/Windows_10_Pro_hero_banner_83c8c954.png';
import heroImage2 from '@assets/generated_images/Office_2021_hero_banner_5189d70c.png';
import heroImage3 from '@assets/generated_images/YouTube_Premium_hero_banner_0af84554.png';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const carouselSlides: CarouselSlide[] = [
    {
      id: 1,
      image: heroImage1,
      title: "GET YOUR WINDOWS 10 PRO NOW",
      subtitle: "OFFER PRICE",
      price: "350 BDT",
      ctaText: "Shop Now",
    },
    {
      id: 2,
      image: heroImage2,
      title: "OFFICE 2021",
      subtitle: "Professional Plus",
      price: "500 BDT",
      ctaText: "Shop Now",
    },
    {
      id: 3,
      image: heroImage3,
      title: "YOUTUBE PREMIUM",
      subtitle: "Ad-Free Experience",
      price: "400 BDT",
      ctaText: "Shop Now",
    },
  ];

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", activeCategory],
    queryFn: async () => {
      const url = activeCategory === "all" 
        ? "/api/products" 
        : `/api/products?category=${activeCategory}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: 1,
      }]);
    }

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("cart", JSON.stringify(cartItems));
    window.location.href = "/checkout";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        onSearchClick={() => toast({ title: "Search", description: "Search functionality coming soon!" })}
      />
      <CategoryNav 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <HeroCarousel slides={carouselSlides} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2">Top Selling Products</h2>
            <p className="text-muted-foreground">Browse our most popular digital products</p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      <ShoppingCart
        isOpen={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
