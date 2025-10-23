import { Search, ShoppingCart, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchClick?: () => void;
}

export function Header({ cartItemCount = 0, onCartClick, onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">BD</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold font-serif">TechPark</h1>
                <p className="text-xs text-muted-foreground">Digital Products</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="I'm shopping for..."
                className="pl-10 pr-4 w-full"
                data-testid="input-search"
                onClick={onSearchClick}
              />
              <Button 
                variant="default" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                data-testid="button-search"
                onClick={onSearchClick}
              >
                Search
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hotline</p>
                <p className="font-semibold">(+880) 183-9545699</p>
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

            <Button variant="ghost" size="icon" data-testid="button-login">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
