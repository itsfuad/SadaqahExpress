import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { HeroCarousel, type CarouselSlide } from "@/components/HeroCarousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [activeCategory, setActiveCategory] = useState(urlParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);

  // Dynamically load images from public/images directory
  useEffect(() => {
    const imageFiles = ['gpt.jpg', 'idm.jpg', 'office.jpg', 'windows.jpg'];
    
    const slides: CarouselSlide[] = imageFiles.map((filename, index) => ({
      id: index + 1,
      image: `/images/${filename}`,
    }));
    
    setCarouselSlides(slides);
  }, []);

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
        showSearch={true}
        showCategory={true}
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

      {carouselSlides.length > 0 && (
        <HeroCarousel 
          slides={carouselSlides}
          heroTitle="Sadaqah Express"
          heroSubtitle="Buy premium software licenses and subscriptions instantly"
          ctaText="Buy Now"
          onCtaClick={() => {
            // Scroll to products section
            const productsSection = document.querySelector('main');
            productsSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
      
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
