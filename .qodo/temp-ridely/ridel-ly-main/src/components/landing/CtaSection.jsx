
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CtaSection({ title, subtitle, description, buttonText, buttonLink, imageUrl, imageAlt, reverse = false }) {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center`}>
          <motion.div
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className={`rounded-3xl overflow-hidden aspect-square ${reverse ? 'lg:order-last' : ''}`}
          >
            <img
              className="w-full h-full object-cover"
              src={imageUrl}
              alt={imageAlt}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-5xl font-bold tracking-tight text-brand-dark sm:text-6xl font-heading">
              {title}
            </h2>
            <p className={`mt-4 text-3xl font-semibold tracking-tight ${reverse ? 'text-brand-magenta' : 'text-brand-blue'}`}>{subtitle}</p>
            <p className="mt-6 text-xl leading-8 text-gray-600">
              {description}
            </p>
            <div className="mt-10 flex items-center justify-center lg:justify_start">
              <Button asChild size="lg" className={`text-lg rounded-full py-7 px-8 font-bold group transition-transform hover:scale-105 ${reverse ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <Link to={createPageUrl(buttonLink)}>
                  {buttonText}
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
