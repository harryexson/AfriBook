import React from 'react';
import { Users, DollarSign, Shield, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Users,
    title: 'For Riders & Eaters',
    description: 'Enjoy transparent, upfront pricing on every ride and order. No hidden fees, just a fair deal every time you use Ride-ly.',
    color: 'blue'
  },
  {
    icon: DollarSign,
    title: 'For Drivers',
    description: "Earn more with an industry-leading pay structure. You get your full fare, 100% of tips, and a share of our platform fee—because we're partners.",
    color: 'green'
  },
  {
    icon: Heart,
    title: 'For Restaurants',
    description: 'Choose a commission rate that works for you. Our flexible tiers are designed to help you grow your business, not hold it back.',
    color: 'magenta'
  },
  {
    icon: Shield,
    title: 'For Everyone',
    description: 'We believe a platform can be better for everyone. With top-tier safety features and real human support, we put people first.',
    color: 'purple'
  },
];

const colorClasses = {
    blue: "text-brand-blue bg-purple-50",
    green: "text-green-600 bg-green-50",
    magenta: "text-brand-magenta bg-orange-50",
    purple: "text-purple-600 bg-purple-50",
}

export default function ValueProps() {
  return (
    <section className="bg-brand-light-gray py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto lg:text-center">
          <p className="font-semibold leading-7 text-brand-blue text-lg">Why Choose Us?</p>
          <h2 className="mt-2 text-5xl font-bold tracking-tight text-brand-dark sm:text-6xl font-heading">
            A better platform for everyone
          </h2>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            We've built Ride-ly from the ground up to be fairer, safer, and more efficient for every person on our platform.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative pl-20"
              >
                <dt className="text-xl font-semibold leading-7 text-brand-dark">
                  <div className={`absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-lg ${colorClasses[feature.color]}`}>
                     <feature.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  {feature.title}
                </dt>
                <dd className="mt-2 text-lg leading-7 text-gray-600">{feature.description}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}