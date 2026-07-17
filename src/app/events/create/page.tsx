'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_CATEGORIES, isProhibitedEventCategory } from '@/lib/localization/categories';
import { moderateEvent } from '@/lib/moderation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  MapPin,
  Image,
  Ticket,
  Settings,
  Eye,
  Upload,
  Plus,
  Trash2,
  X,
  Calendar,
  Clock,
  Globe,
  AlertCircle,
  Save,
  Sparkles,
  DollarSign,
  Users,
  Tag,
  Percent,
  Video,
  FileImage,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const steps = [
  { id: 1, label: 'Basics', icon: FileText },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Media', icon: Image },
  { id: 4, label: 'Tickets', icon: Ticket },
  { id: 5, label: 'Settings', icon: Settings },
  { id: 6, label: 'Preview', icon: Eye },
];

const categories = EVENT_CATEGORIES;

const timezones = [
  'Africa/Lagos (WAT)',
  'Africa/Nairobi (EAT)',
  'Africa/Johannesburg (SAST)',
  'Africa/Accra (GMT)',
  'Africa/Cairo (EET)',
  'Africa/Addis_Ababa (EAT)',
  'UTC',
];

interface TicketTier {
  id: string;
  name: string;
  price: string;
  capacity: string;
  perks: string[];
  isActive: boolean;
}

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    timezone: 'Africa/Lagos (WAT)',
    venue: '',
    address: '',
    city: '',
    country: '',
    isVirtual: false,
    virtualLink: '',
    coverImage: null as File | null,
    promoVideoUrl: '',
    flyerFile: null as File | null,
    galleryImages: [] as File[],
    ticketType: 'paid' as 'free' | 'paid',
    tiers: [
      {
        id: '1',
        name: 'General Admission',
        price: '',
        capacity: '',
        perks: ['Event access'],
        isActive: true,
      },
    ] as TicketTier[],
    totalCapacity: '',
    showGuestList: true,
    guestPolicy: 'anyone',
    allowRefunds: true,
    refundDeadlineDays: '7',
    promoCodes: [] as { code: string; discount: string; type: 'percent' | 'fixed' }[],
  });

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.title.trim()) newErrors.title = 'Event title is required';
      if (!form.description.trim()) newErrors.description = 'Description is required';
      if (!form.category) newErrors.category = 'Select a category';
      if (!form.startDate) newErrors.startDate = 'Start date is required';
      if (!form.endDate) newErrors.endDate = 'End date is required';

      // Trust & safety gate — prohibited categories & content are blocked.
      if (form.category && isProhibitedEventCategory(form.category)) {
        newErrors.category = `"${form.category}" events are not permitted on AfriBook`;
      }
      const screening = moderateEvent({
        title: form.title,
        description: form.description,
        category: form.category,
      });
      if (screening.blocked) {
        newErrors.title = 'This event contains prohibited content and cannot be created.';
      }
    } else if (step === 2) {
      if (!form.isVirtual) {
        if (!form.venue.trim()) newErrors.venue = 'Venue name is required';
        if (!form.city.trim()) newErrors.city = 'City is required';
      }
    } else if (step === 4) {
      form.tiers.forEach((tier, i) => {
        if (!tier.name.trim()) newErrors[`tier_${i}_name`] = 'Tier name required';
        if (form.ticketType === 'paid' && !tier.price) newErrors[`tier_${i}_price`] = 'Price required';
        if (!tier.capacity) newErrors[`tier_${i}_capacity`] = 'Capacity required';
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 6));
    }
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const addTier = () => {
    updateForm('tiers', [
      ...form.tiers,
      {
        id: Date.now().toString(),
        name: '',
        price: '',
        capacity: '',
        perks: [],
        isActive: true,
      },
    ]);
  };

  const removeTier = (id: string) => {
    updateForm(
      'tiers',
      form.tiers.filter((t) => t.id !== id),
    );
  };

  const addPerk = (tierId: string) => {
    updateForm(
      'tiers',
      form.tiers.map((t) =>
        t.id === tierId ? { ...t, perks: [...t.perks, 'New perk'] } : t,
      ),
    );
  };

  const removePerk = (tierId: string, perkIndex: number) => {
    updateForm(
      'tiers',
      form.tiers.map((t) =>
        t.id === tierId ? { ...t, perks: t.perks.filter((_, i) => i !== perkIndex) } : t,
      ),
    );
  };

  const addPromoCode = () => {
    updateForm('promoCodes', [...form.promoCodes, { code: '', discount: '', type: 'percent' }]);
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/events"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Events</span>
          </Link>
          <h1 className="font-heading font-bold text-text-primary text-lg hidden sm:block">
            Create Event
          </h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-surface-secondary transition-colors text-sm font-medium">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    step.id === currentStep
                      ? 'bg-amber-500 text-white'
                      : step.id < currentStep
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-surface-secondary text-text-tertiary'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">{step.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div
                    className={`hidden md:block w-8 h-0.5 mx-2 ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-surface-tertiary rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={fadeIn}
          >
            {/* Step 1: Basics */}
            {currentStep === 1 && (
              <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
                  Event Basics
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      placeholder="e.g. Afrobeats Night: The Ultimate Concert"
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description *
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      placeholder="Tell people what your event is about..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => updateForm('category', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={`${form.startDate}T${form.startTime}`}
                        onChange={(e) => {
                          const [d, t] = e.target.value.split('T');
                          updateForm('startDate', d);
                          updateForm('startTime', t);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.startDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={`${form.endDate}T${form.endTime}`}
                        onChange={(e) => {
                          const [d, t] = e.target.value.split('T');
                          updateForm('endDate', d);
                          updateForm('endTime', t);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Timezone
                    </label>
                    <select
                      value={form.timezone}
                      onChange={(e) => updateForm('timezone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
                  Event Location
                </h2>
                <div className="space-y-6">
                  <label className="flex items-center gap-3 p-4 bg-surface-secondary rounded-xl border border-border cursor-pointer hover:border-amber-500/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.isVirtual}
                      onChange={(e) => updateForm('isVirtual', e.target.checked)}
                      className="w-5 h-5 rounded border-border text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <p className="font-medium text-text-primary">This is a virtual event</p>
                      <p className="text-sm text-text-secondary">
                        Host online via Zoom, Google Meet, or streaming platforms
                      </p>
                    </div>
                    <Globe className="w-5 h-5 text-text-tertiary ml-auto" />
                  </label>

                  {form.isVirtual ? (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Virtual Event Link
                      </label>
                      <input
                        type="url"
                        value={form.virtualLink}
                        onChange={(e) => updateForm('virtualLink', e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      />
                      <p className="text-xs text-text-tertiary mt-1">
                        Link will be shared with attendees after registration
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Venue Name *
                        </label>
                        <input
                          type="text"
                          value={form.venue}
                          onChange={(e) => updateForm('venue', e.target.value)}
                          placeholder="e.g. Eko Convention Centre"
                          className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                        />
                        {errors.venue && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> {errors.venue}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) => updateForm('address', e.target.value)}
                          placeholder="Street address"
                          className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) => updateForm('city', e.target.value)}
                            placeholder="e.g. Lagos"
                            className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                          />
                          {errors.city && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> {errors.city}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            value={form.country}
                            onChange={(e) => updateForm('country', e.target.value)}
                            placeholder="e.g. Nigeria"
                            className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
                  Event Media
                </h2>
                <div className="space-y-8">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Cover Image
                    </label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                      <Upload className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                      <p className="text-text-secondary mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-text-tertiary">
                        PNG, JPG, WebP up to 5MB. Recommended 1920×1080
                      </p>
                    </div>
                  </div>

                  {/* Promo Video */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Promo Video URL
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                        <input
                          type="url"
                          value={form.promoVideoUrl}
                          onChange={(e) => updateForm('promoVideoUrl', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Gallery Images
                    </label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                      <FileImage className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Add photos to your event gallery (up to 20)
                      </p>
                    </div>
                  </div>

                  {/* Flyer */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Event Flyer
                    </label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary">
                        Upload a promotional flyer (PDF, PNG, JPG)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Tickets */}
            {currentStep === 4 && (
              <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
                  Ticket Configuration
                </h2>
                <div className="space-y-6">
                  {/* Ticket Type Toggle */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateForm('ticketType', 'free')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all border ${
                        form.ticketType === 'free'
                          ? 'bg-green-500/10 border-green-500 text-green-600'
                          : 'bg-surface-secondary border-border text-text-secondary hover:border-amber-500/50'
                      }`}
                    >
                      Free Event
                    </button>
                    <button
                      onClick={() => updateForm('ticketType', 'paid')}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all border ${
                        form.ticketType === 'paid'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                          : 'bg-surface-secondary border-border text-text-secondary hover:border-amber-500/50'
                      }`}
                    >
                      Paid Event
                    </button>
                  </div>

                  {/* Ticket Tiers */}
                  <div className="space-y-4">
                    {form.tiers.map((tier, i) => (
                      <div
                        key={tier.id}
                        className="bg-surface-secondary rounded-xl border border-border p-5"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-heading font-semibold text-text-primary">
                            Tier {i + 1}
                          </h3>
                          {form.tiers.length > 1 && (
                            <button
                              onClick={() => removeTier(tier.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Tier Name
                            </label>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) =>
                                updateForm(
                                  'tiers',
                                  form.tiers.map((t) =>
                                    t.id === tier.id ? { ...t, name: e.target.value } : t,
                                  ),
                                )
                              }
                              placeholder="e.g. Early Bird"
                              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                          {form.ticketType === 'paid' && (
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">
                                Price
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <input
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) =>
                                    updateForm(
                                      'tiers',
                                      form.tiers.map((t) =>
                                        t.id === tier.id ? { ...t, price: e.target.value } : t,
                                      ),
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Capacity
                            </label>
                            <input
                              type="number"
                              value={tier.capacity}
                              onChange={(e) =>
                                updateForm(
                                  'tiers',
                                  form.tiers.map((t) =>
                                    t.id === tier.id ? { ...t, capacity: e.target.value } : t,
                                  ),
                                )
                              }
                              placeholder="100"
                              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                        </div>

                        {/* Perks */}
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-2">
                            Perks / Inclusions
                          </label>
                          <div className="space-y-2">
                            {tier.perks.map((perk, pi) => (
                              <div key={pi} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500 shrink-0" />
                                <input
                                  type="text"
                                  value={perk}
                                  onChange={(e) => {
                                    const newPerks = [...tier.perks];
                                    newPerks[pi] = e.target.value;
                                    updateForm(
                                      'tiers',
                                      form.tiers.map((t) =>
                                        t.id === tier.id ? { ...t, perks: newPerks } : t,
                                      ),
                                    );
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                                <button
                                  onClick={() => removePerk(tier.id, pi)}
                                  className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addPerk(tier.id)}
                              className="flex items-center gap-1 text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Add perk
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addTier}
                    className="w-full py-3 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-amber-500 hover:text-amber-500 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Another Tier
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Total Event Capacity
                    </label>
                    <input
                      type="number"
                      value={form.totalCapacity}
                      onChange={(e) => updateForm('totalCapacity', e.target.value)}
                      placeholder="Maximum total attendees"
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Settings */}
            {currentStep === 5 && (
              <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-6">
                  Event Settings
                </h2>
                <div className="space-y-8">
                  {/* Guest List */}
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" /> Guest List
                    </h3>
                    <label className="flex items-center gap-3 p-4 bg-surface-secondary rounded-xl border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.showGuestList}
                        onChange={(e) => updateForm('showGuestList', e.target.checked)}
                        className="w-5 h-5 rounded border-border text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className="font-medium text-text-primary">Show guest list publicly</p>
                        <p className="text-sm text-text-secondary">
                          Allow attendees to see who else is attending
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Refund Policy */}
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-amber-500" /> Refund Policy
                    </h3>
                    <label className="flex items-center gap-3 p-4 bg-surface-secondary rounded-xl border border-border cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowRefunds}
                        onChange={(e) => updateForm('allowRefunds', e.target.checked)}
                        className="w-5 h-5 rounded border-border text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className="font-medium text-text-primary">Allow refunds</p>
                        <p className="text-sm text-text-secondary">
                          Attendees can request a refund before the deadline
                        </p>
                      </div>
                    </label>
                    {form.allowRefunds && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Refund deadline (days before event)
                        </label>
                        <input
                          type="number"
                          value={form.refundDeadlineDays}
                          onChange={(e) => updateForm('refundDeadlineDays', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Promo Codes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-text-primary flex items-center gap-2">
                        <Tag className="w-5 h-5 text-amber-500" /> Promo Codes
                      </h3>
                      <button
                        onClick={addPromoCode}
                        className="text-amber-500 text-sm font-medium hover:text-amber-600 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add Code
                      </button>
                    </div>
                    {form.promoCodes.map((promo, i) => (
                      <div key={i} className="flex gap-3 mb-3">
                        <input
                          type="text"
                          value={promo.code}
                          onChange={(e) => {
                            const newCodes = [...form.promoCodes];
                            newCodes[i].code = e.target.value;
                            updateForm('promoCodes', newCodes);
                          }}
                          placeholder="Code"
                          className="flex-1 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase"
                        />
                        <input
                          type="number"
                          value={promo.discount}
                          onChange={(e) => {
                            const newCodes = [...form.promoCodes];
                            newCodes[i].discount = e.target.value;
                            updateForm('promoCodes', newCodes);
                          }}
                          placeholder="Discount"
                          className="w-24 px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <select
                          value={promo.type}
                          onChange={(e) => {
                            const newCodes = [...form.promoCodes];
                            newCodes[i].type = e.target.value as 'percent' | 'fixed';
                            updateForm('promoCodes', newCodes);
                          }}
                          className="px-3 py-2 rounded-lg bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        >
                          <option value="percent">%</option>
                          <option value="fixed">$</option>
                        </select>
                        <button
                          onClick={() =>
                            updateForm(
                              'promoCodes',
                              form.promoCodes.filter((_, j) => j !== i),
                            )
                          }
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Preview & Publish */}
            {currentStep === 6 && (
              <div className="bg-surface rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                  Preview & Publish
                </h2>
                <p className="text-text-secondary mb-6">
                  Review your event before publishing. You can edit it later.
                </p>

                <div className="bg-surface-secondary rounded-xl border border-border p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-text-primary">
                        {form.title || 'Untitled Event'}
                      </h3>
                      <span className="inline-block bg-amber-500/10 text-amber-600 text-xs font-medium px-2.5 py-1 rounded-full mt-2">
                        {form.category || 'No category'}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm">{form.description || 'No description provided.'}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        {form.startDate || 'TBD'}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {form.startTime || 'TBD'} — {form.endTime || 'TBD'}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        {form.isVirtual ? 'Virtual Event' : `${form.venue || 'TBD'}, ${form.city || ''}`}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Ticket className="w-4 h-4 text-amber-500" />
                        {form.ticketType === 'free' ? 'Free Event' : `Paid · ${form.tiers.length} tier(s)`}
                      </div>
                    </div>
                    {form.ticketType === 'paid' && (
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-medium text-text-secondary mb-2">Ticket Tiers</h4>
                        <div className="space-y-2">
                          {form.tiers.map((tier) => (
                            <div key={tier.id} className="flex items-center justify-between text-sm">
                              <span className="text-text-primary font-medium">{tier.name}</span>
                              <span className="text-amber-500 font-bold">${tier.price || '0'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Ready to go live?</p>
                      <p className="text-sm text-text-secondary">
                        Your event will be visible to everyone and tickets can be purchased immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/events"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Publish Event
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
