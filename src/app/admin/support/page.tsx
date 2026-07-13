'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, timeAgo } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import TicketDetail from '@/components/admin/TicketDetail'
import {
  Ticket, Clock, CheckCircle, Star, AlertTriangle, ArrowUpDown,
  Search, Filter, SortAsc, MessageSquare, User, ChevronDown,
  ChevronRight, Paperclip, X, Calendar,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type TicketPriority = 'critical' | 'high' | 'medium' | 'low'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketCategory = 'billing' | 'technical' | 'account' | 'dispute' | 'general'

interface TicketMessage {
  id: string
  ticketId: string
  author: string
  role: 'customer' | 'agent'
  body: string
  isInternalNote: boolean
  attachments: string[]
  createdAt: string
}

interface SupportTicket {
  id: string
  subject: string
  customer: { name: string; email: string; phone: string }
  priority: TicketPriority
  status: TicketStatus
  category: TicketCategory
  assignedAgent: string | null
  messages: TicketMessage[]
  createdAt: string
  lastUpdated: string
  lastReplyAt: string
}

const AGENTS = ['Chidi Okonkwo', 'Amina Diallo', 'James Mwangi', 'Grace Ochieng', 'Fatima Issa']

const CATEGORIES: TicketCategory[] = ['billing', 'technical', 'account', 'dispute', 'general']

const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low']

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-7842',
    subject: 'Payment deducted but booking not confirmed',
    customer: { name: 'Chinemere Okafor', email: 'chinemere.o@example.com', phone: '+234 812 345 6789' },
    priority: 'critical',
    status: 'open',
    category: 'billing',
    assignedAgent: 'Chidi Okonkwo',
    createdAt: '2026-07-13T08:23:00Z',
    lastUpdated: '2026-07-13T10:45:00Z',
    lastReplyAt: '2026-07-13T10:45:00Z',
    messages: [
      { id: 'm1', ticketId: 'TKT-7842', author: 'Chinemere Okafor', role: 'customer', body: 'I booked a service on AfriBook and the payment of XAF 25,000 was deducted from my mobile money. The booking status still shows "pending" and the vendor says they haven\'t received any confirmation. I need this resolved urgently.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T08:23:00Z' },
      { id: 'm2', ticketId: 'TKT-7842', author: 'Chidi Okonkwo', role: 'agent', body: 'I can see the payment went through on our end (transaction ID: PAY-4A28F). Let me check with the escrow service to see why it hasn\'t released to the vendor. I\'ll escalate to the payments team.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T09:15:00Z' },
      { id: 'm3', ticketId: 'TKT-7842', author: 'Chidi Okonkwo', role: 'agent', body: 'This looks like the same issue as TKT-7791. The escrow webhook failed to fire. I\'ve manually triggered the release. Waiting for confirmation.', isInternalNote: true, attachments: [], createdAt: '2026-07-13T09:30:00Z' },
      { id: 'm4', ticketId: 'TKT-7842', author: 'Chinemere Okafor', role: 'customer', body: 'Has there been any update? The booking is still pending. I\'m worried I\'ve lost my money.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T10:00:00Z' },
      { id: 'm5', ticketId: 'TKT-7842', author: 'Chidi Okonkwo', role: 'agent', body: 'I\'ve just confirmed the escrow release has gone through. The vendor should see the funds within 30 minutes. Can you check your booking status again in about 15 minutes and let me know? I apologise for the delay.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T10:45:00Z' },
    ],
  },
  {
    id: 'TKT-7841',
    subject: 'Delivery driver never arrived - order #ORD-8932',
    customer: { name: 'Temitope Adeyemi', email: 'temitope.a@example.com', phone: '+234 803 987 6543' },
    priority: 'high',
    status: 'in_progress',
    category: 'general',
    assignedAgent: 'James Mwangi',
    createdAt: '2026-07-12T14:30:00Z',
    lastUpdated: '2026-07-13T09:12:00Z',
    lastReplyAt: '2026-07-13T09:12:00Z',
    messages: [
      { id: 'm6', ticketId: 'TKT-7841', author: 'Temitope Adeyemi', role: 'customer', body: 'I placed an order for food delivery at 12:30pm. The estimated delivery was 45 minutes. It\'s now 3pm and the driver marked it as delivered but I never received anything. No one called me. This is unacceptable.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T14:30:00Z' },
      { id: 'm7', ticketId: 'TKT-7841', author: 'James Mwangi', role: 'agent', body: 'I\'ve checked the GPS tracking for this delivery. The driver\'s GPS shows they were at a different address at the time of marking delivery. I\'ve flagged the driver for review and initiated a re-delivery.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T16:00:00Z' },
      { id: 'm8', ticketId: 'TKT-7841', author: 'James Mwangi', role: 'agent', body: 'Driver admitted to delivering to the wrong house. Restaurant is preparing a fresh order. I\'ve escalated the driver\'s account for review - this is their third misdelivery.', isInternalNote: true, attachments: [], createdAt: '2026-07-13T08:00:00Z' },
      { id: 'm9', ticketId: 'TKT-7841', author: 'Temitope Adeyemi', role: 'customer', body: 'I appreciate the response but I need a timeline. When will the new order arrive? Also I want a refund of the delivery fee.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T09:00:00Z' },
      { id: 'm10', ticketId: 'TKT-7841', author: 'James Mwangi', role: 'agent', body: 'The replacement order is being prepared now. I\'ve issued a full refund for the delivery fee and added a XAF 2,000 credit to your wallet for the inconvenience. You should receive a tracking link within 30 minutes.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T09:12:00Z' },
    ],
  },
  {
    id: 'TKT-7840',
    subject: 'Account suspended without warning',
    customer: { name: 'Akinyi Otieno', email: 'akinyi.o@example.com', phone: '+254 712 345 678' },
    priority: 'critical',
    status: 'open',
    category: 'account',
    assignedAgent: null,
    createdAt: '2026-07-13T11:00:00Z',
    lastUpdated: '2026-07-13T11:00:00Z',
    lastReplyAt: '2026-07-13T11:00:00Z',
    messages: [
      { id: 'm11', ticketId: 'TKT-7840', author: 'Akinyi Otieno', role: 'customer', body: 'I woke up this morning to find my account has been suspended. I run a small catering business on AfriBook and have 20+ pending orders I cannot fulfil. I have not received any email or notification about why this happened. Please reinstate my account immediately.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T11:00:00Z' },
    ],
  },
  {
    id: 'TKT-7839',
    subject: 'Double charged for same ride',
    customer: { name: 'Emeka Nwosu', email: 'emeka.n@example.com', phone: '+234 809 123 4567' },
    priority: 'high',
    status: 'in_progress',
    category: 'billing',
    assignedAgent: 'Amina Diallo',
    createdAt: '2026-07-12T18:45:00Z',
    lastUpdated: '2026-07-13T08:30:00Z',
    lastReplyAt: '2026-07-13T08:30:00Z',
    messages: [
      { id: 'm12', ticketId: 'TKT-7839', author: 'Emeka Nwosu', role: 'customer', body: 'I took a ride from Ikeja to VI this morning. The total fare was XAF 4,500 but I see two deductions on my mobile money - one at 8:15am and another at 8:17am, both for XAF 4,500. That\'s XAF 9,000 total.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T18:45:00Z' },
      { id: 'm13', ticketId: 'TKT-7839', author: 'Amina Diallo', role: 'agent', body: 'I can confirm there are two identical payment attempts for ride #RD-7721. The second one appears to be a retry that should have been cancelled. I\'ve initiated a refund for the duplicate payment and escalated to the payments team to investigate the retry logic.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T20:00:00Z' },
      { id: 'm14', ticketId: 'TKT-7839', author: 'Amina Diallo', role: 'agent', body: 'The duplicate charge refund has been processed. It should reflect in the customer\'s mobile money within 24 hours. Flagging this as a possible payment gateway issue - similar pattern to TKT-7712.', isInternalNote: true, attachments: [], createdAt: '2026-07-12T20:15:00Z' },
      { id: 'm15', ticketId: 'TKT-7839', author: 'Emeka Nwosu', role: 'customer', body: 'Thank you. How long will the refund take? I need the money to pay for my return trip tomorrow.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T08:00:00Z' },
      { id: 'm16', ticketId: 'TKT-7839', author: 'Amina Diallo', role: 'agent', body: 'The refund has been initiated on our side. Mobile money refunds typically take 2-24 hours depending on your provider (MTN). I\'ll follow up in 4 hours to confirm it has arrived. If it hasn\'t reflected by morning, I\'ll escalate for an expedited manual reversal.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T08:30:00Z' },
    ],
  },
  {
    id: 'TKT-7838',
    subject: 'Vendor not responding to booking request',
    customer: { name: 'Nkechi Eze', email: 'nkechi.e@example.com', phone: '+234 706 789 0123' },
    priority: 'medium',
    status: 'open',
    category: 'dispute',
    assignedAgent: null,
    createdAt: '2026-07-13T07:00:00Z',
    lastUpdated: '2026-07-13T07:00:00Z',
    lastReplyAt: '2026-07-13T07:00:00Z',
    messages: [
      { id: 'm17', ticketId: 'TKT-7838', author: 'Nkechi Eze', role: 'customer', body: 'I sent a booking request to "Lagos Luxury Hair Studio" 3 days ago for a braiding appointment this Friday. They haven\'t responded at all. I\'ve tried calling their listed number and it goes straight to voicemail. Can you help contact them or cancel the booking request so I can book elsewhere?', isInternalNote: false, attachments: [], createdAt: '2026-07-13T07:00:00Z' },
    ],
  },
  {
    id: 'TKT-7837',
    subject: 'Refund not processed after cancellation',
    customer: { name: 'Kofi Mensah', email: 'kofi.m@example.com', phone: '+233 544 321 987' },
    priority: 'high',
    status: 'in_progress',
    category: 'billing',
    assignedAgent: 'Grace Ochieng',
    createdAt: '2026-07-11T16:20:00Z',
    lastUpdated: '2026-07-13T06:45:00Z',
    lastReplyAt: '2026-07-13T06:45:00Z',
    messages: [
      { id: 'm18', ticketId: 'TKT-7837', author: 'Kofi Mensah', role: 'customer', body: 'I cancelled my booking (BKG-4521) for a photography service within the free cancellation window - 48 hours before the appointment. The vendor confirmed the cancellation but said the refund has to come from AfriBook. It\'s been 5 days and I haven\'t received my XAF 35,000.', isInternalNote: false, attachments: [], createdAt: '2026-07-11T16:20:00Z' },
      { id: 'm19', ticketId: 'TKT-7837', author: 'Grace Ochieng', role: 'agent', body: 'I\'ve checked the booking. It was cancelled within the free cancellation window, so you\'re entitled to a full refund. The refund appears stuck in our payment queue. Let me force it through.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T10:00:00Z' },
      { id: 'm20', ticketId: 'TKT-7837', author: 'Grace Ochieng', role: 'agent', body: 'After further investigation, the refund can\'t be automatically processed because the payment was made via bank transfer. I\'ve submitted a manual refund request to our finance team (REF-2026-00451).', isInternalNote: true, attachments: [], createdAt: '2026-07-12T10:30:00Z' },
      { id: 'm21', ticketId: 'TKT-7837', author: 'Kofi Mensah', role: 'customer', body: 'It\'s been another full day. Can you check on the status of the manual refund?', isInternalNote: false, attachments: [], createdAt: '2026-07-13T06:00:00Z' },
      { id: 'm22', ticketId: 'TKT-7837', author: 'Grace Ochieng', role: 'agent', body: 'I\'ve followed up with finance and they\'ve confirmed the manual transfer will be processed today. You should see XAF 35,000 in your bank account within 1-2 business days. I\'m adding a XAF 5,000 goodwill credit to your wallet for the delay.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T06:45:00Z' },
    ],
  },
  {
    id: 'TKT-7836',
    subject: 'Wrong items delivered - food order',
    customer: { name: 'Zainab Hassan', email: 'zainab.h@example.com', phone: '+254 723 456 789' },
    priority: 'medium',
    status: 'resolved',
    category: 'general',
    assignedAgent: 'James Mwangi',
    createdAt: '2026-07-10T12:15:00Z',
    lastUpdated: '2026-07-11T14:30:00Z',
    lastReplyAt: '2026-07-11T14:30:00Z',
    messages: [
      { id: 'm23', ticketId: 'TKT-7836', author: 'Zainab Hassan', role: 'customer', body: 'Order #ORD-8890 from "Nyama Choma Palace" was delivered but I received ugali and kuku instead of the nyama choma and chapati I ordered. The bill is wrong too - they charged me for the more expensive items.', isInternalNote: false, attachments: [], createdAt: '2026-07-10T12:15:00Z' },
      { id: 'm24', ticketId: 'TKT-7836', author: 'James Mwangi', role: 'agent', body: 'Confirmed with the restaurant - they mixed up two orders. They\'re preparing the correct order now and will send a rider to swap it out. The incorrect charge will be reversed.', isInternalNote: false, attachments: [], createdAt: '2026-07-10T14:00:00Z' },
      { id: 'm25', ticketId: 'TKT-7836', author: 'Zainab Hassan', role: 'customer', body: 'The correct order arrived. Thank you for sorting it out quickly.', isInternalNote: false, attachments: [], createdAt: '2026-07-11T14:00:00Z' },
      { id: 'm26', ticketId: 'TKT-7836', author: 'James Mwangi', role: 'agent', body: 'Closing ticket. Customer confirmed resolution.', isInternalNote: true, attachments: [], createdAt: '2026-07-11T14:30:00Z' },
    ],
  },
  {
    id: 'TKT-7835',
    subject: 'Can\'t reset password - account recovery',
    customer: { name: 'Kwame Asante', email: 'kwame.a@example.com', phone: '+233 502 111 222' },
    priority: 'low',
    status: 'closed',
    category: 'technical',
    assignedAgent: 'Chidi Okonkwo',
    createdAt: '2026-07-09T09:00:00Z',
    lastUpdated: '2026-07-10T11:20:00Z',
    lastReplyAt: '2026-07-10T11:20:00Z',
    messages: [
      { id: 'm27', ticketId: 'TKT-7835', author: 'Kwame Asante', role: 'customer', body: 'I\'ve been trying to reset my password for 3 days. The reset email never arrives. I\'ve checked spam folder. I\'m locked out of my account and have bookings I need to manage.', isInternalNote: false, attachments: [], createdAt: '2026-07-09T09:00:00Z' },
      { id: 'm28', ticketId: 'TKT-7835', author: 'Chidi Okonkwo', role: 'agent', body: 'I\'ve manually triggered the password reset on our end. The email provider had rate-limited your account due to multiple reset attempts. Try again now and use the link within 30 minutes.', isInternalNote: false, attachments: [], createdAt: '2026-07-09T10:30:00Z' },
      { id: 'm29', ticketId: 'TKT-7835', author: 'Kwame Asante', role: 'customer', body: 'It worked! I\'m back in. Thank you.', isInternalNote: false, attachments: [], createdAt: '2026-07-10T11:00:00Z' },
    ],
  },
  {
    id: 'TKT-7834',
    subject: 'Escrow funds not released to vendor',
    customer: { name: 'Aisha Bello', email: 'aisha.b@example.com', phone: '+234 815 678 9012' },
    priority: 'high',
    status: 'in_progress',
    category: 'dispute',
    assignedAgent: 'Grace Ochieng',
    createdAt: '2026-07-11T10:30:00Z',
    lastUpdated: '2026-07-12T16:00:00Z',
    lastReplyAt: '2026-07-12T16:00:00Z',
    messages: [
      { id: 'm30', ticketId: 'TKT-7834', author: 'Aisha Bello', role: 'customer', body: 'As a vendor, I completed a service 7 days ago (BKG-4487). The customer confirmed completion but the escrow funds (XAF 50,000) have not been released to my account. I have bills to pay. This is affecting my livelihood.', isInternalNote: false, attachments: [], createdAt: '2026-07-11T10:30:00Z' },
      { id: 'm31', ticketId: 'TKT-7834', author: 'Grace Ochieng', role: 'agent', body: 'The customer\'s confirmation was recorded but the escrow release was stuck due to a settlement batch error. I\'ve manually released the funds now. You should receive the payment within 24 hours.', isInternalNote: false, attachments: [], createdAt: '2026-07-11T14:00:00Z' },
      { id: 'm32', ticketId: 'TKT-7834', author: 'Grace Ochieng', role: 'agent', body: 'Funds still haven\'t moved. Our settlement provider had a processing delay. Chasing the payments team for a manual transfer.', isInternalNote: true, attachments: [], createdAt: '2026-07-12T09:00:00Z' },
      { id: 'm33', ticketId: 'TKT-7834', author: 'Grace Ochieng', role: 'agent', body: 'I\'ve confirmed with finance that the settlement was processed this morning. The funds should reflect in your bank account within 1-2 business days. I\'ve added XAF 10,000 compensation credit to your account for the delay.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T16:00:00Z' },
    ],
  },
  {
    id: 'TKT-7833',
    subject: 'App crashes when uploading profile photo',
    customer: { name: 'Oluwaseun Babatunde', email: 'seun.b@example.com', phone: '+234 802 456 7890' },
    priority: 'low',
    status: 'closed',
    category: 'technical',
    assignedAgent: 'Amina Diallo',
    createdAt: '2026-07-08T15:45:00Z',
    lastUpdated: '2026-07-09T12:00:00Z',
    lastReplyAt: '2026-07-09T12:00:00Z',
    messages: [
      { id: 'm34', ticketId: 'TKT-7833', author: 'Oluwaseun Babatunde', role: 'customer', body: 'Every time I try to upload a profile photo from my gallery, the app crashes immediately. I\'m on Android 14, Samsung Galaxy S24. I\'ve cleared cache and reinstalled the app but the issue persists.', isInternalNote: false, attachments: [], createdAt: '2026-07-08T15:45:00Z' },
      { id: 'm35', ticketId: 'TKT-7833', author: 'Amina Diallo', role: 'agent', body: 'We\'ve identified a bug in the image compression library on Android 14. A fix has been deployed in version 3.2.1. Please update the app from the Play Store and try again.', isInternalNote: false, attachments: [], createdAt: '2026-07-09T10:00:00Z' },
      { id: 'm36', ticketId: 'TKT-7833', author: 'Oluwaseun Babatunde', role: 'customer', body: 'Updated the app and the issue is fixed. Profile photo uploaded successfully.', isInternalNote: false, attachments: [], createdAt: '2026-07-09T11:45:00Z' },
    ],
  },
  {
    id: 'TKT-7832',
    subject: 'Unable to link bank account for payouts',
    customer: { name: 'Fatima Usman', email: 'fatima.u@example.com', phone: '+234 708 234 5678' },
    priority: 'medium',
    status: 'open',
    category: 'technical',
    assignedAgent: null,
    createdAt: '2026-07-13T09:30:00Z',
    lastUpdated: '2026-07-13T09:30:00Z',
    lastReplyAt: '2026-07-13T09:30:00Z',
    messages: [
      { id: 'm37', ticketId: 'TKT-7832', author: 'Fatima Usman', role: 'customer', body: 'I\'m trying to set up my payout account as a vendor. I enter my bank details (GTBank, account number 0123456789) and it says "verification failed". I\'ve tried 5 times. My BVN is linked to this account so I don\'t understand why it\'s failing.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T09:30:00Z' },
    ],
  },
  {
    id: 'TKT-7831',
    subject: 'Customer disputes service quality - wants partial refund',
    customer: { name: 'Blessing Adekunle', email: 'blessing.a@example.com', phone: '+234 903 876 5432' },
    priority: 'medium',
    status: 'in_progress',
    category: 'dispute',
    assignedAgent: 'Fatima Issa',
    createdAt: '2026-07-12T11:00:00Z',
    lastUpdated: '2026-07-13T08:15:00Z',
    lastReplyAt: '2026-07-13T08:15:00Z',
    messages: [
      { id: 'm38', ticketId: 'TKT-7831', author: 'Blessing Adekunle', role: 'customer', body: 'I booked a makeup artist for my wedding (BKG-4510) and paid XAF 80,000 upfront. The service was substandard - the artist arrived 2 hours late and the makeup was not what was agreed. The vendor refuses to refund anything. I want at least a 50% refund.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T11:00:00Z' },
      { id: 'm39', ticketId: 'TKT-7831', author: 'Fatima Issa', role: 'agent', body: 'I\'ve reviewed the before/after photos you uploaded and the service agreement. There\'s a clear mismatch. I\'ve contacted the vendor to negotiate a 50% refund. They\'re pushing back but our terms support a partial refund in cases of significant service deviation.', isInternalNote: false, attachments: [], createdAt: '2026-07-12T15:00:00Z' },
      { id: 'm40', ticketId: 'TKT-7831', author: 'Fatima Issa', role: 'agent', body: 'After escalating to our compliance team, we can force a 40% refund under our quality guarantee policy. Customer agreed to 40% as a compromise. Processing now.', isInternalNote: true, attachments: [], createdAt: '2026-07-13T08:00:00Z' },
      { id: 'm41', ticketId: 'TKT-7831', author: 'Blessing Adekunle', role: 'customer', body: 'I\'ve accepted the 40% refund offer. Thank you for helping resolve this.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T08:15:00Z' },
    ],
  },
  {
    id: 'TKT-7830',
    subject: 'Ride fare much higher than estimate',
    customer: { name: 'Joseph Kamau', email: 'joseph.k@example.com', phone: '+254 738 901 234' },
    priority: 'low',
    status: 'open',
    category: 'billing',
    assignedAgent: null,
    createdAt: '2026-07-13T06:45:00Z',
    lastUpdated: '2026-07-13T06:45:00Z',
    lastReplyAt: '2026-07-13T06:45:00Z',
    messages: [
      { id: 'm42', ticketId: 'TKT-7830', author: 'Joseph Kamau', role: 'customer', body: 'The app estimated my ride from Westlands to Nairobi CBD at KES 450. I was charged KES 1,200. The driver said there was "surge pricing" but the app never showed me a surge multiplier before I confirmed the ride. This feels like price manipulation.', isInternalNote: false, attachments: [], createdAt: '2026-07-13T06:45:00Z' },
    ],
  },
]

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const CATEGORY_STYLES: Record<TicketCategory, string> = {
  billing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  technical: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  account: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  dispute: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  general: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default function AdminSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'status'>('updated')
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const openTickets = MOCK_TICKETS.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  const escalatedTickets = MOCK_TICKETS.filter((t) => t.priority === 'critical').length
  const resolvedToday = MOCK_TICKETS.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  const filteredTickets = useMemo(() => {
    let result = [...MOCK_TICKETS]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.customer.name.toLowerCase().includes(q) ||
          t.customer.email.toLowerCase().includes(q),
      )
    }

    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter)
    if (priorityFilter !== 'all') result = result.filter((t) => t.priority === priorityFilter)
    if (categoryFilter !== 'all') result = result.filter((t) => t.category === categoryFilter)
    if (agentFilter !== 'all') result = result.filter((t) => t.assignedAgent === agentFilter || (agentFilter === 'unassigned' && !t.assignedAgent))

    result.sort((a, b) => {
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'updated') return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      if (sortBy === 'priority') {
        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[a.priority] - order[b.priority]
      }
      const sOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, closed: 3 }
      return sOrder[a.status] - sOrder[b.status]
    })

    return result
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, agentFilter, sortBy])

  const handleAction = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAssignAgent = (ticketId: string, agent: string) => {
    handleAction(`Ticket ${ticketId} assigned to ${agent}`)
  }

  const handleChangeStatus = (ticketId: string, status: TicketStatus) => {
    handleAction(`Ticket ${ticketId} status changed to ${status.replace('_', ' ')}`)
  }

  const handleChangePriority = (ticketId: string, priority: TicketPriority) => {
    handleAction(`Ticket ${ticketId} priority changed to ${priority}`)
  }

  const handleEscalate = (ticketId: string) => {
    handleAction(`Ticket ${ticketId} escalated to senior support`)
  }

  const handleClose = (ticketId: string) => {
    handleAction(`Ticket ${ticketId} closed`)
  }

  const handleMerge = (ticketId: string) => {
    handleAction(`Merge initiated for ${ticketId}`)
  }

  const handleSendReply = (ticketId: string, message: string, isInternal: boolean) => {
    handleAction(isInternal ? 'Internal note added' : 'Reply sent')
  }

  if (selectedTicket) {
    return (
      <TicketDetail
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onAssign={handleAssignAgent}
        onStatusChange={handleChangeStatus}
        onPriorityChange={handleChangePriority}
        onEscalate={handleEscalate}
        onClose={handleClose}
        onMerge={handleMerge}
        onSendReply={handleSendReply}
        agents={AGENTS}
      />
    )
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Support Center</h1>
        <p className="text-sm text-text-secondary mt-1">Manage customer tickets, track resolution, and monitor support performance.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdminStatCard label="Open Tickets" value={openTickets} icon={Ticket} change={8.3} accent="bg-blue-500" />
        <AdminStatCard label="Avg Response Time" value="4.2h" icon={Clock} change={-12.5} accent="bg-amber-500" />
        <AdminStatCard label="Resolution Rate" value="94%" icon={CheckCircle} change={3.2} accent="bg-emerald-500" />
        <AdminStatCard label="CSAT Score" value="4.7" icon={Star} change={1.5} accent="bg-purple-500" />
        <AdminStatCard label="Tickets Today" value="8" icon={Calendar} change={14.3} accent="bg-cyan-500" />
        <AdminStatCard label="Escalated" value={escalatedTickets} icon={AlertTriangle} change={-5.1} accent="bg-red-500" />
      </motion.div>

      {/* Filters and search */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search tickets by ID, subject, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              showFilters ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border',
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || agentFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-text-tertiary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface-secondary/50">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="all">All Statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="all">All Priorities</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Agent</label>
                  <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="all">All Agents</option>
                    <option value="unassigned">Unassigned</option>
                    {AGENTS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket list */}
        <div className="divide-y divide-border">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ticket className="w-12 h-12 text-text-tertiary mb-3" />
              <p className="text-text-primary font-medium">No tickets found</p>
              <p className="text-sm text-text-secondary mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full text-left p-4 hover:bg-surface-secondary/50 transition-colors group"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-4">
                  {/* Priority indicator */}
                  <div className={cn(
                    'w-1 h-full min-h-[4rem] rounded-full shrink-0 mt-1',
                    ticket.priority === 'critical' && 'bg-red-500',
                    ticket.priority === 'high' && 'bg-orange-500',
                    ticket.priority === 'medium' && 'bg-yellow-500',
                    ticket.priority === 'low' && 'bg-gray-400',
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-medium text-text-tertiary">{ticket.id}</span>
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', PRIORITY_STYLES[ticket.priority])}>
                        {ticket.priority}
                      </span>
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_STYLES[ticket.status])}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', CATEGORY_STYLES[ticket.category])}>
                        {ticket.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.customer.name}
                      </span>
                      {ticket.assignedAgent && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.assignedAgent}
                        </span>
                      )}
                      {!ticket.assignedAgent && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <AlertTriangle className="w-3 h-3" />
                          Unassigned
                        </span>
                      )}
                      <span>{timeAgo(ticket.createdAt)}</span>
                      <span className="text-text-tertiary">&middot;</span>
                      <span className="text-text-tertiary">Last reply {timeAgo(ticket.lastReplyAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-text-tertiary">{ticket.messages.length} msgs</span>
                    <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-text-tertiary">
          <span>{filteredTickets.length} of {MOCK_TICKETS.length} tickets</span>
          <div className="flex items-center gap-3">
            <span>Page 1 of 1</span>
          </div>
        </div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
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
