'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Headphones,
  Building,
  Globe,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const offices = [
  {
    city: 'Lagos',
    country: 'Nigeria',
    address: '14 Admiralty Way, Lekki Phase 1, Lagos',
    phone: '+234 800 123 4567',
    email: 'lagos@afribook.com',
    is: true,
  },
  {
    city: 'Nairobi',
    country: 'Kenya',
    address: 'Westlands Business Park, Block C, Nairobi',
    phone: '+254 800 123 456',
    email: 'nairobi@afribook.com',
    is: true,
  },
  {
    city: 'Johannesburg',
    country: 'South Africa',
    address: 'Sandton City Office Tower, 83 Rivonia Rd, Johannesburg',
    phone: '+27 800 123 456',
    email: 'johannesburg@afribook.com',
    is: true,
  },
  {
    city: 'Accra',
    country: 'Ghana',
    address: 'Airport City, 4 Senchi Street, Accra',
    phone: '+233 800 123 456',
    email: 'accra@afribook.com',
    is: false,
  },
];

const categories = [
  'General Inquiry',
  'Customer Support',
  'Vendor Support',
  'Partnerships',
  'Press & Media',
  'Careers',
  'Technical Issue',
  'Billing',
];

const socials = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData({ name: '', email: '', subject: '', category: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-dark-500 via-dark-300 to-amber-600 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p
              variants={fadeIn}
              className="text-amber-500 font-medium tracking-wider uppercase text-sm mb-4"
            >
              Get in Touch
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="font-heading text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Contact Us
            </motion.h1>
            <motion.p variants={fadeIn} className="text-xl text-white/80 max-w-2xl mx-auto">
              Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="lg:col-span-3"
            >
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                Send Us a Message
              </h2>
              <p className="text-text-secondary mb-8">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-amber-500 transition-colors"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    placeholder="Tell us more..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Quick Contact */}
              <div className="bg-surface-secondary rounded-2xl p-6 border border-border">
                <h3 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-amber-500" />
                  Quick Contact
                </h3>
                <div className="space-y-4">
                  <a
                    href="mailto:support@afribook.com"
                    className="flex items-center gap-3 text-text-secondary hover:text-amber-500 transition-colors"
                  >
                    <Mail className="w-5 h-5 shrink-0" />
                    <span>support@afribook.com</span>
                  </a>
                  <a
                    href="tel:+2348001234567"
                    className="flex items-center gap-3 text-text-secondary hover:text-amber-500 transition-colors"
                  >
                    <Phone className="w-5 h-5 shrink-0" />
                    <span>+234 800 123 4567</span>
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-surface-secondary rounded-2xl p-6 border border-border">
                <h3 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Business Hours
                </h3>
                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <span>Monday — Friday</span>
                    <span className="text-text-primary font-medium">8:00 AM — 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="text-text-primary font-medium">9:00 AM — 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="text-text-tertiary">Closed</span>
                  </div>
                </div>
                <p className="text-text-tertiary text-xs mt-4">
                  * Support available 24/7 via chat and email
                </p>
              </div>

              {/* Social Links */}
              <div className="bg-surface-secondary rounded-2xl p-6 border border-border">
                <h3 className="font-heading font-bold text-text-primary mb-4">
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      className="w-10 h-10 bg-surface rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-amber-500 hover:border-amber-500/50 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold text-text-primary mb-2">
              Our Offices
            </h2>
            <p className="text-text-secondary">
              Visit us at any of our locations across Africa.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {offices.map((office) => (
              <motion.div
                key={office.city}
                variants={fadeIn}
                className="bg-surface rounded-2xl p-6 border border-border"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-amber-500" />
                  <h3 className="font-heading font-bold text-text-primary">
                    {office.city}
                  </h3>
                  {office.is && (
                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                      HQ
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-sm mb-3">{office.country}</p>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    {office.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" />
                    {office.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    {office.email}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-surface-secondary rounded-2xl border border-border h-80 flex items-center justify-center"
          >
            <div className="text-center text-text-tertiary">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-heading font-medium">Interactive Map</p>
              <p className="text-sm">Map integration coming soon</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
