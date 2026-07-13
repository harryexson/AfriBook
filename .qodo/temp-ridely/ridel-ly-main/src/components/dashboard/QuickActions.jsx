import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MapPin, 
  Clock, 
  Star,
  Car,
  Plus,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

const quickActionItems = [
  {
    title: "Book a Ride",
    description: "Get a ride to your destination",
    icon: Plus,
    color: "blue",
    link: "BookRide"
  },
  {
    title: "Scheduled Rides",
    description: "Plan rides for later",
    icon: Clock,
    color: "purple",
    link: "BookRide"
  },
  {
    title: "Favorite Places",
    description: "Quick access to saved locations",
    icon: Star,
    color: "yellow",
    link: "Profile"
  }
];

export default function QuickActions() {
  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          Quick Actions
        </CardTitle>
        <p className="text-gray-500 text-sm">Get started with your next ride</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActionItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={createPageUrl(item.link)}>
              <Button
                variant="ghost"
                className="w-full h-auto p-4 justify-start hover:bg-gray-50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${
                    item.color === 'blue' ? 'bg-blue-100' :
                    item.color === 'purple' ? 'bg-purple-100' :
                    'bg-yellow-100'
                  }`}>
                    <item.icon className={`w-5 h-5 ${
                      item.color === 'blue' ? 'text-blue-600' :
                      item.color === 'purple' ? 'text-purple-600' :
                      'text-yellow-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </Button>
            </Link>
          </motion.div>
        ))}

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">No active rides</p>
              <p className="text-sm text-gray-600">Book a ride to get started</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}