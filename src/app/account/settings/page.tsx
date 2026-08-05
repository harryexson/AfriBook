'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  Globe,
  Eye,
  Trash2,
  Save,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react';
import PaymentMethodsManager from '@/components/account/PaymentMethodsManager';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPromotions: false,
    emailUpdates: true,
    pushOrders: true,
    pushPromotions: true,
    pushUpdates: true,
    smsOrders: false,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showActivity: false,
    dataSharing: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'English',
    currency: 'USD',
    timezone: 'Africa/Lagos',
  });

  const handleSave = () => {
    // Save settings
  };

  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
          Account Settings
        </h1>
        <p className="text-text-secondary">Manage your account preferences</p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Profile Section */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Profile Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Password Section */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Change Password
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
        </motion.section>

        {/* Notification Preferences */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              { key: 'emailOrders', label: 'Order updates via email', type: 'email' },
              { key: 'emailPromotions', label: 'Promotions via email', type: 'email' },
              { key: 'emailUpdates', label: 'Product updates via email', type: 'email' },
              { key: 'pushOrders', label: 'Order updates via push', type: 'push' },
              { key: 'pushPromotions', label: 'Promotions via push', type: 'push' },
              { key: 'pushUpdates', label: 'Product updates via push', type: 'push' },
              { key: 'smsOrders', label: 'Order updates via SMS', type: 'sms' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <button
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [item.key]: !notifications[item.key as keyof typeof notifications],
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors ${
                    notifications[item.key as keyof typeof notifications]
                      ? 'bg-amber-500'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'translate-x-5.5'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Privacy Settings */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            Privacy Settings
          </h2>
          <div className="space-y-4">
            {[
              { key: 'showProfile', label: 'Show profile to other users' },
              { key: 'showActivity', label: 'Show recent activity' },
              { key: 'dataSharing', label: 'Allow data sharing for personalized recommendations' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <button
                  onClick={() =>
                    setPrivacy({
                      ...privacy,
                      [item.key]: !privacy[item.key as keyof typeof privacy],
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors ${
                    privacy[item.key as keyof typeof privacy]
                      ? 'bg-amber-500'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                      privacy[item.key as keyof typeof privacy]
                        ? 'translate-x-5.5'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Language & Currency */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            Language & Currency
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:border-amber-500 text-sm"
              >
                <option>English</option>
                <option>French</option>
                <option>Swahili</option>
                <option>Amharic</option>
                <option>Arabic</option>
                <option>Yoruba</option>
                <option>Hausa</option>
                <option>Zulu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Currency
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:border-amber-500 text-sm"
              >
                <option>USD</option>
                <option>NGN</option>
                <option>KES</option>
                <option>GHS</option>
                <option>ZAR</option>
                <option>EGP</option>
                <option>RWF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:border-amber-500 text-sm"
              >
                <option>Africa/Lagos</option>
                <option>Africa/Nairobi</option>
                <option>Africa/Johannesburg</option>
                <option>Africa/Accra</option>
                <option>Africa/Cairo</option>
                <option>Africa/Kigali</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Payment Methods */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-bold text-text-primary mb-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Payment Methods
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Mobile money wallets, bank accounts, and debit or credit cards.
          </p>
          <PaymentMethodsManager />
        </motion.section>

        {/* Delete Account */}
        <motion.section
          variants={fadeIn}
          className="bg-surface-secondary rounded-2xl border border-red-500/20 p-6"
        >
          <h2 className="font-heading font-bold text-red-500 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </h2>
          <p className="text-text-secondary text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors">
            Delete My Account
          </button>
        </motion.section>

        {/* Save Button */}
        <motion.div variants={fadeIn} className="flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
