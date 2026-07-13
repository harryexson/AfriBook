'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, timeAgo } from '@/lib/utils'
import type { AdminRole } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Search, Download, Clock, Shield, User, Building2, Users,
  CreditCard, Settings, Globe, AlertTriangle, Eye, X,
  ChevronUp, FileText, Flag, Ticket, Megaphone, BookOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type AuditAction =
  | 'user_suspend' | 'user_verify' | 'user_impersonate' | 'user_activate'
  | 'business_approve' | 'business_suspend' | 'business_verify'
  | 'payment_refund' | 'payment_release_escrow' | 'payment_flag'
  | 'promo_create' | 'promo_update' | 'promo_delete'
  | 'plan_update' | 'plan_create'
  | 'ticket_resolve' | 'ticket_escalate' | 'ticket_assign'
  | 'settings_change'
  | 'team_invite' | 'team_remove' | 'team_role_change'
  | 'flag_toggle'
  | 'country_config'
  | 'kyc_approve' | 'kyc_reject'
  | 'dispute_resolve' | 'dispute_escalate'
  | 'campaign_launch' | 'campaign_pause'
  | 'content_update' | 'content_publish'

type ResourceType = 'user' | 'business' | 'payment' | 'promo' | 'plan' | 'ticket' | 'settings' | 'team' | 'flag' | 'country' | 'kyc' | 'dispute' | 'campaign' | 'content'

interface AuditEntry {
  id: string
  timestamp: string
  actorName: string
  actorEmail: string
  actorRole: AdminRole
  action: AuditAction
  resourceType: ResourceType
  resourceId: string
  description: string
  ipAddress: string
  userAgent: string
  metadata: Record<string, unknown>
  relatedIds: string[]
}

const ACTION_ICONS: Record<ResourceType, typeof Shield> = {
  user: User,
  business: Building2,
  payment: CreditCard,
  promo: Megaphone,
  plan: FileText,
  ticket: Ticket,
  settings: Settings,
  team: Shield,
  flag: Flag,
  country: Globe,
  kyc: Shield,
  dispute: AlertTriangle,
  campaign: Megaphone,
  content: BookOpen,
}

const ACTION_LABELS: Record<AuditAction, string> = {
  user_suspend: 'User Suspended',
  user_verify: 'User Verified',
  user_impersonate: 'User Impersonated',
  user_activate: 'User Activated',
  business_approve: 'Business Approved',
  business_suspend: 'Business Suspended',
  business_verify: 'Business Verified',
  payment_refund: 'Payment Refunded',
  payment_release_escrow: 'Escrow Released',
  payment_flag: 'Payment Flagged',
  promo_create: 'Promotion Created',
  promo_update: 'Promotion Updated',
  promo_delete: 'Promotion Deleted',
  plan_update: 'Plan Updated',
  plan_create: 'Plan Created',
  ticket_resolve: 'Ticket Resolved',
  ticket_escalate: 'Ticket Escalated',
  ticket_assign: 'Ticket Assigned',
  settings_change: 'Settings Changed',
  team_invite: 'Team Invite Sent',
  team_remove: 'Team Member Removed',
  team_role_change: 'Team Role Changed',
  flag_toggle: 'Feature Flag Toggled',
  country_config: 'Country Config Updated',
  kyc_approve: 'KYC Approved',
  kyc_reject: 'KYC Rejected',
  dispute_resolve: 'Dispute Resolved',
  dispute_escalate: 'Dispute Escalated',
  campaign_launch: 'Campaign Launched',
  campaign_pause: 'Campaign Paused',
  content_update: 'Content Updated',
  content_publish: 'Content Published',
}

const RESOURCE_TYPES: ResourceType[] = ['user', 'business', 'payment', 'promo', 'plan', 'ticket', 'settings', 'team', 'flag', 'country', 'kyc', 'dispute', 'campaign', 'content']

