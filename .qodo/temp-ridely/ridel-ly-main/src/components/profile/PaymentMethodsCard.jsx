import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Trash2, Star, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const CARD_ICONS = {
  credit_card: '💳',
  debit_card: '💳',
  paypal: '🅿️',
  cash: '💵'
};

const CARD_COLORS = {
  credit_card: 'from-blue-600 to-blue-800',
  debit_card: 'from-green-600 to-green-800',
  paypal: 'from-indigo-600 to-indigo-800',
  cash: 'from-gray-600 to-gray-800'
};

export default function PaymentMethodsCard({ methods, isEditing, onChange }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: 'credit_card',
    last_four: ''
  });

  const paymentMethods = methods || [];

  const addMethod = () => {
    if (!newMethod.last_four && newMethod.type !== 'cash') return;
    
    const methodToAdd = {
      ...newMethod,
      id: `pm_${Date.now()}`,
      is_default: paymentMethods.length === 0
    };
    
    onChange([...paymentMethods, methodToAdd]);
    setNewMethod({ type: 'credit_card', last_four: '' });
    setShowAddDialog(false);
  };

  const removeMethod = (id) => {
    const updated = paymentMethods.filter(m => m.id !== id);
    if (updated.length > 0 && !updated.some(m => m.is_default)) {
      updated[0].is_default = true;
    }
    onChange(updated);
  };

  const setDefault = (id) => {
    const updated = paymentMethods.map(m => ({
      ...m,
      is_default: m.id === id
    }));
    onChange(updated);
  };

  const formatType = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-500" />
            Payment Methods
          </CardTitle>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Payment
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No payment methods added</p>
              {isEditing && (
                <Button variant="link" onClick={() => setShowAddDialog(true)} className="mt-2">
                  Add a payment method
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={cn(
                    "relative p-4 rounded-xl text-white bg-gradient-to-br",
                    CARD_COLORS[method.type] || CARD_COLORS.credit_card
                  )}
                >
                  {method.is_default && (
                    <Badge className="absolute top-2 right-2 bg-white/20 text-white text-xs">
                      Default
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{CARD_ICONS[method.type]}</span>
                    <span className="font-medium">{formatType(method.type)}</span>
                  </div>
                  {method.last_four && (
                    <p className="font-mono text-lg tracking-wider">
                      •••• •••• •••• {method.last_four}
                    </p>
                  )}
                  {isEditing && (
                    <div className="flex gap-2 mt-4">
                      {!method.is_default && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDefault(method.id)}
                          className="bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeMethod(method.id)}
                        className="bg-white/20 hover:bg-red-500 text-white"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <Select
                value={newMethod.type}
                onValueChange={(value) => setNewMethod({ ...newMethod, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newMethod.type !== 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last 4 Digits
                </label>
                <Input
                  value={newMethod.last_four}
                  onChange={(e) => setNewMethod({ ...newMethod, last_four: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              onClick={addMethod} 
              disabled={newMethod.type !== 'cash' && newMethod.last_four.length !== 4}
            >
              Add Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}