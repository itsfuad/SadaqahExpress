import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { createPortal } from "react-dom";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface ShoppingCartProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity?: (id: number, quantity: number) => void;
  onRemoveItem?: (id: number) => void;
  onCheckout?: () => void;
}

export function ShoppingCart({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  const cartContent = (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
        data-id="cart-overlay"
      />
      
      {/* Cart Panel */}
      <div className="fixed right-0 top-0 bottom-0 h-full w-full sm:w-96 bg-background border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Your Cart</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-id="button-close-cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add some products to get started!
            </p>
            <Button onClick={onClose} data-id="button-browse-products">
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md bg-muted"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm" data-id={`text-cart-item-${item.id}`}>
                            {item.name}
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-1 -mr-2"
                            onClick={() => onRemoveItem?.(item.id)}
                            data-id={`button-remove-item-${item.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-lg font-bold mb-2">৳ {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))}
                            data-id={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Badge variant="secondary" className="px-3" data-id={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </Badge>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                            data-id={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold" data-id="text-cart-total">
                  ৳ {total.toFixed(2)}
                </span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={onCheckout}
                data-id="button-checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render using portal to document body to escape header's z-index stacking
  return createPortal(cartContent, document.body);
}
