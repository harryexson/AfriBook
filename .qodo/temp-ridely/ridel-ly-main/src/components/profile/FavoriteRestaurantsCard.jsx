import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Trash2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export default function FavoriteRestaurantsCard({ favoriteIds, isEditing, onChange }) {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, [favoriteIds]);

  const loadRestaurants = async () => {
    if (!favoriteIds || favoriteIds.length === 0) {
      setRestaurants([]);
      setIsLoading(false);
      return;
    }

    try {
      const allRestaurants = await base44.entities.Restaurant.filter({ status: 'active' });
      const favorites = allRestaurants.filter(r => favoriteIds.includes(r.id));
      setRestaurants(favorites);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = (id) => {
    onChange(favoriteIds.filter(fId => fId !== id));
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favorite Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Favorite Restaurants
        </CardTitle>
      </CardHeader>
      <CardContent>
        {restaurants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No favorite restaurants yet</p>
            <Link to={createPageUrl('FoodMenu')}>
              <Button variant="link" className="mt-2">
                Browse restaurants
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{restaurant.name}</h4>
                  <p className="text-sm text-gray-500">{restaurant.cuisine_type}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-gray-600">4.5</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`${createPageUrl('RestaurantMenu')}?id=${restaurant.id}`}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFavorite(restaurant.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}