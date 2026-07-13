import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SurgePricingBanner({ surgeMultiplier, reason, estimatedFare }) {
  if (!surgeMultiplier || surgeMultiplier <= 1.0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Normal pricing</strong> - No surge in your area right now
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  const getSurgeLevel = (multiplier) => {
    if (multiplier >= 2.5) return { 
      level: 'Very High', 
      color: 'from-red-500 to-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-800',
      icon: AlertTriangle 
    };
    if (multiplier >= 2.0) return { 
      level: 'High', 
      color: 'from-orange-500 to-red-500', 
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-800',
      icon: TrendingUp 
    };
    if (multiplier >= 1.5) return { 
      level: 'Moderate', 
      color: 'from-yellow-500 to-orange-500', 
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800',
      icon: Zap 
    };
    return { 
      level: 'Low', 
      color: 'from-yellow-400 to-yellow-500', 
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      icon: Zap 
    };
  };

  const surgeLevel = getSurgeLevel(surgeMultiplier);
  const SurgeIcon = surgeLevel.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-4"
    >
      <Card className={`${surgeLevel.bgColor} border-2 ${surgeLevel.borderColor} overflow-hidden`}>
        <CardContent className="p-0">
          {/* Animated gradient header */}
          <div className={`bg-gradient-to-r ${surgeLevel.color} p-4 text-white relative overflow-hidden`}>
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <SurgeIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{surgeLevel.level} Surge Pricing</h3>
                <p className="text-sm opacity-90">{surgeMultiplier.toFixed(1)}x higher than normal</p>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 text-lg px-3 py-1">
                {surgeMultiplier.toFixed(1)}x
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {reason && (
              <div className={`flex items-start gap-2 ${surgeLevel.textColor}`}>
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium capitalize">
                  {reason.replace('_', ' ')}
                </p>
              </div>
            )}

            {estimatedFare && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Your estimated fare:</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ${estimatedFare.toFixed(2)}
                  </p>
                  {surgeMultiplier > 1.0 && (
                    <p className="text-xs text-gray-500">
                      Base: ${(estimatedFare / surgeMultiplier).toFixed(2)} + Surge
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className={`${surgeLevel.bgColor} border ${surgeLevel.borderColor} rounded-lg p-3`}>
              <p className={`text-xs ${surgeLevel.textColor}`}>
                💡 <strong>Save money:</strong> Fares may drop soon. Consider waiting a few minutes or choosing a nearby pickup point outside the surge zone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}