import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { HeroCarousel, type CarouselSlide } from "@/components/HeroCarousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

import heroImage1 from '@assets/generated_images/Windows_10_Pro_hero_banner_83c8c954.png';
import heroImage2 from '@assets/generated_images/Office_2021_hero_banner_5189d70c.png';
import heroImage3 from '@assets/generated_images/YouTube_Premium_hero_banner_0af84554.png';

export default function Home() {
  const { toast } = useToast();

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [activeCategory, setActiveCategory] = useState(urlParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");

  // Update URL when category or search changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (activeCategory && activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";
    window.history.pushState({}, "", newUrl);
  }, [activeCategory, searchQuery]);

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

  // Fetch all products for search
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

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

  // Filter products based on search query for inline search
  const filteredProducts = searchQuery.trim() 
    ? products.filter((product) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          product.name.toLowerCase().includes(query)
        );
      })
    : products;

  const handleAddToCart = (product: Product) => {
    // Get current cart from localStorage
    const savedCart = localStorage.getItem("cart");
    const currentCart = savedCart ? JSON.parse(savedCart) : [];
    
    const existingItem = currentCart.find((item: any) => item.id === product.id);
    
    let updatedCart;
    if (existingItem) {
      updatedCart = currentCart.map((item: any) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...currentCart, {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: 1,
      }];
    }

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    
    // Notify Header to update
    window.dispatchEvent(new Event("cartUpdated"));

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          if (searchQuery.trim()) {
            toast({
              title: "Search",
              description: `Showing results for "${searchQuery}"`,
            });
          }
        }}
        activeCategory={activeCategory}
        onCategoryChange={(category) => {
          setActiveCategory(category);
          setSearchQuery("");
        }}
      />
      <HeroCarousel slides={carouselSlides} />
      
      <main className="flex-1">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-20 py-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold font-serif mb-2">
              {searchQuery.trim() 
                ? `Search Results for "${searchQuery}"` 
                : "Browse Products"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `Found ${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`
                : "Browse our most popular digital products"}
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery.trim() ? "No products found" : "No products available"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery.trim() 
                    ? `No products match "${searchQuery}". Try a different search term.`
                    : activeCategory === "all" 
                      ? "There are no products available at the moment." 
                      : "No products found in this category."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7 lg:gap-8">
              {filteredProducts.map((product) => (
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
    </div>
  );
}
