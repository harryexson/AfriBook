import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  ArrowUpCircle,
  BellRing,
  Printer,
  Tag,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import OrderMessaging from "../orders/OrderMessaging";
import OrderStatusManager from "../orders/OrderStatusManager";

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800"
};

const statusIcons = {
  todo: <Circle className="w-5 h-5 text-gray-400" />,
  in_progress: <ArrowUpCircle className="w-5 h-5 text-blue-500" />,
  done: <CheckCircle2 className="w-5 h-5 text-green-500" />
};

export default function OrderCard({ order, onUpdateStatus, onNotifyCustomer }) {
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [showMessaging, setShowMessaging] = React.useState(false);
  const [showStatusManager, setShowStatusManager] = React.useState(false);

  const statusActions = {
    pending: { label: "Confirm", nextStatus: "confirmed" },
    confirmed: { label: "Start Preparing", nextStatus: "preparing" },
    preparing: { label: "Mark Ready", nextStatus: "ready" },
    ready: { label: "Complete", nextStatus: "completed" }
  };

  const action = statusActions[order.status];

  const handleStatusChange = async (newStatus) => {
    try {
      const statusHistory = order.status_history || [];
      statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        notes: `Status changed by restaurant staff`
      });

      await base44.asServiceRole.entities.Order.update(order.id, { 
        status: newStatus,
        status_history: statusHistory
      });

      // Notify customer via comprehensive notification system
      try {
        await base44.asServiceRole.functions.invoke('notifyOrderStatus', {
          orderId: order.id,
          newStatus: newStatus,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          customerName: order.customer_name || 'Customer',
          restaurantName: order.restaurant_name || 'Restaurant',
          orderDetails: {
            delivery_type: order.delivery_type,
            items: order.items
          }
        });
      } catch (error) {
        console.log("Failed to send notification:", error);
      }

      if (onUpdateStatus) {
        await onUpdateStatus(order.id, newStatus);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  const handlePrintKitchenTicket = async () => {
    setIsPrinting(true);
    try {
      // Get saved printers
      const savedPrinters = localStorage.getItem('connectedPrinters');
      const printers = savedPrinters ? JSON.parse(savedPrinters) : [];
      const connectedPrinter = printers.find(p => p.connected);

      if (!connectedPrinter) {
        alert('No printer connected. Please go to Printer Setup to connect a printer.');
        setIsPrinting(false);
        return;
      }

      // Generate kitchen ticket
      const ticketContent = generateKitchenTicket(order);
      
      // For demo, show preview
      const printWindow = window.open('', '', 'width=300,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Kitchen Ticket</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 10px;
                width: 200px;
              }
              pre { 
                white-space: pre-wrap; 
                margin: 0;
                line-height: 1.3;
              }
              .bold { font-weight: bold; }
              .center { text-align: center; }
              .large { font-size: 16px; }
            </style>
          </head>
          <body>
            <pre>${ticketContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print. Please try again.');
    }
    setIsPrinting(false);
  };

  const generateKitchenTicket = (order) => {
    const line = '================================';
    const halfLine = '----------------';
    const time = format(new Date(order.created_date), 'HH:mm');
    const orderNum = order.id.slice(-6);
    
    let ticket = `${line}\n`;
    ticket += `   🍔 KITCHEN ORDER #${orderNum}\n`;
    ticket += `${line}\n\n`;
    ticket += `Time: ${time}\n`;
    ticket += `Customer: ${order.customer_name}\n`;
    ticket += `Phone: ${order.customer_phone || 'N/A'}\n`;
    ticket += `Type: ${order.order_type.toUpperCase()}\n\n`;
    ticket += `${halfLine}\n`;
    ticket += `ITEMS:\n`;
    ticket += `${halfLine}\n\n`;
    
    order.items.forEach((item, idx) => {
      ticket += `${idx + 1}. ${item.name} x${item.quantity}\n`;
      if (item.special_instructions) {
        ticket += `   ⚠️ ${item.special_instructions}\n`;
      }
      ticket += `\n`;
    });
    
    if (order.special_requests) {
      ticket += `${halfLine}\n`;
      ticket += `⚠️ SPECIAL REQUESTS:\n`;
      ticket += `${order.special_requests}\n`;
      ticket += `${halfLine}\n`;
    }
    
    ticket += `\n${line}\n`;
    ticket += `Status: ${order.status.toUpperCase()}\n`;
    ticket += `${line}\n`;
    
    return ticket;
  };

  const handlePrintReceipt = async () => {
    setIsPrinting(true);
    try {
      const response = await base44.functions.invoke('printReceipt', {
        order: order,
        printerType: 'pos'
      });

      if (response?.data?.success) {
        // Trigger browser print as backup
        window.print();
      } else {
        alert('Failed to send to printer. Please try again.');
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Print error. Please try again or contact support.');
    }
    setIsPrinting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-2 hover:shadow-xl transition-all duration-300 ${
        order.status === 'ready' ? 'border-green-500 bg-green-50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-900">#{order.id.slice(-6)}</span>
                <Badge className={`${
                  order.status === 'confirmed' ? 'bg-blue-500' :
                  order.status === 'preparing' ? 'bg-purple-500' :
                  order.status === 'ready' ? 'bg-green-500' :
                  order.status === 'completed' ? 'bg-slate-500' :
                  'bg-slate-500'
                } text-white border font-semibold`}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{order.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                <CalendarIcon className="w-4 h-4" />
                <span>{format(new Date(order.created_date), 'HH:mm')}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPrinting}
                    className="text-xs"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    {isPrinting ? 'Printing...' : 'Print'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handlePrintKitchenTicket}>
                    <Tag className="w-4 h-4 mr-2" />
                    Kitchen Ticket
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrintReceipt}>
                    <Printer className="w-4 h-4 mr-2" />
                    Receipt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex-1">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  {item.special_instructions && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      ⚠ Note: {item.special_instructions}
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-700 ml-2">x{item.quantity}</span>
              </div>
            ))}
          </div>
          
          {order.special_requests && (
            <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <p className="text-sm text-amber-900 font-medium">
                <strong>⚠ Special Request:</strong> {order.special_requests}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowStatusManager(true)}
                variant="outline"
                className="flex-1 border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
              >
                Update Status
              </Button>
              <Button
                onClick={() => setShowMessaging(true)}
                variant="outline"
                className="flex-1 border-2 border-purple-500 text-purple-700 hover:bg-purple-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
            
            {order.status === 'ready' && order.customer_phone && onNotifyCustomer && (
              <Button
                onClick={() => onNotifyCustomer(order)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                <BellRing className="w-5 h-5 mr-2" />
                Notify Customer
              </Button>
            )}
          </div>

          {order.status === 'completed' && (
            <div className="mt-3">
              <Button
                onClick={handlePrintReceipt}
                disabled={isPrinting}
                variant="outline"
                className="w-full border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isPrinting ? 'Printing Receipt...' : 'Print Receipt'}
              </Button>
            </div>
          )}

          {order.status === 'ready' && (
            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
              <p className="text-sm font-bold text-green-900">
                ✓ Order Ready {order.customer_phone && '- Customer will be notified'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Messaging Dialog */}
      <Dialog open={showMessaging} onOpenChange={setShowMessaging}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Communication - Order #{order.id.slice(-6)}</DialogTitle>
          </DialogHeader>
          <OrderMessaging order={order} isRestaurant={true} />
        </DialogContent>
      </Dialog>

      {/* Status Manager Dialog */}
      <Dialog open={showStatusManager} onOpenChange={setShowStatusManager}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Order Status - #{order.id.slice(-6)}</DialogTitle>
          </DialogHeader>
          <OrderStatusManager 
            order={order} 
            isRestaurant={true}
            onStatusUpdate={(newStatus) => {
              handleStatusChange(newStatus);
              setShowStatusManager(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}