const USERS_BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
const ADMIN_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const MOCK_AUDIT_LOGS: AuditEntry[] = [
  {
    id: 'al_001', timestamp: '2026-07-13T09:42:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'user_suspend', resourceType: 'user', resourceId: 'usr_8f2k9x',
    description: 'Suspended user for repeated policy violations regarding fraudulent booking attempts',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: ['al_003'],
    metadata: { reason: 'Fraudulent bookings', previousStatus: 'active', suspendedUntil: '2026-08-13T00:00:00Z', violationCount: 3 },
  },
  {
    id: 'al_002', timestamp: '2026-07-13T09:15:00Z', actorName: 'James Okafor', actorEmail: 'james.okafor@afribook.com', actorRole: 'admin',
    action: 'business_approve', resourceType: 'business', resourceId: 'biz_4n7kp2',
    description: 'Approved new restaurant listing "Le Coin Saveur" in Yaoundé after KYB document review',
    ipAddress: '192.168.1.22', userAgent: ADMIN_BROWSER, relatedIds: ['al_018'],
    metadata: { businessName: 'Le Coin Saveur', category: 'Restaurant', city: 'Yaoundé', countryCode: 'CM', documentsReviewed: ['business_license', 'tax_clearance'] },
  },
  {
    id: 'al_003', timestamp: '2026-07-13T08:58:00Z', actorName: 'Lisa Thompson', actorEmail: 'lisa.thompson@afribook.com', actorRole: 'moderator',
    action: 'user_verify', resourceType: 'user', resourceId: 'usr_8f2k9x',
    description: 'Verified phone number and email for user account after support ticket #TK-4521',
    ipAddress: '10.0.0.88', userAgent: USERS_BROWSER, relatedIds: ['al_001'],
    metadata: { verificationType: 'phone+email', ticketId: 'TK-4521', phoneVerified: true, emailVerified: true },
  },
  {
    id: 'al_004', timestamp: '2026-07-13T08:30:00Z', actorName: 'David Kim', actorEmail: 'david.kim@afribook.com', actorRole: 'finance',
    action: 'payment_refund', resourceType: 'payment', resourceId: 'pay_m3x9k2',
    description: 'Processed XAF 15,000 refund for order #ORD-7823 — customer reported duplicate charge',
    ipAddress: '192.168.2.10', userAgent: ADMIN_BROWSER, relatedIds: ['al_012'],
    metadata: { amount: 15000, currency: 'XAF', orderId: 'ORD-7823', reason: 'Duplicate charge', refundMethod: 'original_payment', approvalLevel: 'finance' },
  },
  {
    id: 'al_005', timestamp: '2026-07-13T08:05:00Z', actorName: 'Maria Garcia', actorEmail: 'maria.garcia@afribook.com', actorRole: 'admin',
    action: 'promo_create', resourceType: 'promo', resourceId: 'promo_s2k8m',
    description: 'Created "Summer Lagos 2026" promotion — 20% off all restaurant orders over XAF 10,000',
    ipAddress: '192.168.3.45', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { promoCode: 'SUMMER26', discountPercent: 20, minOrderAmount: 10000, currency: 'XAF', targetCountry: 'NG', validFrom: '2026-07-15', validUntil: '2026-08-31', maxUses: 5000 },
  },
  {
    id: 'al_006', timestamp: '2026-07-13T07:40:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'settings_change', resourceType: 'settings', resourceId: 'set_global_01',
    description: 'Updated platform commission rate from 10% to 12% for all new transactions effective August 1st',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { settingKey: 'platform_commission_rate', previousValue: 10, newValue: 12, effectiveDate: '2026-08-01', affectedRegions: ['CM', 'NG', 'KE', 'ZA', 'GH', 'TZ', 'RW', 'UG'] },
  },
  {
    id: 'al_007', timestamp: '2026-07-13T07:15:00Z', actorName: 'Amina Hassan', actorEmail: 'amina.hassan@afribook.com', actorRole: 'support',
    action: 'ticket_resolve', resourceType: 'ticket', resourceId: 'tk_5n8xp',
    description: 'Resolved support ticket #TK-4498 — vendor reporting missing payout for July 1-7 period',
    ipAddress: '10.0.0.42', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { ticketNumber: 'TK-4498', category: 'missing_payout', vendorId: 'vnd_3k7m', payoutPeriod: '2026-07-01 to 2026-07-07', resolution: 'Payout processed manually, added to next cycle', responseTime: '4h 22m' },
  },
  {
    id: 'al_008', timestamp: '2026-07-13T06:50:00Z', actorName: 'Tom Williams', actorEmail: 'tom.williams@afribook.com', actorRole: 'support',
    action: 'kyc_approve', resourceType: 'kyc', resourceId: 'kyc_r4m9p',
    description: 'Approved KYC documents for vendor "Boutique Élégance" — business license, tax ID, and owner ID verified',
    ipAddress: '10.0.0.55', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { businessId: 'biz_9x2km', documents: ['business_license', 'tax_id', 'owner_national_id'], verificationLevel: 'full', expiryDate: '2028-07-13' },
  },
  {
    id: 'al_009', timestamp: '2026-07-13T06:20:00Z', actorName: 'James Okafor', actorEmail: 'james.okafor@afribook.com', actorRole: 'admin',
    action: 'flag_toggle', resourceType: 'flag', resourceId: 'flag_promo_engine',
    description: 'Enabled "Promotions Engine" feature flag for production environment — all regions',
    ipAddress: '192.168.1.22', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { flagName: 'promotions_engine', previousState: false, newState: true, scope: 'global', rolloutPercentage: 100 },
  },
  {
    id: 'al_010', timestamp: '2026-07-13T05:55:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'country_config', resourceType: 'country', resourceId: 'cnt_TZ',
    description: 'Added M-Pesa as a payment method for Tanzania and configured local settlement schedule',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { countryCode: 'TZ', paymentMethod: 'mobile_money', provider: 'M-Pesa', settlementDays: 3, minimumFee: 500, currency: 'TZS' },
  },
  {
    id: 'al_011', timestamp: '2026-07-13T05:30:00Z', actorName: 'Lisa Thompson', actorEmail: 'lisa.thompson@afribook.com', actorRole: 'moderator',
    action: 'dispute_resolve', resourceType: 'dispute', resourceId: 'dsp_7m2kp',
    description: 'Resolved dispute #DSP-0234 in favor of customer — service not rendered as described',
    ipAddress: '10.0.0.88', userAgent: USERS_BROWSER, relatedIds: ['al_004'],
    metadata: { disputeId: 'DSP-0234', paymentId: 'pay_m3x9k2', amount: 25000, currency: 'XAF', outcome: 'customer_favored', refundAmount: 15000, reason: 'Service not rendered' },
  },
  {
    id: 'al_012', timestamp: '2026-07-13T05:00:00Z', actorName: 'Ahmed Ali', actorEmail: 'ahmed.ali@afribook.com', actorRole: 'finance',
    action: 'payment_release_escrow', resourceType: 'payment', resourceId: 'esc_8n3kp',
    description: 'Released escrow hold of XAF 245,000 for completed bulk order #ORD-7800',
    ipAddress: '192.168.2.18', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { escrowId: 'esc_8n3kp', paymentId: 'pay_k9x2m', amount: 245000, currency: 'XAF', orderId: 'ORD-7800', releaseCondition: 'delivery_confirmed' },
  },
  {
    id: 'al_013', timestamp: '2026-07-12T18:20:00Z', actorName: 'Maria Garcia', actorEmail: 'maria.garcia@afribook.com', actorRole: 'admin',
    action: 'campaign_launch', resourceType: 'campaign', resourceId: 'cmp_j4n8m',
    description: 'Launched "Back to School Nairobi" email campaign targeting 12,400 users in Kenya',
    ipAddress: '192.168.3.45', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { campaignName: 'Back to School Nairobi', channel: 'email', audience: 'KE users', audienceSize: 12400, template: 'back_to_school_v2', scheduledSend: '2026-07-14T08:00:00Z' },
  },
  {
    id: 'al_014', timestamp: '2026-07-12T17:45:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'team_invite', resourceType: 'team', resourceId: 'tm_11',
    description: 'Sent team invitation to grace.mensah@afribook.com with moderator role',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { invitedEmail: 'grace.mensah@afribook.com', invitedName: 'Grace Mensah', role: 'moderator', permissions: ['view_users', 'manage_users', 'view_businesses', 'manage_businesses', 'view_support', 'manage_support', 'view_compliance'] },
  },
  {
    id: 'al_015', timestamp: '2026-07-12T17:10:00Z', actorName: 'David Kim', actorEmail: 'david.kim@afribook.com', actorRole: 'finance',
    action: 'plan_update', resourceType: 'plan', resourceId: 'plan_pro',
    description: 'Updated "Pro" vendor plan pricing from XAF 25,000 to XAF 30,000/month',
    ipAddress: '192.168.2.10', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { planName: 'Pro', previousPrice: 25000, newPrice: 30000, currency: 'XAF', effectiveDate: '2026-09-01', existingSubscribers: 'grandfathered' },
  },
  {
    id: 'al_016', timestamp: '2026-07-12T16:40:00Z', actorName: 'Amina Hassan', actorEmail: 'amina.hassan@afribook.com', actorRole: 'support',
    action: 'ticket_escalate', resourceType: 'ticket', resourceId: 'tk_7p2xm',
    description: 'Escalated ticket #TK-4510 to admin level — suspected account takeover on vendor account',
    ipAddress: '10.0.0.42', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { ticketNumber: 'TK-4510', category: 'account_security', vendorId: 'vnd_5m8k', escalationReason: 'Suspected account takeover', severity: 'high', previousAssignee: 'Tom Williams' },
  },
  {
    id: 'al_017', timestamp: '2026-07-12T16:05:00Z', actorName: 'James Okafor', actorEmail: 'james.okafor@afribook.com', actorRole: 'admin',
    action: 'business_suspend', resourceType: 'business', resourceId: 'biz_2x9km',
    description: 'Suspended "QuickFix Repairs" for receiving multiple unresolved complaints about service quality',
    ipAddress: '192.168.1.22', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { businessName: 'QuickFix Repairs', city: 'Douala', countryCode: 'CM', complaintCount: 7, suspensionDuration: '30 days', requiresReview: true },
  },
  {
    id: 'al_018', timestamp: '2026-07-12T15:30:00Z', actorName: 'Tom Williams', actorEmail: 'tom.williams@afribook.com', actorRole: 'support',
    action: 'kyc_approve', resourceType: 'kyc', resourceId: 'kyc_n5m2k',
    description: 'Approved KYC for driver "Emmanuel Toure" — driver license, vehicle registration, and insurance verified',
    ipAddress: '10.0.0.55', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { driverId: 'drv_4x7kp', documents: ['drivers_license', 'vehicle_registration', 'insurance'], vehicleType: 'motorcycle', plateNumber: 'CM-2026-AB-1234' },
  },
  {
    id: 'al_019', timestamp: '2026-07-12T14:55:00Z', actorName: 'Lisa Thompson', actorEmail: 'lisa.thompson@afribook.com', actorRole: 'moderator',
    action: 'content_update', resourceType: 'content', resourceId: 'cnt_blog_042',
    description: 'Updated marketplace listing guidelines blog post with new fee structure information',
    ipAddress: '10.0.0.88', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { contentId: 'blog_042', title: 'Marketplace Listing Guidelines', section: 'Fee Structure', author: 'Marketing Team', version: 3 },
  },
  {
    id: 'al_020', timestamp: '2026-07-12T14:20:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'user_impersonate', resourceType: 'user', resourceId: 'usr_3k9xm',
    description: 'Started impersonation session for user "Aïcha Diallo" to troubleshoot booking flow issue #TK-4489',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: ['al_025'],
    metadata: { targetUserId: 'usr_3k9xm', targetUserName: 'Aïcha Diallo', reason: 'Troubleshoot booking flow', ticketId: 'TK-4489', sessionDuration: '15 minutes' },
  },
  {
    id: 'al_021', timestamp: '2026-07-12T13:45:00Z', actorName: 'David Kim', actorEmail: 'david.kim@afribook.com', actorRole: 'finance',
    action: 'payment_flag', resourceType: 'payment', resourceId: 'pay_r8m2n',
    description: 'Flagged transaction #pay_r8m2n for review — unusual XAF 850,000 single payment from new account',
    ipAddress: '192.168.2.10', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { amount: 850000, currency: 'XAF', flagReason: 'unusual_amount', accountAge: '2 days', previousMaxTransaction: 50000, requiresManualReview: true },
  },
  {
    id: 'al_022', timestamp: '2026-07-12T13:10:00Z', actorName: 'Maria Garcia', actorEmail: 'maria.garcia@afribook.com', actorRole: 'admin',
    action: 'promo_update', resourceType: 'promo', resourceId: 'promo_k2m8n',
    description: 'Updated "Welcome Abroad" promotion — increased referral bonus from XAF 1,000 to XAF 2,500',
    ipAddress: '192.168.3.45', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { promoCode: 'WELCOME_ABROAD', previousBonus: 1000, newBonus: 2500, currency: 'XAF', totalBudget: 5000000, remainingBudget: 3200000 },
  },
  {
    id: 'al_023', timestamp: '2026-07-12T12:35:00Z', actorName: 'Amina Hassan', actorEmail: 'amina.hassan@afribook.com', actorRole: 'support',
    action: 'ticket_assign', resourceType: 'ticket', resourceId: 'tk_9p4xm',
    description: 'Assigned ticket #TK-4502 to Tom Williams — vendor onboarding assistance for Ghana market',
    ipAddress: '10.0.0.42', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { ticketNumber: 'TK-4502', category: 'vendor_onboarding', vendorId: 'vnd_8k2mp', assignedTo: 'Tom Williams', priority: 'medium' },
  },
  {
    id: 'al_024', timestamp: '2026-07-12T12:00:00Z', actorName: 'James Okafor', actorEmail: 'james.okafor@afribook.com', actorRole: 'admin',
    action: 'business_verify', resourceType: 'business', resourceId: 'biz_6x3km',
    description: 'Verified "Nairobi Fresh Market" business documents — all compliance requirements met',
    ipAddress: '192.168.1.22', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { businessName: 'Nairobi Fresh Market', city: 'Nairobi', countryCode: 'KE', documents: ['business_permit', 'KRA_PIN', 'health_certificate'], verificationStatus: 'passed' },
  },
  {
    id: 'al_025', timestamp: '2026-07-12T11:25:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'dispute_escalate', resourceType: 'dispute', resourceId: 'dsp_4m8kp',
    description: 'Escalated dispute #DSP-0229 to super admin review — conflicting evidence from both parties',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: ['al_011'],
    metadata: { disputeId: 'DSP-0229', paymentId: 'pay_n3x8k', amount: 45000, currency: 'XAF', escalationReason: 'Conflicting evidence', evidenceCount: { vendor: 4, customer: 3 } },
  },
  {
    id: 'al_026', timestamp: '2026-07-12T10:50:00Z', actorName: 'Tom Williams', actorEmail: 'tom.williams@afribook.com', actorRole: 'support',
    action: 'user_activate', resourceType: 'user', resourceId: 'usr_5x2km',
    description: 'Reactivated user account after identity verification through video call',
    ipAddress: '10.0.0.55', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { userId: 'usr_5x2km', userName: 'Oluwaseun Adeyemi', previousStatus: 'suspended', verificationMethod: 'video_call', verificationDuration: '8 minutes' },
  },
  {
    id: 'al_027', timestamp: '2026-07-12T10:15:00Z', actorName: 'David Kim', actorEmail: 'david.kim@afribook.com', actorRole: 'finance',
    action: 'plan_create', resourceType: 'plan', resourceId: 'plan_enterprise',
    description: 'Created "Enterprise" plan tier at XAF 150,000/month with priority support and custom integrations',
    ipAddress: '192.168.2.10', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { planName: 'Enterprise', price: 150000, currency: 'XAF', features: ['priority_support', 'custom_integrations', 'dedicated_account_manager', 'advanced_analytics'], trialDays: 14 },
  },
  {
    id: 'al_028', timestamp: '2026-07-12T09:40:00Z', actorName: 'Lisa Thompson', actorEmail: 'lisa.thompson@afribook.com', actorRole: 'moderator',
    action: 'promo_delete', resourceType: 'promo', resourceId: 'promo_x7m2n',
    description: 'Deleted expired "Ramadan Special" promotion — budget fully utilized with 3,200 redemptions',
    ipAddress: '10.0.0.88', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { promoCode: 'RAMADAN26', totalRedemptions: 3200, totalBudget: 5000000, utilizedBudget: 5000000, currency: 'XAF' },
  },
  {
    id: 'al_029', timestamp: '2026-07-12T09:05:00Z', actorName: 'Maria Garcia', actorEmail: 'maria.garcia@afribook.com', actorRole: 'admin',
    action: 'content_publish', resourceType: 'content', resourceId: 'cnt_email_089',
    description: 'Published monthly newsletter template "July Digest" for all active vendors',
    ipAddress: '192.168.3.45', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { contentId: 'email_089', title: 'July Digest', type: 'newsletter_template', audience: 'all_active_vendors', audienceSize: 7070, scheduledDate: '2026-07-15' },
  },
  {
    id: 'al_030', timestamp: '2026-07-12T08:30:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'country_config', resourceType: 'country', resourceId: 'cnt_RW',
    description: 'Updated Rwanda platform settings — enabled QR code bookings and adjusted minimum transaction fee to XAF 200',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { countryCode: 'RW', changes: { qrBookingEnabled: true, minimumFee: 200, currency: 'RWF' }, previousMinimumFee: 500 },
  },
  {
    id: 'al_031', timestamp: '2026-07-12T07:55:00Z', actorName: 'Amina Hassan', actorEmail: 'amina.hassan@afribook.com', actorRole: 'support',
    action: 'kyc_reject', resourceType: 'kyc', resourceId: 'kyc_p3m8n',
    description: 'Rejected KYC submission for "Sunset Hotel" — health certificate expired, requested renewal',
    ipAddress: '10.0.0.42', userAgent: USERS_BROWSER, relatedIds: [],
    metadata: { businessId: 'biz_7x2km', businessName: 'Sunset Hotel', rejectedDocument: 'health_certificate', rejectionReason: 'Document expired on 2026-06-30', resubmissionDeadline: '2026-08-12' },
  },
  {
    id: 'al_032', timestamp: '2026-07-12T07:20:00Z', actorName: 'James Okafor', actorEmail: 'james.okafor@afribook.com', actorRole: 'admin',
    action: 'campaign_pause', resourceType: 'campaign', resourceId: 'cmp_m2k8n',
    description: 'Paused "Weekend Deals Douala" campaign due to vendor reporting incorrect pricing',
    ipAddress: '192.168.1.22', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { campaignName: 'Weekend Deals Douala', reason: 'Vendor pricing error', affectedVendors: 3, emailsSent: 1200, emailsOpened: 480, pauseReason: 'Pricing correction needed' },
  },
  {
    id: 'al_033', timestamp: '2026-07-11T18:45:00Z', actorName: 'Sarah Chen', actorEmail: 'sarah.chen@afribook.com', actorRole: 'super_admin',
    action: 'settings_change', resourceType: 'settings', resourceId: 'set_security_01',
    description: 'Enabled mandatory two-factor authentication for all admin accounts with roles above support',
    ipAddress: '192.168.1.15', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { settingKey: 'admin_2fa_mandatory', affectedRoles: ['admin', 'super_admin'], gracePeriod: '14 days', enforcementDate: '2026-07-26', affectedUsers: 4 },
  },
  {
    id: 'al_034', timestamp: '2026-07-11T17:30:00Z', actorName: 'Maria Garcia', actorEmail: 'maria.garcia@afribook.com', actorRole: 'admin',
    action: 'team_role_change', resourceType: 'team', resourceId: 'tm_5',
    description: 'Changed Lisa Thompson role from support to moderator based on performance review',
    ipAddress: '192.168.3.45', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { targetUser: 'Lisa Thompson', previousRole: 'support', newRole: 'moderator', reason: 'Performance review — Q2 2026', effectiveImmediately: true },
  },
  {
    id: 'al_035', timestamp: '2026-07-11T16:15:00Z', actorName: 'David Kim', actorEmail: 'david.kim@afribook.com', actorRole: 'finance',
    action: 'payment_refund', resourceType: 'payment', resourceId: 'pay_j4n8m',
    description: 'Processed XAF 32,000 goodwill refund for loyalty customer — service delay exceeding 2 hours',
    ipAddress: '192.168.2.10', userAgent: ADMIN_BROWSER, relatedIds: [],
    metadata: { amount: 32000, currency: 'XAF', orderId: 'ORD-7845', reason: 'Goodwill — service delay', customerTier: 'loyalty_gold', approvalLevel: 'finance', delayMinutes: 135 },
  },
]

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [actorFilter, setActorFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const perPage = 15

  const allActors = Array.from(new Set(MOCK_AUDIT_LOGS.map((l) => l.actorName)))
  const allActions = Array.from(new Set(MOCK_AUDIT_LOGS.map((l) => l.action))).sort()
  const allRoles = Array.from(new Set(MOCK_AUDIT_LOGS.map((l) => l.actorRole))).sort()

  const filtered = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((log) => {
      if (actorFilter !== 'all' && log.actorName !== actorFilter) return false
      if (roleFilter !== 'all' && log.actorRole !== roleFilter) return false
      if (actionFilter !== 'all' && log.action !== actionFilter) return false
      if (resourceFilter !== 'all' && log.resourceType !== resourceFilter) return false
      if (dateFrom && new Date(log.timestamp) < new Date(dateFrom)) return false
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(log.timestamp) > to) return false
      }
      if (search) {
        const q = search.toLowerCase()
        return (
          log.description.toLowerCase().includes(q) ||
          log.resourceId.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          log.actorEmail.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, actorFilter, roleFilter, actionFilter, resourceFilter, dateFrom, dateTo])

  const paged = filtered.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const statTotal = MOCK_AUDIT_LOGS.length
  const statToday = MOCK_AUDIT_LOGS.filter((l) => {
    const d = new Date(l.timestamp)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length
  const statUniqueActors = new Set(MOCK_AUDIT_LOGS.map((l) => l.actorName)).size
  const statUniqueActions = new Set(MOCK_AUDIT_LOGS.map((l) => l.action)).size

  const handleExport = () => {
    const csv = [
      'Timestamp,Actor,Email,Role,Action,Resource Type,Resource ID,Description,IP Address,User Agent',
      ...filtered.map((l) =>
        `"${l.timestamp}","${l.actorName}","${l.actorEmail}","${l.actorRole}","${ACTION_LABELS[l.action]}","${l.resourceType}","${l.resourceId}","${l.description.replace(/"/g, '""')}","${l.ipAddress}","${l.userAgent}"`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRelatedLogs = (log: AuditEntry) => {
    if (log.relatedIds.length === 0) return []
    return MOCK_AUDIT_LOGS.filter((l) => log.relatedIds.includes(l.id))
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Audit Logs</h1>
        <p className="text-sm text-text-secondary mt-1">Complete audit trail of all admin actions across the platform.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Events" value={statTotal} icon={FileText} accent="bg-amber-500" />
        <AdminStatCard label="Today's Events" value={statToday} icon={Clock} accent="bg-blue-500" />
        <AdminStatCard label="Unique Actors" value={statUniqueActors} icon={Users} accent="bg-emerald-500" />
        <AdminStatCard label="Action Types" value={statUniqueActions} icon={Shield} accent="bg-purple-500" />
      </motion.div>

      <motion.div variants={ITEM}>
        <div className="rounded-2xl bg-surface border border-border">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Clock className="w-3.5 h-3.5" />
                {filtered.length} entries
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={actorFilter}
                onChange={(e) => { setActorFilter(e.target.value); setPage(0) }}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Actors</option>
                {allActors.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Roles</option>
                {allRoles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0) }}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Actions</option>
                {allActions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>)}
              </select>
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(0) }}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Resources</option>
                {RESOURCE_TYPES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0) }}
                placeholder="From"
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0) }}
                placeholder="To"
                className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Actor</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Action</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden lg:table-cell">Resource</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden xl:table-cell">Description</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden xl:table-cell">IP Address</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((log) => {
                  const Icon = ACTION_ICONS[log.resourceType] ?? Shield
                  const isExpanded = expandedId === log.id
                  const actionColor = log.action.includes('suspend') || log.action.includes('reject') || log.action.includes('escalate') || log.action.includes('remove')
                    ? 'text-red-600'
                    : log.action.includes('approve') || log.action.includes('resolve') || log.action.includes('activate')
                    ? 'text-emerald-600'
                    : log.action.includes('create') || log.action.includes('launch') || log.action.includes('invite')
                    ? 'text-blue-600'
                    : 'text-amber-600'

                  return (
                    <tr key={log.id} className={cn('border-b border-border-light transition-colors', isExpanded ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/50')}>
                      <td className="px-4 py-3">
                        <p className="text-xs text-text-tertiary whitespace-nowrap">{formatDate(log.timestamp, 'MMM d, HH:mm')}</p>
                        <p className="text-[10px] text-text-tertiary/60 mt-0.5">{timeAgo(log.timestamp)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-text-primary whitespace-nowrap">{log.actorName}</p>
                        <p className="text-[10px] text-text-tertiary md:hidden">{log.actorRole.replace('_', ' ')}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn(
                          'inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize',
                          log.actorRole === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : log.actorRole === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : log.actorRole === 'finance' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : log.actorRole === 'moderator' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        )}>
                          {log.actorRole.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-4 h-4 shrink-0', actionColor)} />
                          <span className={cn('text-xs font-medium whitespace-nowrap', actionColor)}>
                            {ACTION_LABELS[log.action]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <code className="text-xs font-mono text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">{log.resourceId}</code>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className="text-xs text-text-secondary truncate max-w-xs">{log.description}</p>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <code className="text-xs font-mono text-text-tertiary">{log.ipAddress}</code>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="p-1.5 rounded-lg hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {paged.length === 0 && (
            <div className="px-4 py-16 text-center text-text-tertiary">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>No audit logs found matching your filters</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-text-tertiary">
                Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="w-7 h-7 rounded-lg text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i
                  } else if (page < 3) {
                    pageNum = i
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 7 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                        page === pageNum ? 'bg-amber-500 text-white' : 'text-text-secondary hover:bg-surface-secondary'
                      )}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-7 h-7 rounded-lg text-text-secondary hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Expanded Detail Panel */}
      <AnimatePresence>
        {expandedId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const log = MOCK_AUDIT_LOGS.find((l) => l.id === expandedId)
              if (!log) return null
              const relatedLogs = getRelatedLogs(log)
              const Icon = ACTION_ICONS[log.resourceType] ?? Shield
              return (
                <div className="rounded-2xl bg-surface border border-border p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary font-heading">{ACTION_LABELS[log.action]}</h3>
                        <p className="text-sm text-text-secondary mt-1">{log.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                          <span>{formatDate(log.timestamp, 'PPP p')}</span>
                          <span>by <span className="font-medium text-text-secondary">{log.actorName}</span></span>
                          <span className="font-mono">{log.resourceId}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors shrink-0"
                    >
                      <X className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Actor</p>
                      <p className="text-sm font-medium text-text-primary">{log.actorName}</p>
                      <p className="text-xs text-text-tertiary">{log.actorEmail}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">IP Address</p>
                      <p className="text-sm font-mono text-text-primary">{log.ipAddress}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Resource</p>
                      <p className="text-sm font-medium text-text-primary capitalize">{log.resourceType}</p>
                      <p className="text-xs font-mono text-text-tertiary">{log.resourceId}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">User Agent</p>
                      <p className="text-xs text-text-tertiary truncate" title={log.userAgent}>{log.userAgent}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Metadata</h4>
                    <div className="p-4 rounded-xl bg-surface-secondary overflow-x-auto">
                      <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {relatedLogs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3">Related Events</h4>
                      <div className="space-y-2">
                        {relatedLogs.map((rel) => {
                          const RelIcon = ACTION_ICONS[rel.resourceType] ?? Shield
                          return (
                            <div key={rel.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                              <RelIcon className="w-4 h-4 text-text-tertiary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-text-primary">{ACTION_LABELS[rel.action]}</p>
                                <p className="text-[10px] text-text-tertiary truncate">{rel.description}</p>
                              </div>
                              <span className="text-[10px] text-text-tertiary whitespace-nowrap">{timeAgo(rel.timestamp)}</span>
                              <button
                                onClick={() => setExpandedId(rel.id)}
                                className="text-[10px] text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
                              >
                                View
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
