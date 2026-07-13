import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Home, Briefcase, Star, Plus, Trash2, Edit, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADDRESS_ICONS = {
  home: Home,
  work: Briefcase,
  other: MapPin
};

export default function SavedAddressesCard({ addresses, isEditing, onChange }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    type: 'other'
  });

  const savedAddresses = addresses || [];

  const addAddress = () => {
    if (!newAddress.label || !newAddress.address) return;
    
    const addressToAdd = {
      ...newAddress,
      id: `addr_${Date.now()}`,
      is_default: savedAddresses.length === 0
    };
    
    onChange([...savedAddresses, addressToAdd]);
    setNewAddress({ label: '', address: '', type: 'other' });
    setShowAddDialog(false);
  };

  const removeAddress = (id) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    // If we removed the default, make the first one default
    if (updated.length > 0 && !updated.some(a => a.is_default)) {
      updated[0].is_default = true;
    }
    onChange(updated);
  };

  const setDefault = (id) => {
    const updated = savedAddresses.map(a => ({
      ...a,
      is_default: a.id === id
    }));
    onChange(updated);
  };

  const getIcon = (label) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return Home;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return Briefcase;
    return MapPin;
  };

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Saved Addresses
          </CardTitle>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Address
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {savedAddresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No saved addresses yet</p>
              {isEditing && (
                <Button variant="link" onClick={() => setShowAddDialog(true)} className="mt-2">
                  Add your first address
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {savedAddresses.map((addr) => {
                const Icon = getIcon(addr.label);
                return (
                  <div
                    key={addr.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 transition-colors",
                      addr.is_default ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      addr.is_default ? "bg-blue-100" : "bg-gray-100"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        addr.is_default ? "text-blue-600" : "text-gray-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{addr.label}</h4>
                        {addr.is_default && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{addr.address}</p>
                    </div>
                    {isEditing && (
                      <div className="flex gap-1">
                        {!addr.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDefault(addr.id)}
                            className="h-8 w-8 text-gray-500 hover:text-blue-600"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAddress(addr.id)}
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Address Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
              <Input
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                placeholder="e.g., Home, Work, Mom's House"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <Input
                value={newAddress.address}
                onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={addAddress} disabled={!newAddress.label || !newAddress.address}>
              Add Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}