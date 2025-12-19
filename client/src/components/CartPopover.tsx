import { type MouseEvent } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: string;
}

interface CartPopoverProps {
  isAuthenticated?: boolean;
}

export default function CartPopover({ isAuthenticated = false }: CartPopoverProps) {
  const [, navigate] = useLocation();
  const { currencySymbol, formatPrice } = useLanguage();

  const { data: cart = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/cart/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const totalAmount = cart.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartClick = (e: MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/auth");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-cart"
          onClick={handleCartClick}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-semibold bg-primary text-primary-foreground rounded-full"
              data-testid="badge-cart-count"
            >
              {totalItems > 9 ? "9+" : totalItems}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" data-testid="cart-popover">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Shopping Cart</h3>
          <Badge variant="secondary" data-testid="badge-cart-items">
            {totalItems} items
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading cart...</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate("/")}
              data-testid="button-start-shopping"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {cart.map((item) => (
                  <Card key={item.id} className="p-3" data-testid={`cart-item-${item.id}`}>
                    <div className="flex gap-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                        data-testid={`img-product-${item.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate" data-testid={`text-name-${item.id}`}>
                          {item.productName}
                        </h4>
                        <p className="text-sm font-semibold text-primary mt-1" data-testid={`text-price-${item.id}`}>
                          {formatPrice(parseFloat(item.price))}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            }
                            disabled={
                              item.quantity <= 1 || updateQuantityMutation.isPending
                            }
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm w-8 text-center" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                            disabled={updateQuantityMutation.isPending}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 ml-auto"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary" data-testid="text-cart-total">
                  {currencySymbol} {totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/cart")}
                  data-testid="button-view-cart"
                >
                  View Cart
                </Button>
                <Button
                  onClick={() => navigate("/checkout")}
                  data-testid="button-checkout"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
