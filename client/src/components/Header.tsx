import { Search, ShoppingCart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const categories = [
  { id: "all", label: "All Products" },
  { id: "microsoft", label: "Microsoft" },
  { id: "antivirus", label: "Anti Virus" },
  { id: "vpn", label: "VPN" },
  { id: "streaming", label: "Streaming" },
  { id: "educational", label: "Educational" },
  { id: "editing", label: "Editing" },
  { id: "music", label: "Music" },
  { id: "utilities", label: "Utilities" },
];

export function Header({ 
  cartItemCount = 0, 
  onCartClick, 
  onSearchClick,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  activeCategory = "all",
  onCategoryChange
}: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    setIsAdmin(!!admin);
  }, []);

  const handleAdminClick = () => {
    window.location.href = "/admin/dashboard";
  };

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        {/* Top row: Logo, Category, Icons */}
        <div className="flex h-16 md:h-20 items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-initial">
            {/* Logo - Full branding on desktop, icon only on mobile */}
            <a 
              href="/" 
              className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3 shrink-0"
            >
              {/* Logo icon - always visible */}
              <img 
                src="/favicon.png" 
                alt="SadaqahExpress Logo" 
                className="w-10 h-10 md:w-12 md:h-12 shrink-0"
              />
              
              {/* Text branding - hidden on mobile, visible on desktop */}
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold font-serif leading-tight">SadaqahExpress</h1>
                <p className="text-xs text-muted-foreground">Digital Products</p>
              </div>
            </a>
            
            <Select value={activeCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="flex-1 lg:w-[180px] min-w-0 ml-1 md:ml-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop search and right buttons - grouped together */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit?.();
              }}
              className="flex items-center gap-2"
            >
              <Input
                type="search"
                placeholder="Search products..."
                className="w-[300px] h-10"
                data-id="input-search-desktop"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon"
                className="h-10 w-10 shrink-0"
                data-id="button-search-desktop"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <ThemeToggle />

            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleAdminClick}
                title="Admin Dashboard"
                data-id="button-admin"
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
              data-id="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="no-default-hover-elevate absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                  data-id="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile buttons - only shown on mobile */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2 shrink-0">
            {/* Search toggle button - mobile only */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSearchToggle}
              data-id="button-search-toggle"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleAdminClick}
                title="Admin Dashboard"
                data-id="button-admin"
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
              data-id="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="no-default-hover-elevate absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                  data-id="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile expandable search bar - appears below when toggled, hidden on desktop */}
        {searchExpanded && (
          <div className="lg:hidden pb-3 animate-in slide-in-from-top-2 duration-200">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit?.();
              }}
              className="w-full flex items-center gap-2"
            >
              <Input
                type="search"
                placeholder="Search products..."
                className="flex-1 h-10"
                data-id="input-search-mobile"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                autoFocus
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon"
                className="h-10 w-10 shrink-0"
                data-id="button-search-mobile"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
