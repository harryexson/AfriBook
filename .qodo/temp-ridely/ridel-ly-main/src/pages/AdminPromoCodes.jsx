import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Tag, 
  Edit, 
  Trash2, 
  TrendingUp,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_ride_value: '',
    max_discount: '',
    valid_until: '',
    total_usage_limit: '',
    per_user_limit: 1,
    applicable_to: ['all'],
    user_type_restriction: 'all',
    is_active: true
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await base44.entities.PromoCode.list('-created_date');
      setPromoCodes(codes);
    } catch (error) {
      console.error('Error loading promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = await base44.auth.me();
      const promoData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discount_value: parseFloat(formData.discount_value),
        min_ride_value: formData.min_ride_value ? parseFloat(formData.min_ride_value) : undefined,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
        total_usage_limit: formData.total_usage_limit ? parseInt(formData.total_usage_limit) : undefined,
        per_user_limit: parseInt(formData.per_user_limit),
        created_by: user.id,
        valid_from: new Date().toISOString()
      };

      if (editingPromo) {
        await base44.entities.PromoCode.update(editingPromo.id, promoData);
        toast.success('Promo code updated successfully');
      } else {
        await base44.entities.PromoCode.create(promoData);
        toast.success('Promo code created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast.error('Failed to save promo code');
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      min_ride_value: promo.min_ride_value?.toString() || '',
      max_discount: promo.max_discount?.toString() || '',
      valid_until: promo.valid_until ? new Date(promo.valid_until).toISOString().split('T')[0] : '',
      total_usage_limit: promo.total_usage_limit?.toString() || '',
      per_user_limit: promo.per_user_limit || 1,
      applicable_to: promo.applicable_to || ['all'],
      user_type_restriction: promo.user_type_restriction || 'all',
      is_active: promo.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (promoId) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      await base44.entities.PromoCode.delete(promoId);
      toast.success('Promo code deleted');
      loadPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const toggleActive = async (promo) => {
    try {
      await base44.entities.PromoCode.update(promo.id, {
        is_active: !promo.is_active
      });
      toast.success(`Promo code ${!promo.is_active ? 'activated' : 'deactivated'}`);
      loadPromoCodes();
    } catch (error) {
      console.error('Error toggling promo:', error);
      toast.error('Failed to update promo code');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_ride_value: '',
      max_discount: '',
      valid_until: '',
      total_usage_limit: '',
      per_user_limit: 1,
      applicable_to: ['all'],
      user_type_restriction: 'all',
      is_active: true
    });
    setEditingPromo(null);
  };

  const getDiscountDisplay = (promo) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% off`;
    } else if (promo.discount_type === 'fixed_amount') {
      return `$${promo.discount_value} off`;
    } else {
      return 'Free delivery';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster richColors />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-8 h-8 text-blue-600" />
              Promo Codes
            </h1>
            <p className="text-gray-600 mt-1">Create and manage promotional discount codes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Promo Code *</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., SUMMER2024"
                      required
                      className="uppercase"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Internal description"
                    />
                  </div>

                  <div>
                    <Label>Discount Type *</Label>
                    <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="free_delivery">Free Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Discount Value *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                      placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
                      required
                    />
                  </div>

                  <div>
                    <Label>Min Ride Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_ride_value}
                      onChange={(e) => setFormData({...formData, min_ride_value: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Max Discount (for %)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                      placeholder="10.00"
                    />
                  </div>

                  <div>
                    <Label>Valid Until *</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label>Total Usage Limit</Label>
                    <Input
                      type="number"
                      value={formData.total_usage_limit}
                      onChange={(e) => setFormData({...formData, total_usage_limit: e.target.value})}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div>
                    <Label>Per User Limit *</Label>
                    <Input
                      type="number"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData({...formData, per_user_limit: e.target.value})}
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <Label>User Type</Label>
                    <Select value={formData.user_type_restriction} onValueChange={(value) => setFormData({...formData, user_type_restriction: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="new_users">New Users Only</SelectItem>
                        <SelectItem value="existing_users">Existing Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingPromo ? 'Update' : 'Create'} Promo Code
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Codes</p>
                  <p className="text-2xl font-bold mt-1">{promoCodes.filter(p => p.is_active).length}</p>
                </div>
                <Tag className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Codes</p>
                  <p className="text-2xl font-bold mt-1">{promoCodes.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Uses</p>
                  <p className="text-2xl font-bold mt-1">{promoCodes.reduce((sum, p) => sum + (p.times_used || 0), 0)}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold mt-1">
                    {promoCodes.filter(p => {
                      const daysLeft = Math.ceil((new Date(p.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysLeft <= 7 && daysLeft > 0;
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promo Codes List */}
        <Card>
          <CardHeader>
            <CardTitle>All Promo Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No promo codes yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promoCodes.map((promo) => {
                  const isExpired = new Date(promo.valid_until) < new Date();
                  const daysLeft = Math.ceil((new Date(promo.valid_until) - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={promo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                            {promo.code}
                          </code>
                          <Badge className={promo.is_active && !isExpired ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}>
                            {isExpired ? 'Expired' : promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {getDiscountDisplay(promo)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Used: {promo.times_used || 0}{promo.total_usage_limit ? `/${promo.total_usage_limit}` : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {isExpired ? 'Expired' : `${daysLeft} days left`}
                          </span>
                          {promo.min_ride_value && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Min: ${promo.min_ride_value}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(promo)}
                          disabled={isExpired}
                        >
                          {promo.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(promo)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(promo.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}