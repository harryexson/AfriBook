import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  CircleDot,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertCircle,
  Zap,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Direction icons based on maneuver type
const getDirectionIcon = (maneuver) => {
  const iconMap = {
    'turn-left': ArrowLeft,
    'turn-right': ArrowRight,
    'turn-slight-left': CornerUpLeft,
    'turn-slight-right': CornerUpRight,
    'turn-sharp-left': ArrowLeft,
    'turn-sharp-right': ArrowRight,
    'uturn-left': RotateCcw,
    'uturn-right': RotateCcw,
    'straight': ArrowUp,
    'merge': ArrowUp,
    'ramp-left': CornerUpLeft,
    'ramp-right': CornerUpRight,
    'fork-left': CornerUpLeft,
    'fork-right': CornerUpRight,
    'roundabout': RotateCcw,
    'arrive': CircleDot,
    'depart': Navigation
  };
  return iconMap[maneuver] || ArrowUp;
};

// Traffic color coding
const getTrafficColor = (level) => {
  switch (level) {
    case 'heavy': return 'bg-red-500 text-white';
    case 'moderate': return 'bg-yellow-500 text-black';
    case 'light': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getTrafficText = (level) => {
  switch (level) {
    case 'heavy': return 'Heavy Traffic';
    case 'moderate': return 'Moderate Traffic';
    case 'light': return 'Light Traffic';
    default: return 'Normal';
  }
};

export default function TurnByTurnNavigation({
  routeData,
  currentLocation,
  destination,
  destinationName,
  phase,
  eta,
  distance,
  onRecalculate,
  isExpanded = true,
  onToggleExpand
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [lastAnnouncedStep, setLastAnnouncedStep] = useState(-1);

  // Extract instructions from route data
  const instructions = useMemo(() => {
    if (!routeData?.instructions) {
      // Generate basic instructions if none provided
      return [{
        maneuver: phase === 'pickup' ? 'depart' : 'arrive',
        text: phase === 'pickup' ? 'Head to pickup location' : 'Head to destination',
        distance: distance ? `${distance.toFixed(1)} mi` : 'Calculating...',
        duration: eta ? `${eta} min` : 'Calculating...',
        traffic_level: 'light'
      }];
    }
    return routeData.instructions;
  }, [routeData, phase, distance, eta]);

  // Find current step based on location
  useEffect(() => {
    if (!currentLocation || !routeData?.waypoints || routeData.waypoints.length === 0) return;

    // Find the closest waypoint to current location
    let minDistance = Infinity;
    let closestIndex = 0;

    routeData.waypoints.forEach((wp, idx) => {
      const dist = Math.sqrt(
        Math.pow(wp.lat - currentLocation.lat, 2) + 
        Math.pow(wp.lng - currentLocation.lng, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    // Map waypoint index to instruction index
    const stepIndex = Math.min(
      Math.floor(closestIndex / Math.max(1, Math.floor(routeData.waypoints.length / instructions.length))),
      instructions.length - 1
    );

    if (stepIndex !== currentStepIndex) {
      setCurrentStepIndex(stepIndex);
      
      // Voice announcement
      if (voiceEnabled && stepIndex !== lastAnnouncedStep && instructions[stepIndex]) {
        announceStep(instructions[stepIndex]);
        setLastAnnouncedStep(stepIndex);
      }
    }
  }, [currentLocation, routeData, instructions, voiceEnabled, lastAnnouncedStep]);

  // Text-to-speech for turn announcements
  const announceStep = (step) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(step.text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentStep = instructions[currentStepIndex] || instructions[0];
  const nextStep = instructions[currentStepIndex + 1];
  const DirectionIcon = getDirectionIcon(currentStep?.maneuver);

  // Calculate overall traffic condition
  const overallTraffic = useMemo(() => {
    if (!instructions || instructions.length === 0) return 'light';
    
    const trafficCounts = instructions.reduce((acc, inst) => {
      acc[inst.traffic_level || 'light'] = (acc[inst.traffic_level || 'light'] || 0) + 1;
      return acc;
    }, {});

    if (trafficCounts.heavy > instructions.length * 0.3) return 'heavy';
    if (trafficCounts.moderate > instructions.length * 0.4) return 'moderate';
    return 'light';
  }, [instructions]);

  if (!isExpanded) {
    // Compact mode - just show ETA and next turn
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-600 text-white rounded-xl shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onToggleExpand}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <DirectionIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">{eta || '--'} min</p>
              <p className="text-xs opacity-80">{distance?.toFixed(1) || '--'} mi remaining</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
    >
      {/* Header with ETA and Traffic */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Navigation className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-bold">{eta || '--'} min</p>
              <p className="text-sm opacity-90">{distance?.toFixed(1) || '--'} mi • {phase === 'pickup' ? 'To Pickup' : 'To Destination'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("text-xs", getTrafficColor(overallTraffic))}>
              {getTrafficText(overallTraffic)}
            </Badge>
            <div className="flex gap-1">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggleExpand}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Destination */}
        <div className="flex items-center gap-2 text-sm opacity-90 truncate">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{destinationName || 'Destination'}</span>
        </div>
      </div>

      {/* Current Turn Instruction */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center",
            currentStep?.traffic_level === 'heavy' ? 'bg-red-100' : 
            currentStep?.traffic_level === 'moderate' ? 'bg-yellow-100' : 'bg-blue-100'
          )}>
            <DirectionIcon className={cn(
              "w-10 h-10",
              currentStep?.traffic_level === 'heavy' ? 'text-red-600' : 
              currentStep?.traffic_level === 'moderate' ? 'text-yellow-600' : 'text-blue-600'
            )} />
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-900">{currentStep?.text || 'Continue on route'}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span>{currentStep?.distance || '--'}</span>
              <span>•</span>
              <span>{currentStep?.duration || '--'}</span>
              {currentStep?.traffic_level && currentStep.traffic_level !== 'light' && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className={cn("text-xs", 
                    currentStep.traffic_level === 'heavy' ? 'border-red-400 text-red-600' : 'border-yellow-400 text-yellow-600'
                  )}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {currentStep.traffic_level === 'heavy' ? 'Slow' : 'Moderate'}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Turn Preview */}
      {nextStep && (
        <div className="p-3 bg-gray-100 border-b flex items-center gap-3">
          <div className="text-xs text-gray-500 font-medium">THEN</div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
            {React.createElement(getDirectionIcon(nextStep.maneuver), { className: "w-5 h-5 text-gray-600" })}
          </div>
          <p className="text-sm text-gray-700 truncate flex-1">{nextStep.text}</p>
          <span className="text-xs text-gray-500">{nextStep.distance}</span>
        </div>
      )}

      {/* Traffic Alerts */}
      {overallTraffic !== 'light' && (
        <div className={cn(
          "p-3 flex items-center gap-3",
          overallTraffic === 'heavy' ? 'bg-red-50' : 'bg-yellow-50'
        )}>
          <AlertCircle className={cn(
            "w-5 h-5",
            overallTraffic === 'heavy' ? 'text-red-500' : 'text-yellow-500'
          )} />
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              overallTraffic === 'heavy' ? 'text-red-800' : 'text-yellow-800'
            )}>
              {overallTraffic === 'heavy' 
                ? 'Heavy traffic ahead - expect delays' 
                : 'Moderate traffic on route'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRecalculate}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reroute
          </Button>
        </div>
      )}

      {/* All Steps Toggle */}
      <button
        onClick={() => setShowAllSteps(!showAllSteps)}
        className="w-full p-3 text-sm text-blue-600 font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
      >
        {showAllSteps ? (
          <>Hide directions <ChevronUp className="w-4 h-4" /></>
        ) : (
          <>Show all directions ({instructions.length} steps) <ChevronDown className="w-4 h-4" /></>
        )}
      </button>

      {/* All Steps List */}
      <AnimatePresence>
        {showAllSteps && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
          >
            <div className="max-h-64 overflow-y-auto">
              {instructions.map((step, idx) => {
                const StepIcon = getDirectionIcon(step.maneuver);
                const isCurrentStep = idx === currentStepIndex;
                const isPastStep = idx < currentStepIndex;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 flex items-center gap-3 border-b last:border-b-0",
                      isCurrentStep ? 'bg-blue-50' : isPastStep ? 'bg-gray-50 opacity-50' : ''
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isCurrentStep ? 'bg-blue-600 text-white' : 
                      isPastStep ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-600'
                    )}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        isCurrentStep ? 'font-semibold text-blue-900' : 'text-gray-700'
                      )}>
                        {step.text}
                      </p>
                      <p className="text-xs text-gray-500">{step.distance} • {step.duration}</p>
                    </div>
                    {step.traffic_level && step.traffic_level !== 'light' && (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        step.traffic_level === 'heavy' ? 'bg-red-500' : 'bg-yellow-500'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed & Progress */}
      {currentLocation?.speed > 0 && (
        <div className="p-3 bg-gray-50 border-t flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Car className="w-4 h-4" />
            <span>{Math.round(currentLocation.speed * 2.237)} mph</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Zap className="w-4 h-4" />
            <span>Step {currentStepIndex + 1} of {instructions.length}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}