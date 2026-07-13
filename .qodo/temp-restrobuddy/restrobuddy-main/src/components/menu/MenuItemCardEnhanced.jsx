import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Leaf, Flame } from "lucide-react";

export default function MenuItemCardEnhanced({ item, onAddToCart }) {
  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-all">
      {/* Image */}
      {item.image_url && (
        <div className="relative w-full h-48 bg-slate-200 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
          {item.available === false && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold">Unavailable</span>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4">
        {/* Name and Category */}
        <div className="mb-2">
          <h3 className="font-bold text-slate-900">{item.name}</h3>
          <p className="text-xs text-slate-500">{item.category}</p>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {item.is_vegetarian && (
            <Badge variant="outline" className="text-xs gap-1 bg-green-50">
              <Leaf className="w-3 h-3" />
              Vegetarian
            </Badge>
          )}
          {item.is_vegan && (
            <Badge variant="outline" className="text-xs gap-1 bg-green-50">
              <Leaf className="w-3 h-3" />
              Vegan
            </Badge>
          )}
          {item.is_spicy && (
            <Badge variant="outline" className="text-xs gap-1 bg-orange-50">
              <Flame className="w-3 h-3" />
              Spicy
            </Badge>
          )}
        </div>

        {/* Price and Prep Time */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-600">
            ${item.price?.toFixed(2)}
          </span>
          {item.preparation_time && (
            <span className="text-xs text-slate-500">
              ⏱️ {item.preparation_time}min
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onAddToCart(item)}
          disabled={item.available === false}
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}