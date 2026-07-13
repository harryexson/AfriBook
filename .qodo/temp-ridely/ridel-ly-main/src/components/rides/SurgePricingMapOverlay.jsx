import React, { useState, useEffect, useRef } from 'react';
import { Polygon, Circle, Popup } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Eye, EyeOff, Info, MapPin, RefreshCw, AlertTriangle, Activity, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// H3 polygon boundaries
const getH3Polygon = (h3Index, centerLat, centerLng) => {
  const size = 0.015; // ~1.5km radius
  const angles = [0, 60, 120, 180, 240, 300];
  
  return angles.map(angle => {
    const rad = (angle * Math.PI) / 180;
    return [
      centerLat + size * Math.sin(rad),
      centerLng + size * Math.cos(rad)
    ];
  });
};

// Surge color coding
const getSurgeColor = (multiplier) => {
  if (multiplier >= 2.5) return { 
    color: '#dc2626', 
    fillColor: '#fca5a5', 
    label: 'Very High Surge',
    pulseColor: '#ef4444'
  };
  if (multiplier >= 2.0) return { 
    color: '#ea580c', 
    fillColor: '#fed7aa', 
    label: 'High Surge',
    pulseColor: '#f97316'
  };
  if (multiplier >= 1.5) return { 
    color: '#f59e0b', 
    fillColor: '#fde68a', 
    label: 'Moderate Surge',
    pulseColor: '#fbbf24'
  };
  if (multiplier >= 1.3) return { 
    color: '#eab308', 
    fillColor: '#fef08a', 
    label: 'Low Surge',
    pulseColor: '#facc15'
  };
  return { 
    color: '#10b981', 
    fillColor: '#86efac', 
    label: 'Normal',
    pulseColor: '#34d399'
  };
};

// Demand heatmap color coding (for areas without surge)
const getDemandColor = (requestCount, supplyDemandRatio) => {
  // High demand but not yet surge
  if (supplyDemandRatio < 0.5 && requestCount >= 10) {
    return {
      color: '#f87171',
      fillColor: '#fecaca',
      opacity: 0.6,
      label: 'Very High Demand',
      intensity: 5
    };
  }
  if (supplyDemandRatio < 0.7 && requestCount >= 7) {
    return {
      color: '#fb923c',
      fillColor: '#fed7aa',
      opacity: 0.5,
      label: 'High Demand',
      intensity: 4
    };
  }
  if (supplyDemandRatio < 0.9 && requestCount >= 5) {
    return {
      color: '#fbbf24',
      fillColor: '#fef08a',
      opacity: 0.4,
      label: 'Moderate Demand',
      intensity: 3
    };
  }
  if (requestCount >= 3) {
    return {
      color: '#a3e635',
      fillColor: '#d9f99d',
      opacity: 0.35,
      label: 'Low Demand',
      intensity: 2
    };
  }
  return {
    color: '#86efac',
    fillColor: '#d1fae5',
    opacity: 0.25,
    label: 'Normal Activity',
    intensity: 1
  };
};

// Pulse animation for critical zones
const PulseMarker = ({ position, color }) => {
  const [pulseSize, setPulseSize] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseSize(prev => prev === 30 ? 50 : 30);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Circle
      center={position}
      radius={pulseSize}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 0
      }}
    />
  );
};

