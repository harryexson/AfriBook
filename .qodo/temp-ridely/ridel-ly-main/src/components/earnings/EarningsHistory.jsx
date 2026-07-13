import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, DollarSign } from "lucide-react";

export default function EarningsHistory({ payments }) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    payment.payment_type === 'ride_payment' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {payment.payment_type === 'ride_payment' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {payment.payment_type === 'ride_payment' ? 'Ride Earnings' : 
                       payment.payment_type === 'driver_payout' ? 'Payout' :
                       payment.payment_type === 'instant_payout' ? 'Instant Payout' :
                       'Platform Fee'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(payment.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    payment.payment_type === 'ride_payment' ? 'text-green-600' : 
                    payment.payment_type.includes('payout') ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {payment.payment_type === 'ride_payment' ? '+' : '-'}${payment.amount.toFixed(2)}
                  </p>
                  <Badge className={`text-xs ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-gray-400 text-sm">Complete rides to start earning</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}