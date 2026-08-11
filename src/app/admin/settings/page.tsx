'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Percent, Globe, Mail, Key, Webhook, Flag, Eye, EyeOff } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import * as Tabs from '@radix-ui/react-tabs'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success'; message: string } | null>(null)
  const [showKey, setShowKey] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
    setToast({ type: 'success', message: 'Settings saved successfully' })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Platform Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure global platform settings and integrations.</p>
      </motion.div>

      <Tabs.Root defaultValue="general" className="space-y-6">
        <motion.div variants={ITEM}>
          <Tabs.List className="flex items-center gap-1 p-1 rounded-xl bg-surface-secondary border border-border w-fit">
            {[
              { value: 'general', label: 'General', icon: Percent },
              { value: 'countries', label: 'Countries', icon: Globe },
              { value: 'notifications', label: 'Notifications', icon: Mail },
              { value: 'api', label: 'API Keys', icon: Key },
              { value: 'features', label: 'Features', icon: Flag },
            ].map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary data-[state=active]:bg-surface data-[state=active]:text-text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </motion.div>

        {/* General */}
        <Tabs.Content value="general">
          <motion.div variants={ITEM} className="space-y-6">
            <div className="rounded-2xl bg-surface border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold text-text-primary font-heading">General Settings</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-text-primary">Platform Fee Percentage</label>
                  <p className="text-xs text-text-tertiary mt-0.5 mb-2">Default commission charged on all transactions</p>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={10} step={0.1}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                    <span className="text-text-tertiary">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Minimum Transaction Fee</label>
                  <p className="text-xs text-text-tertiary mt-0.5 mb-2">Floor amount for platform fees</p>
                  <input type="number" defaultValue={500}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-text-primary">Default Currency</label>
                  <select defaultValue="XAF"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                    <option value="XAF">XAF - CFA Franc</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="GHS">GHS - Ghanaian Cedi</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Maintenance Mode</label>
                  <p className="text-xs text-text-tertiary mt-0.5 mb-2">Disable platform access for non-admin users</p>
                  <div className="flex items-center gap-3">
                    <Switch.Root className="w-10 h-6 rounded-full bg-surface-tertiary data-[state=checked]:bg-amber-500 relative outline-none transition-colors">
                      <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-[22px] transition-transform" />
                    </Switch.Root>
                    <span className="text-sm text-text-secondary">Off</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Tabs.Content>

        {/* Countries */}
        <Tabs.Content value="countries">
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Default Country Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-text-primary">Default Country Code</label>
                <select defaultValue="CM"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  <option value="CM">Cameroon</option>
                  <option value="NG">Nigeria</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">South Africa</option>
                  <option value="GH">Ghana</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary">Default Language</label>
                <select defaultValue="en"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="pt">Portuguese</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
            </div>
          </motion.div>
        </Tabs.Content>

        {/* Notifications */}
        <Tabs.Content value="notifications">
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Email & SMS Templates</h3>
            <div className="space-y-4">
              {[
                { label: 'Welcome Email', desc: 'Sent to new users upon registration', key: 'welcome' },
                { label: 'Booking Confirmation', desc: 'Sent when a booking is confirmed', key: 'booking' },
                { label: 'Order Confirmation', desc: 'Sent when an order is placed', key: 'order' },
                { label: 'Payment Receipt', desc: 'Sent after successful payment', key: 'receipt' },
                { label: 'Password Reset', desc: 'Sent for password reset requests', key: 'reset' },
                { label: 'Dispute Update', desc: 'Notification about dispute status changes', key: 'dispute' },
              ].map((tpl) => (
                <div key={tpl.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{tpl.label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{tpl.desc}</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                    Edit Template
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </Tabs.Content>

        {/* API Keys */}
        <Tabs.Content value="api">
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary font-heading">API Keys & Webhooks</h3>

            <div className="space-y-4">
              {[
                { label: 'Stripe Secret Key', key: 'sk_live_••••••••••••••••••••••••••••••••' },
                { label: 'Paystack Secret Key', key: 'sk_live_••••••••••••••••••••••••••••••••' },
                { label: 'M-Pesa API Key', key: 'mpesa_••••••••••••••••••••••••••••••••' },
                { label: 'SendGrid API Key', key: 'SG.••••••••••••••••••••••••••••••••' },
                { label: 'Twilio Account SID', key: 'AC••••••••••••••••••••••••••••••••' },
                { label: 'Mapbox Access Token', key: 'pk.eyJ1••••••••••••••••••••••••••••••••' },
              ].map((api) => (
                <div key={api.label} className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{api.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-text-tertiary">
                        {showKey ? api.key : api.key.slice(0, 12) + '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button onClick={() => setShowKey(!showKey)} className="p-1 rounded hover:bg-surface-tertiary transition-colors">
                        {showKey ? <EyeOff className="w-3.5 h-3.5 text-text-tertiary" /> : <Eye className="w-3.5 h-3.5 text-text-tertiary" />}
                      </button>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors shrink-0 ml-4">
                    Regenerate
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Webhook className="w-4 h-4" /> Webhook URLs
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Payment Webhook', url: 'https://api.afribook.com/webhooks/payment' },
                  { label: 'Dispute Webhook', url: 'https://api.afribook.com/webhooks/dispute' },
                  { label: 'User Events', url: 'https://api.afribook.com/webhooks/user' },
                ].map((wh) => (
                  <div key={wh.label} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary">
                    <div>
                      <p className="text-sm text-text-primary">{wh.label}</p>
                      <code className="text-xs font-mono text-text-tertiary">{wh.url}</code>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                      Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Tabs.Content>

        {/* Feature Flags */}
        <Tabs.Content value="features">
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Feature Flags</h3>
            <div className="space-y-3">
              {[
                { label: 'Multi-currency Checkout', desc: 'Allow customers to pay in different currencies', enabled: true },
                { label: 'Wallet Top-up', desc: 'Enable wallet funding via external providers', enabled: true },
                { label: 'QR Code Booking', desc: 'Generate QR codes for business booking pages', enabled: true },
                { label: 'Reviews & Ratings', desc: 'Allow customers to leave reviews', enabled: true },
                { label: 'Delivery Tracking', desc: 'Real-time order delivery tracking', enabled: true },
                { label: 'Promotions Engine', desc: 'Discount codes and promotional campaigns', enabled: false },
                { label: 'Subscription Plans', desc: 'Recurring billing for vendors', enabled: false },
                { label: 'Multi-language Support', desc: 'Platform content in multiple languages', enabled: true },
                { label: 'AI Recommendations', desc: 'Personalized business and service recommendations', enabled: false },
                { label: 'Dark Mode', desc: 'Toggle dark/light theme', enabled: true },
              ].map((feat) => (
                <div key={feat.label} className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{feat.label}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{feat.desc}</p>
                  </div>
                  <Switch.Root defaultChecked={feat.enabled}
                    className="w-10 h-6 rounded-full bg-surface-tertiary data-[state=checked]:bg-amber-500 relative outline-none transition-colors shrink-0">
                    <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-[22px] transition-transform" />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </motion.div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Save button */}
      <motion.div variants={ITEM}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Settings
        </button>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-emerald-500 text-white"
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
