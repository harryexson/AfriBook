import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Shield, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PaymentMethods({ user }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: ""
  });

  useEffect(() => {
    // In production, this would fetch saved payment methods from Stripe
    // For now, we'll show mock data
    setPaymentMethods([
      {
        id: "pm_1",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      }
    ]);
  }, []);

  const handleAddCard = async () => {
    // In production, this would tokenize the card with Stripe
    // and save the payment method to the customer
    alert("Payment method integration with Stripe required. See Stripe Elements for secure card input.");
    setShowAddDialog(false);
  };

  const handleRemoveCard = (methodId) => {
    if (confirm("Are you sure you want to remove this payment method?")) {
      setPaymentMethods(methods => methods.filter(m => m.id !== methodId));
    }
  };

  const handleSetDefault = (methodId) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === methodId }))
    );
  };

  const getBrandIcon = (brand) => {
    const icons = {
      visa: "💳",
      mastercard: "💳",
      amex: "💳",
      discover: "💳"
    };
    return icons[brand] || "💳";
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Methods
            </CardTitle>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No payment methods saved</p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                Add Your First Card
              </Button>
            </div>
          ) : (
            paymentMethods.map(method => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border-2 border-slate-200"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getBrandIcon(method.brand)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 capitalize">
                        {method.brand} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <Badge className="bg-emerald-600 text-white">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCard(method.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Secure Payment Processing</p>
              <p className="text-sm text-blue-700">
                All payment information is encrypted and securely stored by Stripe. 
                We never store your full card details on our servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Add Payment Method
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cardholder Name</Label>
              <Input
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Card Number</Label>
              <Input
                value={newCard.cardNumber}
                onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date</Label>
                <Input
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                  placeholder="123"
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                ⚠️ This is a demo. In production, use Stripe Elements for PCI-compliant card input.
              </p>
            </div>
            <Button onClick={handleAddCard} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Lock className="w-4 h-4 mr-2" />
              Add Card Securely
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}