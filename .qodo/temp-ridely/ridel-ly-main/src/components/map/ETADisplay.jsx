import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Navigation, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ETADisplay({ 
  etaMinutes, 
  distanceMiles, 
  previousEta = null,
  status = 'normal', // normal, delayed, early
  phase = 'pickup' // pickup, dropoff
}) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [etaChange, setEtaChange] = useState(0);

  useEffect(() => {
    if (previousEta !== null && etaMinutes !== previousEta) {
      const change = etaMinutes - previousEta;
      setEtaChange(change);
      setShowUpdate(true);
      
      // Hide update indicator after 3 seconds
      const timeout = setTimeout(() => setShowUpdate(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [etaMinutes, previousEta]);

  const getStatusColor = () => {
    switch (status) {
      case 'delayed':
        return 'from-orange-500 to-red-500';
      case 'early':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-blue-500 to-purple-500';
    }
  };

  const formatEta = (minutes) => {
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      className={cn(
        "relative bg-gradient-to-r text-white rounded-xl p-4 shadow-lg overflow-hidden",
        getStatusColor()
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background pulse for live tracking */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute inset-0 bg-white"
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">
              {phase === 'pickup' ? 'Driver Arriving' : 'Arriving at Destination'}
            </span>
          </div>
          
          {/* ETA Change Indicator */}
          <AnimatePresence>
            {showUpdate && etaChange !== 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  etaChange > 0 ? "bg-red-600/50" : "bg-green-600/50"
                )}
              >
                {etaChange > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    +{Math.abs(etaChange)} min
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    -{Math.abs(etaChange)} min
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-end justify-between">
          <motion.div
            key={etaMinutes}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold"
          >
            {formatEta(etaMinutes)}
          </motion.div>
          
          {distanceMiles !== null && (
            <div className="flex items-center gap-1 text-white/80">
              <Navigation className="w-4 h-4" />
              <span className="text-sm">{distanceMiles.toFixed(1)} mi</span>
            </div>
          )}
        </div>

        {status === 'delayed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Slight delay due to traffic</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}