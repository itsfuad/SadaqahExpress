import {
  Search,
  ShoppingCart,
  ShieldCheck,
  PackageSearch,
  User,
  LogOut,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart as ShoppingCartPanel,
  type CartItem,
} from "@/components/ShoppingCart";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  showSearch?: boolean;
  showCategory?: boolean;
  onSearchClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function Header({
  showSearch = false,
  showCategory = false,
  onSearchClick,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  activeCategory = "all",
  onCategoryChange,
}: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  // Cart state - managed inside Header
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error("Failed to parse cart:", error);
        }
      }
    };

    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => loadCart();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    setIsAdmin(!!admin);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  // Cart handlers
  const handleUpdateQuantity = (id: number, quantity: number) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantity } : item,
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleRemoveItem = (id: number) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedCart);
    if (updatedCart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } else {
      localStorage.removeItem("cart");
    }
    window.dispatchEvent(new Event("cartUpdated"));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setLocation("/checkout");
  };

  const handleAdminClick = () => {
    setLocation("/admin/dashboard");
  };

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    setUser(null);
    setIsAdmin(false);
    setLocation("/");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        {/* Top row: Logo, Category, Icons */}
        <div className="flex h-16 md:h-20 items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-initial">
            {/* Logo - Full branding on desktop, icon only on mobile */}
            <Link
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
                <h1 className="text-xl font-bold font-serif leading-tight">
                  SadaqahExpress
                </h1>
                <p className="text-xs text-muted-foreground">
                  Digital Products
                </p>
              </div>
            </Link>

            {showCategory && (
              <Select value={activeCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="flex-1 lg:w-[180px] min-w-0 ml-1 md:ml-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Desktop search and right buttons - grouped together */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search form */}
            {showSearch && (
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
            )}

            <ThemeToggle />

            {/* Track Order Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/track-order")}
              title="Track Order"
              data-id="button-track-order"
            >
              <PackageSearch className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Account"
                    className={user.isEmailVerified === false ? "relative" : ""}
                    style={
                      user.isEmailVerified === false
                        ? { borderColor: "#ef4444", color: "#ef4444" }
                        : {}
                    }
                  >
                    <User className="h-5 w-5" />
                    {user.isEmailVerified === false && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {user.role === "admin" && (
                        <p className="text-xs text-primary font-medium">
                          Administrator
                        </p>
                      )}
                      {user.isEmailVerified === false && (
                        <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          Verify your email
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setLocation("/admin/dashboard")}
                        className="cursor-pointer"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => setLocation("/account-settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation("/login")}
                title="Login"
                data-id="button-login"
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
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
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchToggle}
                data-id="button-search-toggle"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            <ThemeToggle />

            {/* Track Order Button - Mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/track-order")}
              title="Track Order"
              data-id="button-track-order"
            >
              <PackageSearch className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Account"
                    className={user.isEmailVerified === false ? "relative" : ""}
                    style={
                      user.isEmailVerified === false
                        ? { borderColor: "#ef4444", color: "#ef4444" }
                        : {}
                    }
                  >
                    <User className="h-5 w-5" />
                    {user.isEmailVerified === false && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {user.role === "admin" && (
                        <p className="text-xs text-primary font-medium">
                          Administrator
                        </p>
                      )}
                      {user.isEmailVerified === false && (
                        <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          Verify your email
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setLocation("/admin/dashboard")}
                        className="cursor-pointer"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => setLocation("/account-settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation("/login")}
                title="Login"
                data-id="button-login"
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
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
        {showSearch && searchExpanded && (
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

      {/* Shopping Cart Panel - Renders wherever Header is present */}
      <ShoppingCartPanel
        isOpen={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </header>
  );
}
