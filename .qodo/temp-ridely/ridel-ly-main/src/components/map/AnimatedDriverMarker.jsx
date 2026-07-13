import React, { useEffect, useRef, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Animated car icon
const createCarIcon = (heading = 0) => {
  return L.divIcon({
    className: 'animated-car-marker',
    html: `
      <div style="
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading}deg);
        transition: transform 0.5s ease-out;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 3px solid white;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="white"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.5);
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.8;
          }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

export default function AnimatedDriverMarker({ 
  position, 
  heading = 0,
  previousPosition = null,
  smoothAnimation = true 
}) {
  const map = useMap();
  const markerRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentHeading, setCurrentHeading] = useState(heading);
  const animationFrameRef = useRef(null);

  // Smooth position interpolation
  useEffect(() => {
    if (!smoothAnimation || !previousPosition) {
      setCurrentPosition(position);
      setCurrentHeading(heading);
      return;
    }

    const startPos = currentPosition;
    const endPos = position;
    const startHeading = currentHeading;
    const endHeading = heading;
    const duration = 2000; // 2 seconds for smooth movement
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const newLat = startPos[0] + (endPos[0] - startPos[0]) * eased;
      const newLng = startPos[1] + (endPos[1] - startPos[1]) * eased;
      
      // Interpolate heading (handle 360° wrap)
      let headingDiff = endHeading - startHeading;
      if (headingDiff > 180) headingDiff -= 360;
      if (headingDiff < -180) headingDiff += 360;
      const newHeading = startHeading + headingDiff * eased;

      setCurrentPosition([newLat, newLng]);
      setCurrentHeading(newHeading);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [position[0], position[1], heading]);

  // Update marker icon when heading changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createCarIcon(currentHeading));
    }
  }, [currentHeading]);

  return (
    <Marker
      ref={markerRef}
      position={currentPosition}
      icon={createCarIcon(currentHeading)}
    />
  );
}