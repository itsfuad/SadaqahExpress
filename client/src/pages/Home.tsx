import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { HeroCarousel, type CarouselSlide } from "@/components/HeroCarousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";

const ITEMS_PER_PAGE = 8;

type ProductResponse = {
  products: Product[];
  total: number;
  hasMore: boolean;
};

export default function Home() {
  const { toast } = useToast();

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [activeCategory, setActiveCategory] = useState(urlParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high">("default");
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  // Use infinite query for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<ProductResponse>({
    queryKey: ["/api/products/paginated", activeCategory, searchQuery, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(ITEMS_PER_PAGE),
        sortBy: sortBy,
      });

      if (activeCategory && activeCategory !== "all") {
        params.set("category", activeCategory);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into single product array
  const products = data?.pages.flatMap(page => page.products) ?? [];
  const totalProducts = data?.pages[0]?.total ?? 0;

  // Lazy loading intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      <Header onSearchClick={() => {}} />

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
          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category and Sort Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Category Filter */}
              <Select value={activeCategory} onValueChange={(value) => {
                setActiveCategory(value);
                setSearchQuery("");
              }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Sort by</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Header */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold font-serif mb-2">
              {searchQuery.trim() 
                ? `Search Results for "${searchQuery}"` 
                : activeCategory === "all"
                  ? "All Products"
                  : CATEGORIES.find(c => c.id === activeCategory)?.label || "Products"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `Found ${totalProducts} ${totalProducts === 1 ? 'product' : 'products'}`
                : `Showing ${products.length} of ${totalProducts} ${totalProducts === 1 ? 'product' : 'products'}`}
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : products.length === 0 ? (
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7 lg:gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>

              {/* Lazy Loading Trigger */}
              {hasNextPage && (
                <div ref={observerTarget} className="flex justify-center py-8">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more products...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of results indicator */}
              {!hasNextPage && products.length > ITEMS_PER_PAGE && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No more products available</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
