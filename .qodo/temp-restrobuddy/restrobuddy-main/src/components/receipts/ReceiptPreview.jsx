import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceiptPreview({ order }) {
  if (!order) return null;

  const subtotal = order.total_amount;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="flex justify-center">
      {/* 80mm thermal printer width - approximately 302px at 96 DPI */}
      <Card className="w-[302px] bg-white shadow-lg font-mono text-[10px] leading-tight print:shadow-none">
        <CardContent className="p-3">
          {/* Header */}
          <div className="text-center border-b border-black pb-2 mb-2">
            <div className="mb-1">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                alt="RESTROBUDDY"
                className="w-12 h-12 mx-auto mb-1"
              />
            </div>
            <div className="text-sm font-bold">RESTROBUDDY</div>
            <div className="text-[9px] mt-1">Thank You for Your Order!</div>
          </div>

          {/* Order Info */}
          <div className="mb-2 text-[9px] space-y-0">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span className="font-bold">{order.id.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(order.created_date).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{order.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="uppercase">{order.order_type}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Items */}
          <div className="mb-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="mb-1">
                <div className="flex justify-between items-start text-[10px]">
                  <span className="flex-1 pr-1">{item.name}</span>
                  <span className="whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="text-[9px] ml-1">
                  {item.quantity} x ${item.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {order.special_requests && (
            <>
              <div className="border-t border-dashed border-black my-2"></div>
              <div className="mb-2 text-[9px]">
                <div className="font-bold mb-0.5">Special Requests:</div>
                <div className="break-words">{order.special_requests}</div>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-black my-2"></div>

          {/* Totals */}
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-black my-1"></div>
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-black my-2"></div>

          {/* Payment Status */}
          <div className="text-center font-bold mb-2 text-[11px]">
            {order.payment_status === 'completed' ? (
              <div>*** PAID ***</div>
            ) : (
              <div>*** PAY AT COUNTER ***</div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[9px] border-t border-black pt-2">
            <div className="font-semibold mb-0.5">We appreciate your business!</div>
            <div>Visit us again soon!</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}