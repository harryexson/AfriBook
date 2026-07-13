import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CartDrawer({ isOpen, onClose, cart, onUpdateItem, onRemoveItem, onCheckout, total }) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Your cart is empty</h3>
            <p className="text-slate-600">Add items from the menu to get started</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-6" style={{ height: 'calc(100vh - 250px)' }}>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white border rounded-lg p-4">
                    <div className="flex gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1">{item.name}</h4>
                        
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-slate-600 mb-2">
                            {item.modifiers.map((mod, idx) => (
                              <div key={idx}>• {mod.name}</div>
                            ))}
                          </div>
                        )}

                        {item.special_instructions && (
                          <p className="text-xs text-slate-500 italic mb-2">
                            "{item.special_instructions}"
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => onUpdateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 1 })}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-600">
                              ${(item.total_price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-600"
                              onClick={() => onRemoveItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="flex-col gap-4">
              <div className="w-full space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax (estimated)</span>
                  <span className="font-medium">${(total * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-emerald-600">${(total * 1.08).toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={onCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
              >
                Proceed to Checkout
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}