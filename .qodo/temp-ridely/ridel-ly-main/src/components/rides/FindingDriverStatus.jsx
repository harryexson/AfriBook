import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, Navigation, Users, Zap, CheckCircle } from 'lucide-react';

export default function FindingDriverStatus({ ride, requestsCount = 0 }) {
  const [dots, setDots] = useState('');
  const [statusMessage, setStatusMessage] = useState('Finding nearby drivers');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (requestsCount === 0) {
      setStatusMessage('Finding nearby drivers');
    } else if (requestsCount === 1) {
      setStatusMessage('Sending offer to driver');
    } else {
      setStatusMessage(`Offers sent to ${requestsCount} drivers`);
    }
  }, [requestsCount]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-center gap-3 mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Navigation className="w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-bold">Finding Your Driver</h2>
            </div>
            <p className="text-center text-blue-100 text-sm">
              Please wait while we match you with a nearby driver
            </p>
          </div>

          <CardContent className="p-6">
            {/* Animated Status */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-lg font-semibold text-gray-900">
                  {statusMessage}{dots}
                </p>
              </div>
              
              {requestsCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border-2 border-green-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      Offers sent to {requestsCount} driver{requestsCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Animated Circles */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-blue-600 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <Navigation className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Searching</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Nearby</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <Zap className="w-6 h-6 text-pink-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Fast Match</p>
              </div>
            </div>

            {/* Trip Details */}
            <div className="mt-6 pt-6 border-t">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ride.pickup_location?.address || 'Current location'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ride.destination?.address || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-6">
              💡 Most rides are matched within 1-2 minutes
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}