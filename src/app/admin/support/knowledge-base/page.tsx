'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, timeAgo } from '@/lib/utils'
import {
  Search, Plus, BookOpen, Eye, ThumbsUp, Clock,
  Edit3, Trash2, X, Save, Tag, FileText, ChevronRight,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type ArticleStatus = 'draft' | 'published' | 'archived'

interface Article {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  status: ArticleStatus
  author: string
  views: number
  helpfulRating: number
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  'Getting Started',
  'Account & Billing',
  'Booking & Events',
  'Delivery & Rides',
  'Business & Vendors',
  'Safety & Trust',
]

const MOCK_ARTICLES: Article[] = [
  {
    id: 'KB-001',
    title: 'How to create your AfriBook account',
    category: 'Getting Started',
    content: '## Creating Your Account\n\nCreating an AfriBook account is quick and free. Follow these steps:\n\n1. Download the AfriBook app from Google Play Store or Apple App Store.\n2. Tap "Sign Up" on the welcome screen.\n3. Enter your mobile number (ensure it\'s registered with your mobile money provider).\n4. You\'ll receive a one-time PIN via SMS. Enter it to verify your number.\n5. Fill in your profile details: full name, email address (optional), and date of birth.\n6. Set a strong password (minimum 8 characters with at least one number).\n7. Accept the Terms of Service and Privacy Policy.\n8. Tap "Create Account" to finish.\n\nYour account is now ready! You can browse services, book appointments, or order food delivery immediately.',
    tags: ['account', 'signup', 'registration', 'onboarding'],
    status: 'published',
    author: 'Chidi Okonkwo',
    views: 15420,
    helpfulRating: 96,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-06-20T14:30:00Z',
  },
  {
    id: 'KB-002',
    title: 'How to add a payment method (Mobile Money, Card, Bank)',
    category: 'Account & Billing',
    content: '## Adding a Payment Method\n\nAfriBook supports multiple payment methods across different countries.\n\n### Mobile Money\n- Go to Settings > Payment Methods\n- Tap "Add Mobile Money"\n- Select your provider (MTN, Orange, Airtel, Vodacom, M-Pesa, etc.)\n- Enter your mobile money number\n- You\'ll receive a USSD prompt to authorise the link\n- Enter your PIN to confirm\n\n### Card Payments\n- Go to Settings > Payment Methods\n- Tap "Add Card"\n- Enter your card number, expiry date, and CVV\n- Your card will be tokenised and stored securely\n- A small verification charge (refunded within 24h) may appear\n\n### Bank Transfer\n- Select "Bank Transfer" during checkout\n- You\'ll receive our payment details\n- Make the transfer and upload the receipt\n- Payments are verified within 2 hours during business days',
    tags: ['payment', 'mobile money', 'card', 'bank transfer', 'top up'],
    status: 'published',
    author: 'Amina Diallo',
    views: 12350,
    helpfulRating: 92,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-07-10T16:45:00Z',
  },
  {
    id: 'KB-003',
    title: 'How to book a service (appointment, event, rental)',
    category: 'Booking & Events',
    content: '## Booking a Service\n\n### Step 1: Find a Service\nUse the search bar or browse categories to find what you need. You can filter by location, price range, rating, and availability.\n\n### Step 2: Select Date & Time\nChoose your preferred date and time slot. The calendar shows real-time availability. Green slots are available, orange means limited availability, and grey means fully booked.\n\n### Step 3: Review & Confirm\n- Check the service details, price, and any add-ons\n- Review the cancellation policy\n- Read customer reviews and ratings\n- Apply any promo codes\n\n### Step 4: Payment\nChoose your payment method. For services, payment is held in escrow and released to the vendor after you confirm the service was completed.\n\n### Step 5: Manage Your Booking\nYou can view, reschedule, or cancel your booking from the "My Bookings" section. Cancellations within the free window incur no charges.',
    tags: ['booking', 'appointment', 'reservation', 'schedule', 'how to book'],
    status: 'published',
    author: 'James Mwangi',
    views: 9870,
    helpfulRating: 94,
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-06-15T09:20:00Z',
  },
  {
    id: 'KB-004',
    title: 'How does the escrow payment system work?',
    category: 'Account & Billing',
    content: '## Understanding Escrow Payments\n\nAfriBook uses an escrow system to protect both customers and vendors.\n\n### How It Works\n1. **Customer pays upfront** — When you book a service, the full amount is charged and held securely by AfriBook.\n2. **Vendor completes the service** — The vendor delivers the service as agreed.\n3. **Customer confirms satisfaction** — Within 48 hours of service completion, you confirm everything was satisfactory.\n4. **Funds are released** — Once confirmed, the funds are transferred to the vendor\'s account within 1-2 business days.\n\n### Dispute Protection\nIf something goes wrong, you can open a dispute within 7 days. The funds remain in escrow until the dispute is resolved. This ensures neither party is at risk.\n\n### What If I Don\'t Confirm?\nIf you don\'t confirm or dispute within 48 hours, the funds are automatically released to the vendor. We\'ll send you reminder notifications before this happens.',
    tags: ['escrow', 'payment', 'protection', 'refund', 'security'],
    status: 'published',
    author: 'Grace Ochieng',
    views: 11200,
    helpfulRating: 98,
    createdAt: '2026-02-20T14:00:00Z',
    updatedAt: '2026-07-05T11:00:00Z',
  },
  {
    id: 'KB-005',
    title: 'How to become a vendor on AfriBook',
    category: 'Business & Vendors',
    content: '## Becoming a Vendor\n\n### Eligibility\n- Must have a registered business\n- Must provide valid identification (government-issued ID)\n- Business bank account for payouts\n- Tax identification number (where applicable)\n\n### Application Process\n1. Download the AfriBook Business app\n2. Tap "Register Your Business"\n3. Fill in your business details:\n   - Business name and description\n   - Category (services, food, retail, etc.)\n   - Location and service area\n   - Business hours\n   - Pricing information\n4. Upload required documents:\n   - Business registration certificate\n   - Tax clearance certificate\n   - Director/Owner government ID\n   - Proof of business address\n5. Submit for review\n\nReview typically takes 2-5 business days. We\'ll notify you via SMS and email once your business is approved.',
    tags: ['vendor', 'business', 'seller', 'merchant', 'registration'],
    status: 'published',
    author: 'Fatima Issa',
    views: 8760,
    helpfulRating: 91,
    createdAt: '2026-03-05T09:30:00Z',
    updatedAt: '2026-07-08T13:15:00Z',
  },
  {
    id: 'KB-006',
    title: 'How to order food delivery',
    category: 'Delivery & Rides',
    content: '## Ordering Food Delivery\n\n### Browse Restaurants\n- Open the AfriBook app and tap "Food"\n- Browse by cuisine, rating, or distance\n- Use filters for dietary preferences (vegetarian, halal, gluten-free)\n\n### Place Your Order\n1. Select a restaurant and browse their menu\n2. Add items to your cart\n3. Customise your order (add notes, remove ingredients, select portion size)\n4. Enter your delivery address\n5. Choose delivery time (ASAP or scheduled)\n6. Review and place order\n\n### Track Your Delivery\n- Real-time GPS tracking of your driver\n- Push notifications at every step: preparing, picked up, on the way, delivered\n- Estimated delivery time with live updates\n- Contact your driver directly through the in-app chat\n\n### What If Something Is Wrong?\nIf your order is incorrect or late, contact support through the help centre or dispute the order within 24 hours.',
    tags: ['food', 'delivery', 'order', 'restaurant', 'tracking'],
    status: 'published',
    author: 'Chidi Okonkwo',
    views: 15680,
    helpfulRating: 88,
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-07-12T10:30:00Z',
  },
  {
    id: 'KB-007',
    title: 'How to request a ride',
    category: 'Delivery & Rides',
    content: '## Requesting a Ride\n\n### Step 1: Set Your Destination\n- Open the AfriBook app and tap "Ride"\n- Your current location is detected automatically\n- Enter your destination address or search for a landmark\n- Choose your ride type (Economy, Premium, XL, or Bike)\n\n### Step 2: Confirm Your Ride\n- See the estimated fare and ETA before confirming\n- Review the surge multiplier (if active)\n- Select payment method\n- Tap "Request Ride"\n\n### Step 3: During Your Ride\n- Track your driver\'s approach in real-time\n- Share your trip with trusted contacts\n- In-app emergency button connects you to local authorities\n\n### Step 4: After Your Ride\n- Rate your driver (1-5 stars)\n- Add a tip if you\'d like\n- Report any issues through the help centre\n- Payment is processed automatically',
    tags: ['ride', 'taxi', 'transport', 'driver', 'trip'],
    status: 'published',
    author: 'Amina Diallo',
    views: 13450,
    helpfulRating: 93,
    createdAt: '2026-04-01T08:30:00Z',
    updatedAt: '2026-06-28T15:00:00Z',
  },
  {
    id: 'KB-008',
    title: 'How to request a refund or cancel a booking',
    category: 'Account & Billing',
    content: '## Cancellations & Refunds\n\n### Free Cancellation Window\nMost services offer free cancellation up to 24 hours before the scheduled time. Check the specific cancellation policy before booking.\n\n### How to Cancel\n1. Go to "My Bookings"\n2. Select the booking you want to cancel\n3. Tap "Cancel Booking"\n4. Select a reason for cancellation\n5. Confirm\n\n### Refund Timeline\n- **Mobile Money**: 2-24 hours\n- **Card**: 3-5 business days\n- **Bank Transfer**: 2-3 business days\n\n### Late Cancellations\nIf you cancel within 24 hours of the appointment, a cancellation fee of up to 50% may apply. This is paid to the vendor for the lost time slot.\n\n### Vendor Cancellations\nIf a vendor cancels on you, you receive a full refund plus a 10% inconvenience credit.',
    tags: ['refund', 'cancel', 'cancellation', 'money back', 'return'],
    status: 'published',
    author: 'James Mwangi',
    views: 10980,
    helpfulRating: 95,
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-07-01T09:45:00Z',
  },
  {
    id: 'KB-009',
    title: 'Safety tips for using AfriBook rides',
    category: 'Safety & Trust',
    content: '## Ride Safety Tips\n\n### Before Your Ride\n- Verify the driver: check the licence plate, car model, and driver photo match the app\n- Share your trip details with a trusted contact\n- Choose well-lit pickup locations\n- Avoid sharing personal contact information with the driver\n\n### During Your Ride\n- Wear your seatbelt at all times\n- Use the in-app emergency button if you feel unsafe\n- Follow the shared route on your phone to ensure the driver is on track\n- If the driver deviates significantly from the route, ask why\n\n### After Your Ride\n- Rate your driver honestly\n- Report any safety concerns immediately\n- If you left something in the vehicle, use the "Lost Item" feature\n\n### Emergency Features\n- Emergency button connects to local police\n- Live trip sharing with up to 5 contacts\n- 24/7 safety response team available through the app',
    tags: ['safety', 'security', 'ride', 'emergency', 'protection'],
    status: 'published',
    author: 'Grace Ochieng',
    views: 7230,
    helpfulRating: 97,
    createdAt: '2026-04-20T13:00:00Z',
    updatedAt: '2026-06-10T08:00:00Z',
  },
  {
    id: 'KB-010',
    title: 'Understanding platform fees and commissions',
    category: 'Business & Vendors',
    content: '## Platform Fees for Vendors\n\n### Commission Structure\nAfriBook charges a transparent commission on each transaction:\n- **Services**: 10% of booking value\n- **Food Orders**: 15% of order value\n- **Product Sales**: 8% of sale value\n- **Rides**: 20% of fare\n\n### Additional Fees\n- **Payout Fee**: XAF 200 per settlement (deducted from payout)\n- **Promotional Campaigns**: Optional, starting from XAF 5,000 per campaign\n- **Featured Listing**: Optional, XAF 15,000 per month\n\n### When Are Fees Deducted?\nFees are deducted automatically at the time of settlement. You\'ll see a clear breakdown on each settlement statement.\n\n### How to View Your Earnings\n1. Open the AfriBook Business app\n2. Go to "Earnings"\n3. View daily, weekly, or monthly summaries\n4. Download settlement reports in CSV format',
    tags: ['fees', 'commission', 'pricing', 'vendor fees', 'platform fee'],
    status: 'published',
    author: 'Fatima Issa',
    views: 6540,
    helpfulRating: 86,
    createdAt: '2026-05-05T09:00:00Z',
    updatedAt: '2026-07-03T12:00:00Z',
  },
  {
    id: 'KB-011',
    title: 'Troubleshooting common app issues',
    category: 'Getting Started',
    content: '## Common Issues & Fixes\n\n### App Crashes or Freezes\n1. Update to the latest version\n2. Clear app cache: Settings > Apps > AfriBook > Clear Cache\n3. Restart your device\n4. Reinstall the app if the issue persists\n\n### Not Receiving SMS/OTP\n1. Check you have network signal\n2. Ensure your phone number is entered correctly (including country code)\n3. Wait 2 minutes and request a new code\n4. Contact your mobile network provider if SMS is blocked\n\n### Payment Failed\n1. Check your mobile money balance is sufficient\n2. Ensure you have daily transaction limit remaining\n3. Try a different payment method\n4. Contact your bank or mobile money provider\n\n### Login Issues\n1. Use "Forgot Password" to reset\n2. Check your internet connection\n3. Clear app data and try again\n4. Still stuck? Contact support with your registered phone number',
    tags: ['troubleshooting', 'bug', 'error', 'crash', 'login issue', 'OTP'],
    status: 'draft',
    author: 'Chidi Okonkwo',
    views: 450,
    helpfulRating: 75,
    createdAt: '2026-07-01T16:00:00Z',
    updatedAt: '2026-07-10T11:20:00Z',
  },
  {
    id: 'KB-012',
    title: 'How to dispute a transaction or service',
    category: 'Safety & Trust',
    content: '## Filing a Dispute\n\n### When to File a Dispute\n- Service not rendered as described\n- Product damaged or incorrect\n- Unauthorised charge\n- Vendor unresponsive\n- Quality significantly below expectations\n\n### How to File\n1. Go to "My Orders" or "My Bookings"\n2. Select the transaction in question\n3. Tap "Report a Problem" or "Dispute"\n4. Select the reason from the list\n5. Provide a detailed description (include photos if applicable)\n6. Submit\n\n### What Happens Next\n1. Your dispute is assigned to a resolution agent (within 2 hours)\n2. The agent reviews both sides and gathers evidence\n3. Both parties are contacted for their statements\n4. A resolution is proposed (within 48 hours)\n5. If unresolved, the dispute is escalated to senior management\n\n### Resolution Outcomes\n- Full refund\n- Partial refund (determined case by case)\n- Service redo\n- Credit to wallet\n- Escalation to enforcement',
    tags: ['dispute', 'complaint', 'refund', 'resolution', 'chargeback'],
    status: 'published',
    author: 'Amina Diallo',
    views: 5890,
    helpfulRating: 90,
    createdAt: '2026-05-20T10:30:00Z',
    updatedAt: '2026-07-12T08:45:00Z',
  },
  {
    id: 'KB-013',
    title: 'Managing your business dashboard and analytics',
    category: 'Business & Vendors',
    content: '## Business Dashboard Guide\n\n### Overview\nYour AfriBook Business dashboard gives you real-time insights into your performance.\n\n### Key Metrics\n- **Revenue**: Total earnings (before commission)\n- **Bookings**: Number of completed bookings\n- **Conversion Rate**: Percentage of profile views that become bookings\n- **Average Rating**: Customer satisfaction score\n- **Response Rate**: How quickly you respond to booking requests\n\n### Available Reports\n- **Daily Summary**: Every morning, get yesterday\'s performance\n- **Weekly Trends**: Compare week-over-week growth\n- **Monthly Statements**: Detailed financial reports for accounting\n- **Customer Insights**: Demographics, popular services, repeat customers\n\n### Pro Tips\n- Respond to booking requests within 1 hour to maintain high response rate\n- Keep your availability calendar updated\n- Respond to all reviews (positive and negative)\n- Update your service photos monthly',
    tags: ['business', 'dashboard', 'analytics', 'reports', 'vendor tools'],
    status: 'published',
    author: 'James Mwangi',
    views: 4320,
    helpfulRating: 89,
    createdAt: '2026-06-01T14:00:00Z',
    updatedAt: '2026-07-07T10:00:00Z',
  },
  {
    id: 'KB-014',
    title: 'How package delivery works',
    category: 'Delivery & Rides',
    content: '## Sending a Package\n\n### Step 1: Create a Delivery\n1. Open AfriBook and tap "Delivery"\n2. Select package type (document, food, parcel, large item)\n3. Enter pickup and dropoff addresses\n4. Specify package dimensions and weight\n5. Choose delivery speed (Express: 1-2h, Standard: 3-5h, Scheduled)\n\n### Step 2: Meet the Driver\n- The driver will call or message you via in-app chat\n- Hand over the package (ensure it\'s properly sealed)\n- The driver will confirm pickup\n\n### Step 3: Track & Confirm\n- Track your package in real-time\n- The recipient will receive a notification when it\'s nearby\n- Signature or photo confirmation upon delivery\n- Rate the delivery experience\n\n### Package Guidelines\n- Maximum weight: 25kg\n- Maximum dimensions: 100cm x 80cm x 60cm\n- Prohibited items: cash, valuables, perishables (without proper packaging), illegal items\n- Insurance available for items valued over XAF 100,000',
    tags: ['delivery', 'package', 'parcel', 'courier', 'shipping'],
    status: 'draft',
    author: 'Grace Ochieng',
    views: 2100,
    helpfulRating: 82,
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-07-09T14:30:00Z',
  },
  {
    id: 'KB-015',
    title: 'Privacy and data protection on AfriBook',
    category: 'Safety & Trust',
    content: '## Your Privacy Matters\n\n### What Data We Collect\n- Account information (name, phone, email)\n- Transaction history\n- Location data (only when using ride or delivery services)\n- Device information for app optimisation\n\n### How We Use Your Data\n- To provide and improve our services\n- To process payments and prevent fraud\n- To send relevant notifications (with your consent)\n- To comply with legal obligations in your country\n\n### Your Rights\n- Access your data anytime through Settings > Privacy\n- Download your data in a portable format\n- Request deletion of your account and associated data\n- Opt out of marketing communications\n- Object to automated decision-making\n\n### Data Security\n- All data encrypted in transit (TLS 1.3) and at rest (AES-256)\n- Payment data is tokenised — we never store full card numbers\n- Regular security audits by independent firms\n- Compliance with data protection laws across all operating countries\n\n### Contact Our DPO\nEmail: privacy@afribook.com\nResponse time: within 48 hours',
    tags: ['privacy', 'data', 'GDPR', 'protection', 'security'],
    status: 'published',
    author: 'Fatima Issa',
    views: 3850,
    helpfulRating: 94,
    createdAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-07-11T15:30:00Z',
  },
]

const STATUS_STYLES: Record<ArticleStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function AdminKnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formContent, setFormContent] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formStatus, setFormStatus] = useState<ArticleStatus>('draft')
  const [formAuthor, setFormAuthor] = useState('')

  const filteredArticles = useMemo(() => {
    let result = [...MOCK_ARTICLES]
    if (selectedCategory) result = result.filter((a) => a.category === selectedCategory)
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.content.toLowerCase().includes(q),
      )
    }
    return result
  }, [searchQuery, selectedCategory, statusFilter])

  const openEditor = (article?: Article) => {
    if (article) {
      setEditingArticle(article)
      setFormTitle(article.title)
      setFormCategory(article.category)
      setFormContent(article.content)
      setFormTags(article.tags.join(', '))
      setFormStatus(article.status)
      setFormAuthor(article.author)
    } else {
      setEditingArticle(null)
      setFormTitle('')
      setFormCategory(CATEGORIES[0])
      setFormContent('')
      setFormTags('')
      setFormStatus('draft')
      setFormAuthor('')
    }
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setToast({ type: 'error', message: 'Title and content are required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setToast({ type: 'success', message: editingArticle ? 'Article updated successfully' : 'Article created successfully' })
    setShowEditor(false)
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = (article: Article) => {
    setToast({ type: 'success', message: `"${article.title}" moved to trash` })
    setTimeout(() => setToast(null), 3000)
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    CATEGORIES.forEach((c) => {
      counts[c] = MOCK_ARTICLES.filter((a) => a.category === c).length
    })
    return counts
  }, [])

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Knowledge Base</h1>
          <p className="text-sm text-text-secondary mt-1">Create and manage help articles for customers and vendors.</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
        >
          <Plus className="w-4 h-4" />
          New Article
        </button>
      </motion.div>

      {/* Category grid */}
      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={cn(
              'p-4 rounded-2xl border text-left transition-all duration-200',
              selectedCategory === cat
                ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700'
                : 'bg-surface border-border hover:border-amber-500/20 hover:shadow-sm',
            )}
          >
            <BookOpen className={cn('w-5 h-5 mb-2', selectedCategory === cat ? 'text-amber-600' : 'text-text-tertiary')} />
            <p className={cn('text-sm font-semibold', selectedCategory === cat ? 'text-amber-700 dark:text-amber-400' : 'text-text-primary')}>
              {cat}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">{categoryCounts[cat]} articles</p>
          </button>
        ))}
      </motion.div>

      {/* Search and filter */}
      <motion.div variants={ITEM} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search articles by title, content, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </motion.div>

      {/* Article list */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border divide-y divide-border">
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-text-tertiary mb-3" />
            <p className="text-text-primary font-medium">No articles found</p>
            <p className="text-sm text-text-secondary mt-1">Try a different search or category.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article.id} className="p-4 hover:bg-surface-secondary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-medium text-text-tertiary">{article.id}</span>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_STYLES[article.status])}>
                      {article.status}
                    </span>
                    <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded-full">{article.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{article.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary flex-wrap">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {article.helpfulRating}% helpful
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {timeAgo(article.updatedAt)}
                    </span>
                    <span>by {article.author}</span>
                  </div>
                  {article.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Tag className="w-3 h-3 text-text-tertiary" />
                      {article.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-tertiary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditor(article)}
                    className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article)}
                    className="p-2 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div className="flex items-center justify-between px-4 py-3 text-xs text-text-tertiary">
          <span>{filteredArticles.length} of {MOCK_ARTICLES.length} articles</span>
        </div>
      </motion.div>

      {/* Article editor modal */}
      <AnimatePresence>
        {showEditor && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEditor(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative w-full max-w-3xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {editingArticle ? 'Edit Article' : 'Create New Article'}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {editingArticle ? `Editing ${editingArticle.id}` : 'Write a new knowledge base article'}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. How to reset your password"
                      className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ArticleStatus)}
                      className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="e.g. password, login, account recovery"
                      className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Author</label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Content (Markdown supported)</label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Write your article content using Markdown..."
                      rows={14}
                      className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors resize-y font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 border-t border-border bg-surface-secondary/30">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
                >
                  <Save className="w-4 h-4" />
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white',
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
