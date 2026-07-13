import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";

export default function MenuItemCard({ item, onAddToCart, currency = "$" }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      {item.image_url && (
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
          <span className="font-bold text-emerald-600 whitespace-nowrap">
            {currency}{item.price?.toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Badge className="capitalize bg-slate-100 text-slate-700">{item.category}</Badge>
          <Button 
            size="sm"
            onClick={onAddToCart}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}