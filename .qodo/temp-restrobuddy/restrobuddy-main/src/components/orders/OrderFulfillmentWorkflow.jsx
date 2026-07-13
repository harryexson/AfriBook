import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Clock, Printer, Send, AlertCircle, ChefHat 
} from "lucide-react";

const statusFlow = [
  { status: 'pending', label: 'Received', icon: Clock, color: 'text-slate-500' },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-500' },
  { status: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-orange-500' },
  { status: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-500' },
  { status: 'delivered', label: 'Delivered', icon: Send, color: 'text-emerald-600' }
];

export default function OrderFulfillmentWorkflow({ 
  order, 
  onStatusChange, 
  onPrint,
  isUpdating = false 
}) {
  const [showNotes, setShowNotes] = useState(false);
  const currentStatusIndex = statusFlow.findIndex(s => s.status === order.status);

  const handleStatusTransition = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  const getPrinterLabel = () => {
    if (order.status === 'pending' || order.status === 'confirmed') {
      return 'Print Kitchen Ticket';
    }
    return 'Reprint Ticket';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-emerald-600" />
          Order Fulfillment Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Timeline */}
        <div className="space-y-4">
          {statusFlow.map((step, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isCurrent = step.status === order.status;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {idx < statusFlow.length - 1 && (
                    <div 
                      className={`w-1 h-8 mt-2 ${
                        isCompleted ? 'bg-emerald-200' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                        {step.label}
                      </p>
                      {order.status_history && (
                        <p className="text-xs text-slate-500">
                          {order.status_history.find(h => h.status === step.status)?.timestamp 
                            ? new Date(order.status_history.find(h => h.status === step.status).timestamp).toLocaleTimeString()
                            : '-'
                          }
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <Badge className="bg-emerald-600">Current</Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {isCurrent && idx < statusFlow.length - 1 && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusTransition(statusFlow[idx + 1].status)}
                    disabled={isUpdating}
                    className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap ml-2"
                  >
                    {isUpdating ? 'Updating...' : `Mark ${statusFlow[idx + 1].label}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <Button
              onClick={onPrint}
              className="w-full gap-2"
              variant="outline"
            >
              <Printer className="w-4 h-4" />
              {getPrinterLabel()}
            </Button>
          )}

          {order.delivery_type === 'delivery' && order.status === 'ready' && (
            <Button
              onClick={() => handleStatusTransition('out_for_delivery')}
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send className="w-4 h-4" />
              {isUpdating ? 'Updating...' : 'Assign Driver & Send Out'}
            </Button>
          )}

          {(order.status === 'preparing' || order.status === 'ready') && (
            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant="outline"
              className="w-full"
            >
              Add/View Notes
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-xs text-slate-600">Prep Time</p>
            <p className="font-bold text-blue-600">
              {order.estimated_ready_time 
                ? Math.round((new Date(order.estimated_ready_time) - new Date()) / 60000) 
                : '?'} min
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <p className="text-xs text-slate-600">Items</p>
            <p className="font-bold text-orange-600">{order.items?.length || 0}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-center">
            <p className="text-xs text-slate-600">Total</p>
            <p className="font-bold text-emerald-600">${order.total_amount?.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}