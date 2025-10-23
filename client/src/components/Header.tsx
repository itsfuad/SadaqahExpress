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

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    setIsAdmin(!!admin);
  }, []);

  const handleAdminClick = () => {
    window.location.href = "/admin/dashboard";
  };

  const activeCategoryLabel = categories.find(cat => cat.id === activeCategory)?.label || "Categories";
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        {/* Top row: Logo, Category, Icons */}
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <a 
              href="/" 
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <h1 className="text-lg md:text-xl font-bold font-serif">
                <span className="lg:hidden">SE</span>
                <span className="hidden lg:inline">SadaqahExpress</span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Digital Products</p>
            </a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 ml-2 md:ml-4">
                  <span className="font-semibold text-sm md:text-base">{activeCategoryLabel}</span>
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

          {/* Desktop search - center */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit?.();
              }}
              className="w-full flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 pr-4 w-full h-10"
                  data-testid="input-search"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
              <Button 
                type="submit"
                variant="default" 
                className="h-10 px-6 shrink-0"
                data-testid="button-search"
              >
                Search
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hotline</p>
                <p className="font-semibold">(+880) 123-4567890</p>
              </div>
            </div>

            <ThemeToggle />

            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleAdminClick}
                title="Admin Dashboard"
                data-testid="button-admin"
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile search bar - bottom row, only visible on mobile */}
        <div className="lg:hidden pb-3">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit?.();
            }}
            className="w-full flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4 w-full h-10"
                data-testid="input-search-mobile"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <Button 
              type="submit"
              variant="default" 
              className="h-10 px-4 shrink-0"
              data-testid="button-search-mobile-submit"
            >
              Search
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
