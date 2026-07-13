import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Clock, 
  MapPin, 
  ArrowRight,
  Car
} from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800"
};

export default function RecentRidesCard({ rides }) {
  const recentRides = rides.slice(0, 3);

  return (
    <Card className="bg-white shadow-sm border-0 h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Rides
          </CardTitle>
          <Link to={createPageUrl("MyRides")}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentRides.length > 0 ? (
          recentRides.map((ride) => (
            <div key={ride.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {ride.ride_type} Ride
                  </span>
                </div>
                <Badge className={`${statusColors[ride.status]} text-xs`}>
                  {ride.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 truncate">
                    {ride.pickup_location?.address || 'Unknown pickup'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 truncate">
                    {ride.destination?.address || 'Unknown destination'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {format(new Date(ride.created_date), "MMM d, h:mm a")}
                </span>
                {ride.fare?.total_fare && (
                  <span className="text-sm font-medium text-gray-900">
                    ${ride.fare.total_fare.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No rides yet</p>
            <p className="text-gray-400 text-xs">Your ride history will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}