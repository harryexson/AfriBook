
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Car, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Ride', path: 'BookRide' },
  { name: 'Eat', path: 'FoodMenu' },
  { name: 'Prime', path: 'Prime' },
  { name: 'For Drivers', path: 'DriverOnboarding' },
  { name: 'For Restaurants', path: 'RestaurantOnboarding' },
];

export default function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to={createPageUrl('Landing')} className="flex items-center">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/9c466391c_RidelyredLogofile_01c38620ea6e26681e4ae899e1.png" alt="Ride-ly Logo" className="h-12 w-auto" />
            </Link>
          </div>
          <div className="hidden md:block">
            <nav className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={createPageUrl(link.path)}
                  className="text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden md:block">
             <Button asChild className="bg-brand-dark text-white hover:bg-gray-800 font-semibold rounded-full px-5">
                <Link to={createPageUrl('Dashboard')}>Sign In</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" className="text-brand-dark hover:bg-gray-100" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 border-t border-gray-200">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={createPageUrl(link.path)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Button asChild className="w-full bg-brand-dark text-white font-semibold rounded-full">
            <Link to={createPageUrl('Dashboard')}>Sign In</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
