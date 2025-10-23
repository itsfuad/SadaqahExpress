import { useState } from "react";
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
import win11Image from '@assets/generated_images/Windows_11_Pro_product_196eac28.png';
import win10Image from '@assets/generated_images/Windows_10_Pro_product_40a7a793.png';
import office365Image from '@assets/generated_images/Office_365_product_image_c759444f.png';
import office2021Image from '@assets/generated_images/Office_2021_Pro_product_a1d6491d.png';
import comboImage from '@assets/generated_images/Windows_Office_combo_product_ae6a5ccd.png';

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

  const allProducts: Product[] = [
    {
      id: 1,
      name: "Windows 11 Pro",
      image: win11Image,
      price: 400.00,
      originalPrice: 850.00,
      rating: 5,
      reviewCount: 19,
      badge: "Bestseller",
      category: "microsoft"
    },
    {
      id: 2,
      name: "Windows 10 Pro",
      image: win10Image,
      price: 350.00,
      originalPrice: 399.00,
      rating: 4,
      reviewCount: 62,
      category: "microsoft"
    },
    {
      id: 3,
      name: "Combo Product",
      image: comboImage,
      price: 600.00,
      originalPrice: 800.00,
      rating: 5,
      reviewCount: 45,
      badge: "Sale",
      category: "microsoft"
    },
    {
      id: 4,
      name: "Microsoft Office 365",
      image: office365Image,
      price: 400.00,
      originalPrice: 600.00,
      rating: 4,
      reviewCount: 14,
      category: "microsoft"
    },
    {
      id: 5,
      name: "Microsoft Office 2021 Pro Plus",
      image: office2021Image,
      price: 500.00,
      originalPrice: 1500.00,
      rating: 5,
      reviewCount: 86,
      category: "microsoft"
    },
    {
      id: 6,
      name: "Windows 11 Pro Digital License",
      image: win11Image,
      price: 450.00,
      originalPrice: 900.00,
      rating: 5,
      reviewCount: 32,
      category: "microsoft"
    },
    {
      id: 7,
      name: "Windows 10 Home",
      image: win10Image,
      price: 300.00,
      originalPrice: 350.00,
      rating: 4,
      reviewCount: 28,
      category: "microsoft"
    },
    {
      id: 8,
      name: "Office 2021 Home & Business",
      image: office2021Image,
      price: 450.00,
      originalPrice: 1200.00,
      rating: 5,
      reviewCount: 54,
      category: "microsoft"
    },
  ];

  const filteredProducts = activeCategory === "all" 
    ? allProducts 
    : allProducts.filter(p => p.category === activeCategory);

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
    toast({
      title: "Checkout",
      description: "Proceeding to checkout...",
    });
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
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
