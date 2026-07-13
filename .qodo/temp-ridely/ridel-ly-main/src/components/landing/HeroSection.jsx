
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Car, Utensils, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-semibold text-brand-blue font-heading tracking-wide">Everyone Deserves A Fair Deal.</p>
            <h1 className="font-heading text-6xl md:text-7xl font-extrabold text-brand-dark tracking-tighter mt-2">
              Get it all, with Aura.
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-lg">
              Your day belongs to you. Order a ride, get food delivered, and move with freedom on a platform built on fairness.
            </p>
            <div className="mt-10 bg-white rounded-full p-2 shadow-lg border border-gray-100 flex items-center gap-2 max-w-xl">
              <MapPin className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
              <input 
                type="text"
                placeholder="Enter delivery or pickup address"
                className="w-full h-full py-2 bg-transparent focus:outline-none text-gray-700 placeholder-gray-500 text-lg"
              />
              <div className="flex shrink-0 gap-2">
                <Button asChild className="rounded-full bg-brand-dark hover:bg-gray-800 text-white font-semibold px-5 py-2.5 text-base">
                    <Link to={createPageUrl('BookRide')}>Ride</Link>
                </Button>
                 <Button asChild className="rounded-full bg-brand-magenta hover:bg-pink-700 text-white font-semibold px-5 py-2.5 text-base">
                    <Link to={createPageUrl('FoodMenu')}>Food</Link>
                </Button>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block"
          >
            <img 
              src="https://images.pexels.com/photos/4397833/pexels-photo-4397833.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="Person using a phone to order a ride or food with a city map in the background"
              className="rounded-3xl object-cover w-full h-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
