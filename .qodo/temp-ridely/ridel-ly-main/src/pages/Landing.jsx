
import React from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

const floatingItems = [
  { src: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg", alt: "Salad", className: "w-40 h-40 top-10 left-10", duration: 8, delay: 0 },
  { src: "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg", alt: "Pancakes", className: "w-32 h-32 top-1/3 right-12", duration: 9, delay: 0.5 },
  { src: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", alt: "Restaurant dish", className: "w-52 h-40 bottom-1/4 left-16", duration: 10, delay: 1 },
  { src: "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg", alt: "Motorbike", className: "w-48 h-32 bottom-10 right-20", duration: 11, delay: 1.5 },
  { src: "https://images.pexels.com/photos/11246320/pexels-photo-11246320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", alt: "Car front", className: "w-24 h-24 top-20 right-1/4", duration: 12, delay: 2 },
];

const drivingCars = [
  { y: '15%', duration: 20, delay: 2, imageUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', direction: 'rtl' },
  { y: '25%', duration: 15, delay: 0, imageUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', direction: 'ltr' },
  { y: '50%', duration: 22, delay: 5, imageUrl: 'https://cdn-icons-png.flaticon.com/512/2736/2736918.png', direction: 'rtl' },
  { y: '75%', duration: 18, delay: 8, imageUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png', direction: 'ltr' },
  { y: '85%', duration: 25, delay: 12, imageUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', direction: 'rtl' },
];

export default function LandingPage() {
  const handleLogin = () => {
    base44.auth.redirectToLogin('/Dashboard');
  };

  const handleDriverSignup = () => {
    base44.auth.redirectToLogin(createPageUrl('DriverOnboarding'));
  };

  return (
    <div 
        className="relative min-h-screen w-full overflow-hidden bg-gray-100 flex items-center justify-center bg-cover bg-center"
        style={{backgroundImage: "url('https://images.pexels.com/photos/21014/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')"}}
    >
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-0"></div>
      
      {/* Animated Driving Cars */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {drivingCars.map((car, i) => (
          <motion.div
            key={`car-${i}`}
            className="absolute"
            style={{ top: car.y, filter: 'brightness(0.8)' }}
            initial={{ x: car.direction === 'ltr' ? '-10%' : '110%' }}
            animate={{ x: car.direction === 'ltr' ? '110%' : '-10%' }}
            transition={{
              duration: car.duration,
              delay: car.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
          >
            <img 
              src={car.imageUrl} 
              alt="Driving car" 
              className="w-24 h-auto opacity-20"
              style={{ transform: car.direction === 'rtl' ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Floating Background Items */}
      <div className="absolute inset-0 pointer-events-none opacity-80 md:opacity-100 z-10">
        {floatingItems.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-2xl shadow-lg ${item.className}`}
            initial={{ opacity: 0, scale: 0.5, rotate: Math.random() * 40 - 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, Math.random() * 30 - 15, 0],
              x: [0, Math.random() * 30 - 15, 0],
            }}
            transition={{ 
              duration: item.duration, 
              ease: "easeInOut",
              delay: item.delay,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          >
            <img src={item.src} alt={item.alt} className="w-full h-full object-cover rounded-2xl"/>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 p-8 text-center max-w-lg">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/9c466391c_RidelyredLogofile_01c38620ea6e26681e4ae899e1.png"
          alt="Ride-ly Logo"
          className="h-20 w-auto mx-auto mb-6"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Welcome to Ride-ly</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">Your city, at your fingertips. Fair, reliable, and always on time.</p>
        
        <div className="space-y-3">
          <Button onClick={handleLogin} className="w-full max-w-xs mx-auto h-14 bg-gray-800 text-white text-lg font-semibold hover:bg-gray-900">
            Rider Sign In
          </Button>
          
          <Button onClick={handleDriverSignup} variant="outline" className="w-full max-w-xs mx-auto h-14 border-2 border-gray-800 text-gray-800 text-lg font-semibold hover:bg-gray-100">
            🚗 Become a Driver
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6 px-4">
          By continuing, you agree to our Terms & Conditions and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
