import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OrderCard from '../components/kitchen/OrderCard';
import { Toaster, toast } from 'sonner';
import { Utensils, Bell } from 'lucide-react';

export default function KitchenTerminal() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [restaurant, setRestaurant] = useState(null);

    useEffect(() => {
        const setupTerminal = async () => {
            setIsLoading(true);
            try {
                // In a real app, you'd get the restaurant ID based on the logged-in kitchen user
                // For now, we'll fetch the first available restaurant to simulate.
                const restaurants = await base44.entities.Restaurant.list('-created_date', 1);
                if (restaurants.length === 0) {
                    toast.error("No restaurants found in the system.");
                    setIsLoading(false);
                    return;
                }
                const currentRestaurant = restaurants[0];
                setRestaurant(currentRestaurant);

                const initialOrders = await base44.entities.Order.filter({
                    restaurant_id: currentRestaurant.id,
                    status: { $in: ['pending_confirmation', 'confirmed', 'preparing'] }
                }, '-created_date');
                setOrders(initialOrders);

                // Setup real-time subscription for new/updated orders
                base44.entities.Order.subscribe({
                    filter: { restaurant_id: { eq: currentRestaurant.id } },
                    events: ['INSERT', 'UPDATE']
                }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        toast.info(`New order received! #${payload.new.id.slice(-4)}`);
                        setOrders(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                    }
                });

            } catch (error) {
                console.error("Error setting up kitchen terminal:", error);
                toast.error("Failed to connect to the order system.");
            } finally {
                setIsLoading(false);
            }
        };

        setupTerminal();
    }, []);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const updatedOrder = await base44.entities.Order.update(orderId, { status: newStatus });
            setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));

            // CRITICAL FIX: If restaurant confirms, dispatch a driver.
            if (newStatus === 'confirmed') {
                toast.success("Order confirmed. Finding a delivery driver...");
                await base44.functions.invoke('dispatchFoodDelivery', { orderId });
            } else {
                 toast.success(`Order status updated to ${newStatus}.`);
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update order status.");
        }
    };

    const columns = {
        pending_confirmation: orders.filter(o => o.status === 'pending_confirmation'),
        confirmed: orders.filter(o => o.status === 'confirmed'),
        preparing: orders.filter(o => o.status === 'preparing'),
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <Toaster richColors />
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <Utensils className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">{restaurant?.name || "Kitchen Terminal"}</h1>
                        <p className="text-sm text-gray-400">Live Order Feed</p>
                    </div>
                </div>
                <div className="relative">
                    <Bell className="w-6 h-6" />
                    {columns.pending_confirmation.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-xs">
                                {columns.pending_confirmation.length}
                            </span>
                        </span>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="flex items-center justify-center h-[80vh]">
                    <p>Loading Orders...</p>
                </div>
            ) : (
                <main className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-[calc(100vh-80px)] overflow-hidden">
                    {/* New Orders */}
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-full">
                        <h2 className="text-lg font-semibold mb-4 text-red-400">New Orders ({columns.pending_confirmation.length})</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {columns.pending_confirmation.map(order => (
                                <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                            ))}
                        </div>
                    </div>
                    {/* Confirmed Orders */}
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-full">
                        <h2 className="text-lg font-semibold mb-4 text-yellow-400">Preparing ({columns.confirmed.length + columns.preparing.length})</h2>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {[...columns.confirmed, ...columns.preparing].map(order => (
                                <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                            ))}
                        </div>
                    </div>
                    {/* Ready for Pickup */}
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-full">
                        <h2 className="text-lg font-semibold mb-4 text-green-400">Ready for Pickup</h2>
                         <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {/* This section would be populated by orders with status 'ready_for_pickup' */}
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}