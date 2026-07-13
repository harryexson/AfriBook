import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Send, Users, Gift } from "lucide-react";
import { PersonalizedOffer } from "@/entities/PersonalizedOffer";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function SendPromotionDialog({ customers, onClose, onSuccess }) {
  const [sending, setSending] = useState(false);
  const [targetSegment, setTargetSegment] = useState("all");
  const [promotion, setPromotion] = useState({
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    valid_days: 30,
    send_sms: true
  });

  const getTargetCustomers = () => {
    switch (targetSegment) {
      case 'vip':
        return customers.filter(c => c.loyaltyInfo?.tier === 'gold' || c.loyaltyInfo?.tier === 'platinum');
      case 'inactive':
        return customers.filter(c => c.lastOrderDaysAgo > 90);
      case 'high_value':
        return customers.filter(c => c.totalSpent > 500);
      default:
        return customers;
    }
  };

  const targetCustomers = getTargetCustomers();

  const handleSend = async () => {
    if (!promotion.title || !promotion.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      const validFrom = new Date().toISOString();
      const validUntil = new Date(Date.now() + promotion.valid_days * 24 * 60 * 60 * 1000).toISOString();

      // Create offers for each customer
      const offerPromises = targetCustomers.map(async (customer) => {
        try {
          const offer = await PersonalizedOffer.create({
            customer_email: customer.email || customer.phone,
            loyalty_member_id: customer.loyaltyInfo?.id,
            offer_type: 'discount',
            title: promotion.title,
            description: promotion.description,
            discount_value: promotion.discount_value,
            discount_type: promotion.discount_type,
            valid_from: validFrom,
            valid_until: validUntil,
            usage_limit: 1,
            status: 'active',
            trigger_reason: 'custom'
          });

          // Send in-app notification
          let smsSent = false;
          if (promotion.send_sms && customer.phone) {
            try {
              await base44.functions.invoke('sendSms', {
                to: customer.phone,
                message: `Hi ${customer.name}! ${promotion.title} ${promotion.description} ${promotion.discount_type === 'percentage' ? promotion.discount_value + '% off' : '$' + promotion.discount_value + ' off'} your next order. Valid for ${promotion.valid_days} days!`
              });
              smsSent = true;
            } catch (smsError) {
              console.log('SMS failed for', customer.phone);
            }
          }

          await Notification.create({
            customer_email: customer.email,
            customer_phone: customer.phone,
            title: promotion.title,
            message: `${promotion.description} ${promotion.discount_type === 'percentage' ? promotion.discount_value + '% off' : '$' + promotion.discount_value + ' off'} your next order!`,
            type: 'promotion',
            priority: 'medium',
            status: 'unread',
            action_url: createPageUrl('CustomerLoyalty'),
            action_label: 'View Offer',
            related_offer_id: offer.id,
            icon: 'gift',
            sms_sent: smsSent,
            sms_sent_at: smsSent ? new Date().toISOString() : null
          });
        } catch (error) {
          console.error('Failed to create offer for', customer.name, error);
        }
      });

      await Promise.all(offerPromises);

      alert(`Promotion sent to ${targetCustomers.length} customers!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sending promotions:", error);
      alert('Failed to send promotions. Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Send Targeted Promotion
            </CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-emerald-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Target Segment */}
          <div className="mb-6">
            <Label className="text-lg font-bold mb-3 block">Target Audience</Label>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={targetSegment === 'all' ? 'default' : 'outline'}
                onClick={() => setTargetSegment('all')}
              >
                All Customers ({customers.length})
              </Button>
              <Button
                variant={targetSegment === 'vip' ? 'default' : 'outline'}
                onClick={() => setTargetSegment('vip')}
              >
                VIP Members ({customers.filter(c => c.loyaltyInfo?.tier === 'gold' || c.loyaltyInfo?.tier === 'platinum').length})
              </Button>
              <Button
                variant={targetSegment === 'inactive' ? 'default' : 'outline'}
                onClick={() => setTargetSegment('inactive')}
              >
                Inactive 90+ days ({customers.filter(c => c.lastOrderDaysAgo > 90).length})
              </Button>
              <Button
                variant={targetSegment === 'high_value' ? 'default' : 'outline'}
                onClick={() => setTargetSegment('high_value')}
              >
                High Value $500+ ({customers.filter(c => c.totalSpent > 500).length})
              </Button>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-semibold">
                This promotion will be sent to {targetCustomers.length} customers
              </span>
            </div>
          </div>

          {/* Promotion Details */}
          <div className="space-y-4 mb-6">
            <div>
              <Label>Promotion Title *</Label>
              <Input
                placeholder="e.g., Spring Special Offer"
                value={promotion.title}
                onChange={(e) => setPromotion({...promotion, title: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="e.g., Enjoy a special discount on your next order!"
                value={promotion.description}
                onChange={(e) => setPromotion({...promotion, description: e.target.value})}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Discount Type</Label>
                <select
                  value={promotion.discount_type}
                  onChange={(e) => setPromotion({...promotion, discount_type: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed_amount">Fixed Amount Off</option>
                </select>
              </div>

              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  min="1"
                  value={promotion.discount_value}
                  onChange={(e) => setPromotion({...promotion, discount_value: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Valid For (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={promotion.valid_days}
                  onChange={(e) => setPromotion({...promotion, valid_days: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send_sms"
                checked={promotion.send_sms}
                onChange={(e) => setPromotion({...promotion, send_sms: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="send_sms" className="cursor-pointer">
                Send SMS notification to customers with phone numbers
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Preview:</h4>
            <div className="text-sm">
              <p className="font-bold text-slate-900">{promotion.title || "[Title]"}</p>
              <p className="text-slate-600 mb-2">{promotion.description || "[Description]"}</p>
              <Badge className="bg-emerald-600">
                {promotion.discount_type === 'percentage' 
                  ? `${promotion.discount_value}% OFF` 
                  : `$${promotion.discount_value} OFF`}
              </Badge>
              <p className="text-xs text-slate-500 mt-2">Valid for {promotion.valid_days} days</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={sending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {targetCustomers.length} Customers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}