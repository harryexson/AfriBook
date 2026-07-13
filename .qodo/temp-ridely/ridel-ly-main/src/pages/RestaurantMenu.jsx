
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Clock, ShoppingCart, PlusCircle } from 'lucide-react';
import LandingHeader from '../components/landing/LandingHeader';
import LandingFooter from '../components/landing/LandingFooter';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

const MenuItemCard = ({ item, onAddToCart }) => (
    <Card className="flex flex-col md:flex-row items-start gap-4 p-4 transition-shadow hover:shadow-lg border-0 border-b rounded-none">
        <div className="flex-1">
            <h4 className="font-bold text-gray-900">{item.name}</h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
            <p className="font-semibold text-brand-dark mt-3">${item.price.toFixed(2)}</p>
        </div>
        <div className="relative w-full md:w-32 h-32 flex-shrink-0">
             {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
                 <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400"/>
                </div>
            )}
            <Button size="icon" className="absolute -bottom-2 -right-2 bg-white text-brand-dark hover:bg-gray-100 rounded-full w-9 h-9 shadow-md" onClick={() => onAddToCart(item)}>
                <PlusCircle className="w-6 h-6"/>
            </Button>
        </div>
    </Card>
);

export default function RestaurantMenu() {
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRestaurantData = async () => {
            const params = new URLSearchParams(location.search);
            const id = params.get('id');
            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                const restData = await base44.entities.Restaurant.get(id);
                setRestaurant(restData);
                const items = await base44.entities.MenuItem.filter({ restaurant_id: id }, "-created_date");
                setMenuItems(items);
            } catch (error) {
                console.error("Failed to fetch restaurant data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurantData();
    }, [location.search]);

    const handleAddToCart = (item) => {
        const prefillMessage = `I'd like to order a ${item.name} from ${restaurant.name}.`;
        const url = createPageUrl(`TextToOrder?prefill=${encodeURIComponent(prefillMessage)}`);
        navigate(url);
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!restaurant) {
        return <div className="min-h-screen flex items-center justify-center">Restaurant not found.</div>;
    }

    // Group items by category
    const menuByCategory = menuItems.reduce((acc, item) => {
        const category = item.category || 'Other';
        (acc[category] = acc[category] || []).push(item);
        return acc;
    }, {});

    return (
        <div className="bg-white min-h-screen">
            <LandingHeader />
            <main>
                {/* Header Section */}
                <div className="h-56 md:h-72 relative">
                    <img 
                        src={restaurant.logo_url || "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"} 
                        alt={`${restaurant.name} interior`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
                    <Card className="p-6 md:p-8 shadow-2xl">
                         <h1 className="text-4xl md:text-5xl font-bold text-brand-dark font-heading">{restaurant.name}</h1>
                        <p className="text-lg text-gray-600 mt-2 capitalize">{restaurant.cuisine_type}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 mt-3">
                            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-500"/> 4.5 (200+ ratings)</span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> 20-30 min</span>
                             <span className="hidden md:inline">•</span>
                            <span>{restaurant.address.street}, {restaurant.address.city}</span>
                        </div>
                    </Card>
                </div>


                {/* Menu Section */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex justify-between items-center mb-8">
                         <h2 className="text-3xl font-bold text-brand-dark">Menu</h2>
                         <Button className="rounded-full bg-brand-dark hover:bg-gray-800 shadow-lg fixed bottom-6 right-6 lg:static z-50 h-14 px-6" onClick={() => navigate(createPageUrl('TextToOrder'))}>
                             <ShoppingCart className="w-5 h-5 mr-2"/>
                             <span>View Cart / Order</span>
                         </Button>
                    </div>
                   
                    {Object.keys(menuByCategory).length > 0 ? (
                        <div className="space-y-12">
                            {Object.entries(menuByCategory).map(([category, items]) => (
                                <div key={category}>
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">{category}</h3>
                                    <div className="flex flex-col">
                                        {items.map(item => <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold text-gray-800">Menu Coming Soon</h3>
                            <p className="text-gray-500 mt-2">This restaurant hasn't added their menu items yet. Please check back later!</p>
                        </div>
                    )}
                </div>
            </main>
            <LandingFooter />
        </div>
    );
}
