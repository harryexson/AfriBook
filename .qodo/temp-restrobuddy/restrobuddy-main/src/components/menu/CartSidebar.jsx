import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

export default function CartSidebar({ open, onClose, cart, onUpdateQuantity, restaurant, total }) {
  const navigate = useNavigate();
  const currency = restaurant?.currency || "$";

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Store cart data in sessionStorage for checkout
    sessionStorage.setItem("checkoutCart", JSON.stringify({
      items: cart,
      restaurant: {
        id: restaurant.id,
        name: restaurant.business_name,
        currency: restaurant.currency
      },
      total
    }));
    
    navigate(createPageUrl("Checkout"));
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
            {cart.length > 0 && (
              <Badge className="bg-emerald-600">{cart.length}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Your cart is empty</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{item.name}</h4>
                        <p className="text-sm text-emerald-600 font-semibold">
                          {currency}{item.price?.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onUpdateQuantity(item.id, 0)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-bold text-slate-900">
                        {currency}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="flex-col gap-4 border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{currency}{total.toFixed(2)}</span>
              </div>
              <Button 
                onClick={handleCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}