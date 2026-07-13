
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, Pizza, Salad, Beef, Fish } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LandingHeader from "../components/landing/LandingHeader";
import LandingFooter from "../components/landing/LandingFooter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const cuisineFilters = [
    { name: 'All', icon: null },
    { name: 'Pizza', icon: Pizza },
    { name: 'Burgers', icon: Beef },
    { name: 'Japanese', icon: Fish },
    { name: 'Salads', icon: Salad },
];

const RestaurantCard = ({ restaurant, large = false, isPrimeMember = false }) => (
    <Link to={createPageUrl(`RestaurantMenu?id=${restaurant.id}`)} className="group block">
        <motion.div whileHover={{ y: -5 }} className="h-full">
            <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl border-0">
                <CardContent className="p-0">
                    <img 
                        src={restaurant.logo_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
                        alt={restaurant.name}
                        className={cn("w-full object-cover", large ? "h-56" : "h-40")}
                    />
                    <div className="p-4">
                        <h3 className="font-bold text-lg text-brand-dark truncate">{restaurant.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{restaurant.cuisine_type}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                             <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500"/> 4.5</span>
                             <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 25-35 min</span>
                             {isPrimeMember ? (
                                <span className="font-bold text-purple-600 flex items-center gap-1"><Star className="w-3 h-3" /> $0 Fee</span>
                             ) : (
                                <span className="font-medium">$1.99 Fee</span>
                             )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    </Link>
);

const SkeletonCard = ({ large = false }) => (
    <Card className={cn("overflow-hidden border-0", large && "w-80 flex-shrink-0")}>
        <div className={cn("bg-gray-200 animate-pulse", large ? "h-56" : "h-40")}></div>
        <div className="p-4">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>
    </Card>
);


export default function FoodMenu() {
    const [restaurants, setRestaurants] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCuisine, setSelectedCuisine] = useState("All");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [allRestaurants, currentUser] = await Promise.all([
                    base44.entities.Restaurant.list(),
                    base44.auth.me().catch(() => null) // Catch error if not logged in
                ]);
                setRestaurants(allRestaurants.filter(r => r.status === 'active'));
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
            setIsLoading(false);
        };
        fetchInitialData();
    }, []);

    const filteredRestaurants = restaurants.filter(r =>
        (selectedCuisine === "All" || r.cuisine_type.toLowerCase().includes(selectedCuisine.toLowerCase())) &&
        (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const featuredRestaurants = restaurants.slice(0, 5);

    return (
        <div className="bg-white min-h-screen">
            <LandingHeader />
            <main>
                <div className="relative bg-gray-800 overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.pexels.com/photos/323682/pexels-photo-323682.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')"}}>
                     <div className="absolute inset-0 bg-black/60"></div>
                     <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter">Cravings, delivered.</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-200">Your favorite local restaurants, brought right to you.</p>
                        <div className="relative mt-8 max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input 
                                placeholder="What are you craving?"
                                className="pl-12 h-14 text-lg rounded-full shadow-md border-transparent focus:ring-2 focus:ring-brand-dark"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Cuisine Filters */}
                    <div className="mb-12">
                        <div className="flex space-x-4 overflow-x-auto pb-4">
                            {cuisineFilters.map(filter => (
                                <button 
                                    key={filter.name} 
                                    onClick={() => setSelectedCuisine(filter.name)}
                                    className={cn(
                                        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                                        selectedCuisine === filter.name ? "bg-brand-dark text-white" : "bg-gray-100 hover:bg-gray-200"
                                    )}
                                >
                                    {filter.icon && <filter.icon className="w-4 h-4"/>}
                                    {filter.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Featured Section */}
                     <div className="mb-16">
                        <h2 className="text-2xl font-bold text-brand-dark mb-6">Featured Restaurants</h2>
                         <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => <SkeletonCard key={i} large={true} />)
                            ) : (
                                featuredRestaurants.map(r => <div key={r.id} className="w-80 flex-shrink-0"><RestaurantCard restaurant={r} large={true} isPrimeMember={user?.is_prime_member}/></div>)
                            )}
                        </div>
                    </div>

                    {/* All Restaurants */}
                    <div>
                         <h2 className="text-2xl font-bold text-brand-dark mb-6">All Restaurants</h2>
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : (
                             <>
                                {filteredRestaurants.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredRestaurants.map(r => <RestaurantCard key={r.id} restaurant={r} isPrimeMember={user?.is_prime_member}/>)}
                                    </div>
                                ) : (
                                    <div className="text-center col-span-full py-16">
                                        <h2 className="text-xl font-semibold">No Restaurants Found</h2>
                                        <p className="text-gray-500 mt-2">Try adjusting your search or filters!</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
}
