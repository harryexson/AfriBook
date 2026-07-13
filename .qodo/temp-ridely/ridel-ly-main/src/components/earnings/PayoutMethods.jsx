
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverEarnings as DriverEarningsEntity } from "@/entities/DriverEarnings";
import { CreditCard, Landmark, Plus, Check } from "lucide-react";
import { format } from "date-fns";

export default function PayoutMethods({ earnings, payoutRequests, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePayoutMethod = async (method) => {
    setIsUpdating(true);
    try {
      await DriverEarningsEntity.update(earnings.id, {
        payout_method: method
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating payout method:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payout Methods */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payout Methods</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Debit Card ****1234</p>
                  <p className="text-sm text-gray-500">Instant payouts available</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Default</Badge>
                <Check className="w-4 h-4 text-green-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg opacity-75">
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Bank Account ****5678</p>
                  <p className="text-sm text-gray-500">1-3 business days</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Set Default
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payout Requests */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recent Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutRequests.length > 0 ? (
            <div className="space-y-4">
              {payoutRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">
                      {request.payout_type.replace('_', ' ')} Payout
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(request.created_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${request.amount.toFixed(2)}</p>
                    <Badge className={`text-xs ${
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No payout requests yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
