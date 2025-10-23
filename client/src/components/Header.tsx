import { Search, ShoppingCart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

export function Header({ 
  cartItemCount = 0, 
  onCartClick, 
  onSearchClick,
  searchValue = "",
  onSearchChange,
  onSearchSubmit
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold font-serif">SadaqahExpress</h1>
                <p className="text-xs text-muted-foreground">Digital Products</p>
              </div>
            </div>
          </div>

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
                  placeholder="I'm shopping for..."
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

            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={onSearchClick}
              data-testid="button-search-mobile"
            >
              <Search className="h-5 w-5" />
            </Button>

            <ThemeToggle />

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
      </div>
    </header>
  );
}
