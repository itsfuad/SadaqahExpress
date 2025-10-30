import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Product {
  id: number;
  name: string;
  description?: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  category?: string;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [, setLocation] = useLocation();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  const isOutOfStock = product.stock === 0;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setLocation(`/product/${product.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="overflow-hidden group transition-all duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          {isOutOfStock && (
            <Badge 
              className="absolute top-2 left-2 bg-destructive text-destructive-foreground"
              data-id={`badge-out-of-stock-${product.id}`}
            >
              Out of Stock
            </Badge>
          )}
          {!isOutOfStock && discount > 0 && (
            <Badge 
              className="absolute top-2 left-2 bg-chart-3 text-foreground"
              data-id={`badge-discount-${product.id}`}
            >
              -{discount}%
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base mb-3 line-clamp-2" data-id={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold" data-id={`text-price-${product.id}`}>
              ৳ {product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ৳ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          {product.originalPrice && discount > 0 && (
            <p className="text-sm text-chart-3 mt-1 font-medium">
              You save ৳ {(product.originalPrice - product.price).toFixed(2)} ({discount}%)
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <motion.div
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              disabled={isOutOfStock}
              variant={isOutOfStock ? "destructive" : "default"}
              data-id={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
