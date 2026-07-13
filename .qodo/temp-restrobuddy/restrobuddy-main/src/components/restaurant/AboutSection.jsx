import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Clock, MapPin, Phone, Mail, Leaf } from "lucide-react";

export default function AboutSection({ restaurant }) {
  const getDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getCurrentStatus = () => {
    if (!restaurant.operating_hours) return "Hours not set";
    
    const now = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = dayNames[now.getDay()];
    const todayHours = restaurant.operating_hours[today];

    if (!todayHours || todayHours.closed) {
      return <Badge className="bg-red-100 text-red-700">Closed Today</Badge>;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return <Badge className="bg-green-100 text-green-700">Open Now</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700">Closed</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* About Us */}
      {restaurant.description && (
        <Card className="border-0 shadow-xl p-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-emerald-600" />
            About Us
          </h3>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
            {restaurant.description}
          </p>
          {restaurant.cuisine_type?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-600 mb-2">Cuisine:</p>
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisine_type.map(cuisine => (
                  <Badge key={cuisine} variant="outline">{cuisine}</Badge>
                ))}
              </div>
            </div>
          )}
          {restaurant.dietary_options?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-600 mb-2">Dietary Options:</p>
              <div className="flex flex-wrap gap-2">
                {restaurant.dietary_options.map(option => (
                  <Badge key={option} className="bg-green-100 text-green-700">
                    <Leaf className="w-3 h-3 mr-1" />
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Hours & Location */}
      <Card className="border-0 shadow-xl p-6">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-emerald-600" />
          Hours & Location
        </h3>

        <div className="mb-4">
          {getCurrentStatus()}
        </div>

        {restaurant.operating_hours && (
          <div className="space-y-2 mb-6">
            {Object.entries(restaurant.operating_hours).map(([day, hours]) => (
              <div key={day} className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold capitalize">{getDayName(day)}</span>
                <span className="text-slate-600">
                  {hours.closed ? (
                    <span className="text-red-600">Closed</span>
                  ) : (
                    `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {restaurant.address && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 mt-1" />
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-slate-600">
                  {restaurant.address.street}<br />
                  {restaurant.address.city}, {restaurant.address.state} {restaurant.address.zip}
                </p>
              </div>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <a href={`tel:${restaurant.phone}`} className="text-emerald-600 hover:underline">
                    {restaurant.phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}