export default function SurgePricingMapOverlay({ userLocation, onSurgeSelect, currentPickupLocation }) {
  const [surgeZones, setSurgeZones] = useState([]);
  const [demandHeatMap, setDemandHeatMap] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [showDemandLayer, setShowDemandLayer] = useState(true);
  const [showSurgeLayer, setShowSurgeLayer] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickupSurge, setPickupSurge] = useState(null);
  const [pickupDemand, setPickupDemand] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadData();
      }
    }, 20000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  // Check current pickup location
  useEffect(() => {
    if (currentPickupLocation && (surgeZones.length > 0 || demandHeatMap.length > 0)) {
      const nearestSurge = findNearestZone(currentPickupLocation, surgeZones);
      const nearestDemand = findNearestZone(currentPickupLocation, demandHeatMap);
      
      setPickupSurge(nearestSurge);
      setPickupDemand(nearestDemand);
    } else {
      setPickupSurge(null);
      setPickupDemand(null);
    }
  }, [currentPickupLocation, surgeZones, demandHeatMap]);

  const findNearestZone = (location, zones) => {
    if (!location || !zones.length) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const zone of zones) {
      const zoneLat = zone.centerLat || zone.latitude;
      const zoneLng = zone.centerLng || zone.longitude;
      
      if (!zoneLat || !zoneLng) continue;

      const distance = Math.sqrt(
        Math.pow(zoneLat - location.latitude, 2) +
        Math.pow(zoneLng - location.longitude, 2)
      );

      if (distance < minDistance && distance < 0.02) {
        minDistance = distance;
        nearest = zone;
      }
    }

    return nearest;
  };

  const loadData = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    
    try {
      const now = new Date();
      
      // Get active surge zones
      const zones = await base44.entities.SurgePricingZone.filter({
        active_until: { $gte: now.toISOString() }
      }, '-surge_multiplier', 100);

      // Get recent demand heat map data
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const heatMap = await base44.entities.DemandHeatMap.filter({
        time_window_end: { $gte: fiveMinutesAgo.toISOString() }
      }, '-request_count', 100);

      if (isMountedRef.current) {
        setSurgeZones(zones);
        setDemandHeatMap(heatMap);
        setLastUpdate(now);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // Process zones with coordinates
  const activeSurgeZones = surgeZones.map(zone => {
    const randomOffset = () => (Math.random() - 0.5) * 0.1;
    const centerLat = userLocation ? userLocation.latitude + randomOffset() : 34.0522 + randomOffset();
    const centerLng = userLocation ? userLocation.longitude + randomOffset() : -118.2437 + randomOffset();

    return {
      ...zone,
      centerLat,
      centerLng,
      polygon: getH3Polygon(zone.h3_index, centerLat, centerLng)
    };
  });

  // Process demand zones (excluding areas with surge)
  const demandZones = demandHeatMap
    .filter(heat => !surgeZones.some(sz => sz.h3_index === heat.h3_index))
    .map(heat => {
      const randomOffset = () => (Math.random() - 0.5) * 0.1;
      const centerLat = userLocation ? userLocation.latitude + randomOffset() : 34.0522 + randomOffset();
      const centerLng = userLocation ? userLocation.longitude + randomOffset() : -118.2437 + randomOffset();

      return {
        ...heat,
        centerLat,
        centerLng,
        polygon: getH3Polygon(heat.h3_index, centerLat, centerLng)
      };
    });

  const getSurgeStats = () => {
    const total = surgeZones.length;
    const highSurge = surgeZones.filter(z => z.surge_multiplier >= 2.0).length;
    const veryHighSurge = surgeZones.filter(z => z.surge_multiplier >= 2.5).length;
    const avgMultiplier = total > 0
      ? surgeZones.reduce((sum, z) => sum + z.surge_multiplier, 0) / total
      : 1.0;

    return { total, highSurge, veryHighSurge, avgMultiplier };
  };

  const getDemandStats = () => {
    const total = demandZones.length;
    const highDemand = demandZones.filter(z => z.supply_demand_ratio < 0.7).length;
    const veryHighDemand = demandZones.filter(z => z.supply_demand_ratio < 0.5).length;

    return { total, highDemand, veryHighDemand };
  };

  const surgeStats = getSurgeStats();
  const demandStats = getDemandStats();

  if (!isVisible) {
    return (
      <div className="absolute top-4 left-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button
            onClick={() => setIsVisible(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 shadow-2xl border-2 border-orange-300"
            size="lg"
          >
            <Layers className="w-5 h-5 mr-2 text-orange-600" />
            Show Heat Map
            {(surgeStats.total + demandStats.total) > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white">
                {surgeStats.total + demandStats.total}
              </Badge>
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Surge Zone Polygons (shown when surge layer is active) */}
      {showSurgeLayer && activeSurgeZones.map((zone) => {
        const { color, fillColor, pulseColor, label } = getSurgeColor(zone.surge_multiplier);
        
        return (
          <React.Fragment key={`surge-${zone.id}`}>
            <Polygon
              positions={zone.polygon}
              pathOptions={{
                color: color,
                fillColor: fillColor,
                fillOpacity: 0.5,
                weight: 3,
                opacity: 1
              }}
              eventHandlers={{
                click: () => {
                  setSelectedZone({ ...zone, type: 'surge' });
                  if (onSurgeSelect) onSurgeSelect(zone);
                },
                mouseover: (e) => {
                  e.target.setStyle({ fillOpacity: 0.7, weight: 4 });
                },
                mouseout: (e) => {
                  e.target.setStyle({ fillOpacity: 0.5, weight: 3 });
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span className="font-bold text-xl">{zone.surge_multiplier.toFixed(1)}x SURGE</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 capitalize font-medium">
                    {zone.reason?.replace('_', ' ')}
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Ride Requests:</span>
                      <span className="font-bold text-orange-600">{zone.request_count_last_15min}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Drivers Available:</span>
                      <span className="font-bold text-green-600">{zone.available_drivers_count}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-xs text-blue-600 font-medium">
                      💰 Fares are {zone.surge_multiplier.toFixed(1)}x higher here
                    </p>
                  </div>
                </div>
              </Popup>
            </Polygon>

            {/* Pulse for very high surge */}
            {zone.surge_multiplier >= 2.5 && (
              <PulseMarker 
                position={[zone.centerLat, zone.centerLng]}
                color={pulseColor}
              />
            )}

            {/* Center marker */}
            <Circle
              center={[zone.centerLat, zone.centerLng]}
              radius={20}
              pathOptions={{
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 1,
                weight: 3
              }}
            />
          </React.Fragment>
        );
      })}

      {/* Demand Heatmap Polygons (shown when demand layer is active) */}
      {showDemandLayer && demandZones.map((zone, idx) => {
        const demandColor = getDemandColor(zone.request_count, zone.supply_demand_ratio);
        
        return (
          <Polygon
            key={`demand-${idx}`}
            positions={zone.polygon}
            pathOptions={{
              color: demandColor.color,
              fillColor: demandColor.fillColor,
              fillOpacity: demandColor.opacity,
              weight: 2,
              opacity: 0.7,
              dashArray: zone.supply_demand_ratio < 0.5 ? '5, 5' : undefined
            }}
            eventHandlers={{
              click: () => setSelectedZone({ ...zone, type: 'demand' }),
              mouseover: (e) => {
                e.target.setStyle({ fillOpacity: demandColor.opacity + 0.2, weight: 3 });
              },
              mouseout: (e) => {
                e.target.setStyle({ fillOpacity: demandColor.opacity, weight: 2 });
              }
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-lg">{demandColor.label}</span>
                </div>
                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Ride Requests:</span>
                    <span className="font-bold text-orange-600">{zone.request_count}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Available Drivers:</span>
                    <span className="font-bold text-green-600">{zone.available_drivers}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Supply Ratio:</span>
                    <span className="font-bold">{zone.supply_demand_ratio.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs text-yellow-800">
                    {zone.supply_demand_ratio < 0.5 ? (
                      <>⚡ <strong>High demand!</strong> May surge soon</>
                    ) : (
                      <>📊 Elevated activity in this area</>
                    )}
                  </p>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-3 max-w-sm">
        {/* Main Info Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="shadow-2xl bg-white/98 backdrop-blur-md border-2 border-orange-200">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Live Heat Map</h3>
                    <p className="text-xs text-gray-500">Demand & Surge Pricing</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => loadData(true)}
                    disabled={isRefreshing}
                    className="h-8 w-8"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsVisible(false)}
                    className="h-8 w-8"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Layer Toggles */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSurgeLayer(!showSurgeLayer)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                    showSurgeLayer 
                      ? 'border-orange-500 bg-orange-50 text-orange-900' 
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <Zap className="w-4 h-4 mx-auto mb-1" />
                  Surge Zones
                </button>
                <button
                  onClick={() => setShowDemandLayer(!showDemandLayer)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                    showDemandLayer 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <Activity className="w-4 h-4 mx-auto mb-1" />
                  Demand Heat
                </button>
              </div>

              {/* Current Location Info */}
              {(pickupSurge || pickupDemand) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-lg border-2 ${
                    pickupSurge 
                      ? pickupSurge.surge_multiplier >= 2.0 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-yellow-50 border-yellow-300'
                      : 'bg-blue-50 border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <p className="font-bold text-sm">Your Pickup Area</p>
                  </div>
                  
                  {pickupSurge ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-700">Current surge:</p>
                        <Badge className="bg-orange-100 text-orange-800 text-lg px-2">
                          {pickupSurge.surge_multiplier.toFixed(1)}x
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 capitalize">
                        {pickupSurge.reason?.replace('_', ' ')}
                      </p>
                    </>
                  ) : pickupDemand && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-700">Demand level:</p>
                        <Badge className="bg-blue-100 text-blue-800">
                          {getDemandColor(pickupDemand.request_count, pickupDemand.supply_demand_ratio).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {pickupDemand.request_count} requests, {pickupDemand.available_drivers} drivers
                      </p>
                    </>
                  )}
                </motion.div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg text-center border border-orange-200">
                  <p className="text-xs text-orange-600 mb-1">🔴 Surge</p>
                  <p className="text-2xl font-bold text-orange-700">{surgeStats.total}</p>
                  <p className="text-xs text-orange-500">zones</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg text-center border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">📊 Demand</p>
                  <p className="text-2xl font-bold text-blue-700">{demandStats.total}</p>
                  <p className="text-xs text-blue-500">zones</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg text-center border border-orange-200">
                  <p className="text-xs text-orange-600 mb-1">High</p>
                  <p className="text-2xl font-bold text-orange-700">{surgeStats.highSurge}</p>
                  <p className="text-xs text-orange-500">surge</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg text-center border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Hot</p>
                  <p className="text-2xl font-bold text-blue-700">{demandStats.highDemand}</p>
                  <p className="text-xs text-blue-500">demand</p>
                </div>
              </div>

              {/* Legend - Comprehensive */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Map Legend
                  </p>
                </div>

                {/* Surge Pricing Legend */}
                <div>
                  <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Surge Pricing (Solid)
                  </p>
                  {[
                    { emoji: '🔴', label: 'Very High (2.5x+)', color: '#fca5a5' },
                    { emoji: '🟠', label: 'High (2.0x)', color: '#fed7aa' },
                    { emoji: '🟡', label: 'Moderate (1.5x)', color: '#fde68a' },
                    { emoji: '🟢', label: 'Low (1.3x)', color: '#fef08a' }
                  ].map((level, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-gray-50">
                      <div 
                        className="w-6 h-4 rounded border"
                        style={{ backgroundColor: level.color, borderColor: level.color }}
                      />
                      <span className="text-gray-700">{level.label}</span>
                    </div>
                  ))}
                </div>

                {/* Demand Heatmap Legend */}
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Demand Intensity (Dashed)
                  </p>
                  {[
                    { emoji: '🔥', label: 'Very High', color: '#fecaca', intensity: '90%' },
                    { emoji: '📈', label: 'High', color: '#fed7aa', intensity: '70%' },
                    { emoji: '📊', label: 'Moderate', color: '#fef08a', intensity: '50%' },
                    { emoji: '📉', label: 'Low', color: '#d9f99d', intensity: '30%' },
                    { emoji: '✅', label: 'Normal', color: '#d1fae5', intensity: '10%' }
                  ].map((level, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-gray-50">
                      <div 
                        className="w-6 h-4 rounded border-2 border-dashed"
                        style={{ 
                          backgroundColor: level.color, 
                          borderColor: level.color.replace('ca', '99')
                        }}
                      />
                      <span className="text-gray-700">{level.label}</span>
                      <span className="text-gray-500 ml-auto text-[10px]">{level.intensity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Update */}
              {lastUpdate && (
                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <span className="text-gray-500">Last updated:</span>
                  <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Savings Tip */}
              {surgeStats.veryHighSurge > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      <strong>{surgeStats.veryHighSurge} high surge zones detected!</strong> Schedule your ride to avoid surge and save up to 60%.
                    </p>
                  </div>
                </div>
              )}

              {/* Demand Alert */}
              {demandStats.veryHighDemand > 0 && !pickupSurge && (
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      <strong>{demandStats.veryHighDemand} high-demand zones</strong> - Surge pricing may activate soon. Book now or schedule ahead.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Zone Details */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-2xl bg-white/98 backdrop-blur-md border-2 border-orange-300">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedZone.type === 'surge'
                          ? selectedZone.surge_multiplier >= 2.5 ? 'bg-red-100' :
                            selectedZone.surge_multiplier >= 2.0 ? 'bg-orange-100' : 'bg-yellow-100'
                          : selectedZone.supply_demand_ratio < 0.5 ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {selectedZone.type === 'surge' ? (
                          <Zap className="w-6 h-6 text-orange-600" />
                        ) : (
                          <Activity className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        {selectedZone.type === 'surge' ? (
                          <>
                            <Badge className="bg-orange-100 text-orange-800 text-xl px-3 py-1 font-bold">
                              {selectedZone.surge_multiplier.toFixed(1)}x
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">Surge Pricing</p>
                          </>
                        ) : (
                          <>
                            <Badge className="bg-blue-100 text-blue-800 text-base px-3 py-1 font-bold">
                              {getDemandColor(selectedZone.request_count, selectedZone.supply_demand_ratio).label}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">Demand Heat</p>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedZone(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedZone.type === 'surge' ? (
                    <>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          Reason: {selectedZone.reason?.replace('_', ' ')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">📊 Requests (15min):</span>
                          <span className="font-bold text-orange-600">{selectedZone.request_count_last_15min}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">🚗 Drivers:</span>
                          <span className="font-bold text-green-600">{selectedZone.available_drivers_count}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">⚡ Intensity:</span>
                          <span className="font-bold">
                            {selectedZone.available_drivers_count > 0
                              ? `${(selectedZone.request_count_last_15min / selectedZone.available_drivers_count).toFixed(1)} : 1`
                              : 'Very High'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                        <p className="text-xs text-blue-900 font-medium mb-2">💡 Money Saving Tips:</p>
                        <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                          <li>Wait 10-15 minutes for surge to drop</li>
                          <li>Move to nearby lower-surge area</li>
                          <li>Schedule ride for fixed pricing</li>
                          {selectedZone.surge_multiplier >= 2.0 && (
                            <li className="font-bold">Save up to 60% by scheduling!</li>
                          )}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">📊 Requests:</span>
                          <span className="font-bold text-blue-600">{selectedZone.request_count}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">🚗 Drivers:</span>
                          <span className="font-bold text-green-600">{selectedZone.available_drivers}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">📈 Supply Ratio:</span>
                          <span className="font-bold">{selectedZone.supply_demand_ratio.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className={`border-2 rounded-lg p-3 ${
                        selectedZone.supply_demand_ratio < 0.5 
                          ? 'bg-yellow-50 border-yellow-300' 
                          : 'bg-blue-50 border-blue-300'
                      }`}>
                        <p className="text-xs font-medium mb-1">
                          {selectedZone.supply_demand_ratio < 0.5 ? '⚡ Warning' : 'ℹ️ Info'}
                        </p>
                        <p className="text-xs">
                          {selectedZone.supply_demand_ratio < 0.5 ? (
                            <>This area may surge soon due to high demand and low driver supply. Consider booking now or scheduling ahead to lock in current pricing.</>
                          ) : (
                            <>Elevated activity detected. Demand is higher than usual but prices remain normal.</>
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedZone.active_until && new Date(selectedZone.active_until) > new Date() && (
                    <div className="text-center pt-2 border-t">
                      <p className="text-xs text-gray-600">
                        Active until {new Date(selectedZone.active_until).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}