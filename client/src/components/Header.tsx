import { Search, ShoppingCart, Phone, ShieldCheck, ChevronDown, Laptop, Shield, Key, Youtube, GraduationCap, Film, Music, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { id: "all", label: "All Products", icon: null },
  { id: "microsoft", label: "Microsoft", icon: Laptop },
  { id: "antivirus", label: "Anti Virus", icon: Shield },
  { id: "vpn", label: "VPN", icon: Key },
  { id: "streaming", label: "Streaming", icon: Youtube },
  { id: "educational", label: "Educational", icon: GraduationCap },
  { id: "editing", label: "Editing", icon: Film },
  { id: "music", label: "Music", icon: Music },
  { id: "utilities", label: "Utilities", icon: Wrench },
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

  const activeCategoryLabel = categories.find(cat => cat.id === activeCategory)?.label || "Categories";
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        {/* Top row: Logo, Category, Icons */}
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Logo - Full branding on desktop, icon only on mobile */}
            <a 
              href="/" 
              className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3"
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 ml-2 md:ml-4">
                  <span className="text-sm">{activeCategoryLabel}</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => onCategoryChange?.(category.id)}
                      className="gap-2 cursor-pointer"
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{category.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop search - center, always visible */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
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
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search toggle button - mobile only */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSearchToggle}
              className="lg:hidden"
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
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
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
