import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FareEstimateCard({ fareEstimate, surgeMultiplier = 1.0 }) {
  if (!fareEstimate) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-24">
            <p className="text-gray-500">Calculating fare...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSurge = surgeMultiplier > 1.0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`shadow-lg ${isSurge ? 'border-2 border-orange-400' : 'border-gray-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Estimated Fare</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${fareEstimate.total_fare?.toFixed(2) || '0.00'}
                </span>
                {isSurge && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    {surgeMultiplier.toFixed(1)}x Surge
                  </Badge>
                )}
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Distance
              </span>
              <span className="font-medium text-gray-900">
                {fareEstimate.estimated_distance_miles 
                  ? `${fareEstimate.estimated_distance_miles.toFixed(1)} mi` 
                  : fareEstimate.estimated_distance_km 
                    ? `${fareEstimate.estimated_distance_km.toFixed(1)} km`
                    : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </span>
              <span className="font-medium text-gray-900">
                {fareEstimate.estimated_duration_minutes 
                  ? `${fareEstimate.estimated_duration_minutes} min` 
                  : 'N/A'}
              </span>
            </div>

            {fareEstimate.base_fare && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Base fare</span>
                <span className="text-gray-900">${fareEstimate.base_fare.toFixed(2)}</span>
              </div>
            )}

            {fareEstimate.distance_fare && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Distance fare</span>
                <span className="text-gray-900">${fareEstimate.distance_fare.toFixed(2)}</span>
              </div>
            )}

            {fareEstimate.time_fare && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Time fare</span>
                <span className="text-gray-900">${fareEstimate.time_fare.toFixed(2)}</span>
              </div>
            )}

            {isSurge && fareEstimate.subtotal_before_surge && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Surge pricing</span>
                <span className="text-orange-600 font-semibold">
                  +${(fareEstimate.total_fare - fareEstimate.subtotal_before_surge).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {isSurge && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">High demand area</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Prices are higher than usual due to increased demand.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}