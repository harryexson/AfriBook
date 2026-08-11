'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, timeAgo } from '@/lib/utils'
import {
  ArrowLeft, Send, Paperclip,
  AlertTriangle, GitMerge, ArrowUpDown, CheckCircle,
  User, MessageSquare, Shield,
} from 'lucide-react'

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

interface TicketDetailProps {
  ticket: SupportTicket
  onBack: () => void
  onAssign: (ticketId: string, agent: string) => void
  onStatusChange: (ticketId: string, status: TicketStatus) => void
  onPriorityChange: (ticketId: string, priority: TicketPriority) => void
  onEscalate: (ticketId: string) => void
  onClose: (ticketId: string) => void
  onMerge: (ticketId: string) => void
  onSendReply: (ticketId: string, message: string, isInternal: boolean) => void
  agents: string[]
}

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

export default function TicketDetail({
  ticket, onBack, onAssign, onStatusChange, onPriorityChange,
  onEscalate, onClose, onMerge, onSendReply, agents,
}: TicketDetailProps) {
  const [replyText, setReplyText] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!replyText.trim()) return
    onSendReply(ticket.id, replyText, isInternalNote)
    setReplyText('')
    setIsInternalNote(false)
  }

  const handleFileAttach = () => {
    fileRef.current?.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-surface-secondary border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary font-heading">{ticket.subject}</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {ticket.id} &middot; Created {timeAgo(ticket.createdAt)} &middot; Last updated {timeAgo(ticket.lastUpdated)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main conversation area */}
        <div className="lg:col-span-2 space-y-3">
          {/* Customer info bar */}
          <div className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                {ticket.customer.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{ticket.customer.name}</p>
                <p className="text-xs text-text-secondary">{ticket.customer.email} &middot; {ticket.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Conversation thread */}
          <div className="rounded-2xl bg-surface border border-border divide-y divide-border max-h-[60vh] overflow-y-auto">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'p-4',
                  msg.isInternalNote && 'bg-amber-50/60 dark:bg-amber-900/10',
                )}
              >
                {msg.isInternalNote && (
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
                    <Shield className="w-3 h-3" />
                    Internal Note
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    msg.role === 'customer'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  )}>
                    {msg.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{msg.author}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                        msg.role === 'customer' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
                      )}>
                        {msg.role === 'customer' ? 'Customer' : 'Agent'}
                      </span>
                      <span className="text-xs text-text-tertiary ml-auto">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    {msg.attachments.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Paperclip className="w-3 h-3 text-text-tertiary" />
                        {msg.attachments.map((att, i) => (
                          <span key={i} className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer">{att}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply form */}
          <div className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setIsInternalNote(false)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  !isInternalNote
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary',
                )}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />
                Reply
              </button>
              <button
                onClick={() => setIsInternalNote(true)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  isInternalNote
                    ? 'bg-amber-500 text-white'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary',
                )}
              >
                <Shield className="w-3 h-3 inline mr-1" />
                Internal Note
              </button>
            </div>

            {isInternalNote && (
              <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800">
                <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-400">This note will only be visible to agents and admins.</span>
              </div>
            )}

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isInternalNote ? 'Add an internal note...' : 'Type your reply...'}
              rows={3}
              className="w-full bg-surface-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
            />

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleFileAttach}
                  className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" className="hidden" multiple />
                <span className="text-xs text-text-tertiary">Attach files</span>
              </div>
              <button
                onClick={handleSend}
                disabled={!replyText.trim()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  replyText.trim()
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25'
                    : 'bg-surface-secondary text-text-tertiary cursor-not-allowed',
                )}
              >
                <Send className="w-4 h-4" />
                {isInternalNote ? 'Add Note' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - ticket info and actions */}
        <div className="space-y-3">
          {/* Status badges */}
          <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Status</span>
              <select
                value={ticket.status}
                onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border-0 focus:ring-2 focus:ring-amber-500/30 cursor-pointer',
                  STATUS_STYLES[ticket.status],
                )}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Priority</span>
              <select
                value={ticket.priority}
                onChange={(e) => onPriorityChange(ticket.id, e.target.value as TicketPriority)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold border-0 focus:ring-2 focus:ring-amber-500/30 cursor-pointer',
                  PRIORITY_STYLES[ticket.priority],
                )}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Category</span>
              <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold', CATEGORY_STYLES[ticket.category])}>
                {ticket.category}
              </span>
            </div>
          </div>

          {/* Assigned agent */}
          <div className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary">Assigned To</span>
              <div className="relative">
                <button
                  onClick={() => setShowAssign(!showAssign)}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  {ticket.assignedAgent ? 'Change' : 'Assign'}
                </button>
                <AnimatePresence>
                  {showAssign && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAssign(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-6 w-44 z-20 rounded-xl bg-surface border border-border shadow-xl overflow-hidden"
                      >
                        <div className="p-1">
                          {agents.map((agent) => (
                            <button
                              key={agent}
                              onClick={() => { onAssign(ticket.id, agent); setShowAssign(false) }}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                ticket.assignedAgent === agent
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20'
                                  : 'text-text-secondary hover:bg-surface-secondary',
                              )}
                            >
                              {agent}
                            </button>
                          ))}
                          {ticket.assignedAgent && (
                            <button
                              onClick={() => { onAssign(ticket.id, ''); setShowAssign(false) }}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Unassign
                            </button>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {ticket.assignedAgent ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                  {ticket.assignedAgent.charAt(0)}
                </div>
                <span className="text-sm font-medium text-text-primary">{ticket.assignedAgent}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-text-tertiary">
                <User className="w-4 h-4" />
                <span className="text-sm">Unassigned</span>
              </div>
            )}
          </div>

          {/* Conversation stats */}
          <div className="rounded-2xl bg-surface border border-border p-4">
            <p className="text-xs font-medium text-text-secondary mb-2">Conversation</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Messages</span>
              <span className="font-semibold text-text-primary">{ticket.messages.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-text-secondary">From customer</span>
              <span className="font-semibold text-text-primary">
                {ticket.messages.filter((m) => m.role === 'customer').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-text-secondary">From agents</span>
              <span className="font-semibold text-text-primary">
                {ticket.messages.filter((m) => m.role === 'agent').length}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl bg-surface border border-border overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-text-secondary">Actions</p>
            </div>
            <div className="divide-y divide-border">
              <button
                onClick={() => onEscalate(ticket.id)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Escalate to Senior Support
              </button>
              <button
                onClick={() => onMerge(ticket.id)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-secondary hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <GitMerge className="w-4 h-4" />
                Merge Tickets
              </button>
              <button
                onClick={() => setShowActions(!showActions)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                Change Priority / Status
              </button>
              <button
                onClick={() => onClose(ticket.id)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-secondary hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
