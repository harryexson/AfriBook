import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Check, Utensils, ThumbsDown } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export default function OrderCard({ order, onUpdateStatus }) {
    const timeAgo = formatDistanceToNow(new Date(order.created_date), { addSuffix: true });
    
    return (
        <Card className="shadow-md border border-gray-200">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg">Order #{order.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><User className="w-3 h-3"/> Customer ID: ...{order.customer_id.slice(-4)}</p>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {timeAgo}</p>
                </div>

                <Separator className="my-3"/>

                <ul className="space-y-2 mb-4">
                    {order.order_items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{item.quantity}x {item.name}</span>
                            <span className="text-gray-700">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>

                {order.customer_notes && (
                    <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm mb-4">
                        <strong>Notes:</strong> {order.customer_notes}
                    </div>
                )}
                
                <Separator className="my-3"/>

                <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>${order.order_total.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-col gap-2">
                    {order.status === 'pending_confirmation' && (
                        <div className="flex gap-2">
                            <Button className="flex-1 bg-red-600 hover:bg-red-700" size="sm" onClick={() => onUpdateStatus(order.id, 'cancelled')}>
                                <ThumbsDown className="w-4 h-4 mr-2"/> Reject
                            </Button>
                            <Button className="flex-1" size="sm" onClick={() => onUpdateStatus(order.id, 'confirmed')}>
                                <Check className="w-4 h-4 mr-2"/> Accept
                            </Button>
                        </div>
                    )}
                    {order.status === 'confirmed' && (
                         <Button className="w-full" onClick={() => onUpdateStatus(order.id, 'preparing')}>
                            <Utensils className="w-4 h-4 mr-2"/> Start Preparing
                        </Button>
                    )}
                     {order.status === 'preparing' && (
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(order.id, 'ready_for_pickup', { ready_at: new Date().toISOString() })}>
                           <Check className="w-4 h-4 mr-2"/> Mark as Ready for Pickup
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}