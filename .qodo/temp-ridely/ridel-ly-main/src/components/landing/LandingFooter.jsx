
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Car } from 'lucide-react';

const footerNav = {
  solutions: [
    { name: 'Ride', href: 'BookRide' },
    { name: 'Drive', href: 'DriverOnboarding' },
    { name: 'Eat', href: 'FoodMenu' },
    { name: 'Business', href: 'RestaurantOnboarding' },
  ],
  company: [
    { name: 'About us', href: 'Landing' },
    { name: 'Newsroom', href: 'Landing' },
    { name: 'Careers', href: 'Landing' },
    { name: 'Safety', href: 'Landing' },
  ],
  legal: [
    { name: 'Privacy', href: 'Landing' },
    { name: "Terms", href: 'Landing' },
    { name: 'Accessibility', href: 'Landing' },
  ]
};

export default function LandingFooter() {
  return (
    <footer className="bg-brand-light-gray" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to={createPageUrl('Landing')} className="flex items-center">
               <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/9c466391c_RidelyredLogofile_01c38620ea6e26681e4ae899e1.png" alt="Ride-ly Logo" className="h-12 w-auto" />
            </Link>
            <p className="text-gray-600 text-base">Your city, unlocked.</p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Solutions</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNav.solutions.map((item) => (
                    <li key={item.name}>
                      <Link to={createPageUrl(item.href)} className="text-base text-gray-600 hover:text-brand-dark">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Company</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNav.company.map((item) => (
                    <li key={item.name}>
                       <Link to={createPageUrl(item.href)} className="text-base text-gray-600 hover:text-brand-dark">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Legal</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNav.legal.map((item) => (
                    <li key={item.name}>
                      <Link to={createPageUrl(item.href)} className="text-base text-gray-600 hover:text-brand-dark">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-500 xl:text-center">&copy; {new Date().getFullYear()} Ride-ly Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
