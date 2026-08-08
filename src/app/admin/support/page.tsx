'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, timeAgo } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import TicketDetail from '@/components/admin/TicketDetail'
import {
  Ticket, Clock, CheckCircle, Star, AlertTriangle,
  Search, Filter, SortAsc, MessageSquare, User,
  ChevronRight, Calendar, ArrowLeft,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type TicketPriority = 'critical' | 'high' | 'medium' | 'low'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type DisplayStatus = TicketStatus | 'waiting_on_customer'
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
  dbId: string
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

interface ApiMessageRow {
  id: string
  sender_id: string | null
  body: string
  attachments: unknown
  internal: boolean
  created_at: string
}

interface ApiTicketRow {
  id: string
  ticket_number: string | null
  user_id: string | null
  subject: string
  category: string
  priority: string
  status: string
  assigned_to: string | null
  tags: unknown
  metadata: unknown
  created_at: string
  updated_at: string | null
  user: { email: string | null; full_name: string | null; avatar_url: string | null } | null
  messages?: ApiMessageRow[]
}

const AGENTS = ['Chidi Okonkwo', 'Amina Diallo', 'James Mwangi', 'Grace Ochieng', 'Fatima Issa']

const CATEGORIES: TicketCategory[] = ['billing', 'technical', 'account', 'dispute', 'general']

const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low']

const STATUSES: DisplayStatus[] = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  waiting_on_customer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
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

const mapTicket = (t: ApiTicketRow): SupportTicket => ({
  id: t.ticket_number ?? t.id,
  dbId: t.id,
  subject: t.subject,
  customer: {
    name: t.user?.full_name ?? 'Customer',
    email: t.user?.email ?? '—',
    phone: '',
  },
  priority: t.priority as TicketPriority,
  status: t.status as TicketStatus,
  category: t.category as TicketCategory,
  assignedAgent: t.assigned_to ?? null,
  messages: [],
  createdAt: t.created_at,
  lastUpdated: t.updated_at ?? t.created_at,
  lastReplyAt: t.created_at,
})

const mapMessages = (
  messages: ApiMessageRow[],
  ticketId: string,
  userId: string | null,
  customerName: string,
): TicketMessage[] =>
  (messages ?? []).map((m) => {
    const isCustomer = !!m.sender_id && m.sender_id === userId
    return {
      id: m.id,
      ticketId,
      author: isCustomer ? customerName : 'Support Agent',
      role: isCustomer ? 'customer' : 'agent',
      body: m.body,
      isInternalNote: !!m.internal,
      attachments: Array.isArray(m.attachments) ? m.attachments.map(String) : [],
      createdAt: m.created_at,
    }
  })

const mapTicketDetail = (t: ApiTicketRow): SupportTicket => {
  const base = mapTicket(t)
  const customerName = t.user?.full_name ?? 'Customer'
  const messages = mapMessages(t.messages ?? [], base.id, t.user_id, customerName)
  return {
    ...base,
    messages,
    lastReplyAt: messages.length > 0 ? messages[messages.length - 1].createdAt : base.createdAt,
  }
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'status'>('updated')
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleAction = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tickets?limit=100', { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Failed to load tickets')
      }
      const json = await res.json()
      setTickets((json.data as ApiTicketRow[]).map(mapTicket))
      setTotal(json.count ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const openTickets = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length
  const escalatedTickets = tickets.filter((t) => t.priority === 'critical').length

  const filteredTickets = useMemo(() => {
    let result = [...tickets]

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
      const sOrder: Record<string, number> = { open: 0, in_progress: 1, waiting_on_customer: 2, resolved: 3, closed: 4 }
      return sOrder[a.status] - sOrder[b.status]
    })

    return result
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, agentFilter, sortBy, tickets])

  const applyTicketPatch = (ticketId: string, patch: Partial<SupportTicket>) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, ...patch } : t)))
    setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, ...patch } : prev))
  }

  const appendMessage = (ticketId: string, msg: TicketMessage) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, messages: [...t.messages, msg], lastReplyAt: msg.createdAt } : t)),
    )
    setSelectedTicket((prev) =>
      prev && prev.id === ticketId ? { ...prev, messages: [...prev.messages, msg], lastReplyAt: msg.createdAt } : prev,
    )
  }

  const patchTicket = async (ticketId: string, body: Record<string, unknown>, message: string) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.dbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Request failed')
      }
      const json = await res.json()
      const updated = mapTicket(json.data as ApiTicketRow)
      applyTicketPatch(ticketId, {
        status: updated.status,
        priority: updated.priority,
        assignedAgent: updated.assignedAgent,
        lastUpdated: updated.lastUpdated,
      })
      handleAction(message)
    } catch (e) {
      handleAction(e instanceof Error ? e.message : 'Request failed', 'error')
    }
  }

  const openTicket = async (ticket: SupportTicket) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.dbId}`, { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Failed to load ticket')
      }
      const json = await res.json()
      const detail = mapTicketDetail(json.data as ApiTicketRow)
      setSelectedTicket(detail)
      setTickets((prev) => prev.map((t) => (t.id === detail.id ? detail : t)))
    } catch (e) {
      handleAction(e instanceof Error ? e.message : 'Failed to load ticket', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAssignAgent = (ticketId: string, agent: string) => {
    const value = agent || null
    applyTicketPatch(ticketId, { assignedAgent: value })
    handleAction(value ? `Ticket ${ticketId} assigned to ${agent}` : `Ticket ${ticketId} unassigned`)
  }

  const handleChangeStatus = (ticketId: string, status: TicketStatus) => {
    patchTicket(ticketId, { status }, `Ticket ${ticketId} status changed to ${status.replace('_', ' ')}`)
  }

  const handleChangePriority = (ticketId: string, priority: TicketPriority) => {
    patchTicket(ticketId, { priority }, `Ticket ${ticketId} priority changed to ${priority}`)
  }

  const handleEscalate = (ticketId: string) => {
    handleAction(`Ticket ${ticketId} escalated to senior support`)
  }

  const handleClose = (ticketId: string) => {
    patchTicket(ticketId, { status: 'closed' }, `Ticket ${ticketId} closed`)
  }

  const handleMerge = (ticketId: string) => {
    handleAction(`Merge initiated for ${ticketId}`)
  }

  const handleSendReply = async (ticketId: string, message: string, isInternal: boolean) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.dbId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: message, internal: isInternal }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Failed to send message')
      }
      const json = await res.json()
      const msg = json.data as ApiMessageRow
      appendMessage(ticketId, {
        id: msg.id,
        ticketId,
        author: 'Support Agent',
        role: 'agent',
        body: msg.body,
        isInternalNote: !!msg.internal,
        attachments: Array.isArray(msg.attachments) ? msg.attachments.map(String) : [],
        createdAt: msg.created_at,
      })
      handleAction(isInternal ? 'Internal note added' : 'Reply sent')
    } catch (e) {
      handleAction(e instanceof Error ? e.message : 'Failed to send message', 'error')
    }
  }

  if (detailLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedTicket(null); setDetailLoading(false) }}
            className="p-2 rounded-xl hover:bg-surface-secondary border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-text-secondary">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading ticket...</span>
          </div>
        </div>
      </motion.div>
    )
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
        <AdminStatCard label="Open Tickets" value={openTickets} icon={Ticket} change={8.3} accent="bg-blue-500" loading={loading} />
        <AdminStatCard label="Avg Response Time" value="4.2h" icon={Clock} change={-12.5} accent="bg-amber-500" loading={loading} />
        <AdminStatCard label="Resolution Rate" value="94%" icon={CheckCircle} change={3.2} accent="bg-emerald-500" loading={loading} />
        <AdminStatCard label="CSAT Score" value="4.7" icon={Star} change={1.5} accent="bg-purple-500" loading={loading} />
        <AdminStatCard label="Tickets Today" value="8" icon={Calendar} change={14.3} accent="bg-cyan-500" loading={loading} />
        <AdminStatCard label="Escalated" value={escalatedTickets} icon={AlertTriangle} change={-5.1} accent="bg-red-500" loading={loading} />
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-secondary mt-3">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-text-primary font-medium">Failed to load tickets</p>
              <p className="text-sm text-text-secondary mt-1">{error}</p>
              <button
                onClick={loadTickets}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ticket className="w-12 h-12 text-text-tertiary mb-3" />
              <p className="text-text-primary font-medium">No tickets found</p>
              <p className="text-sm text-text-secondary mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.button
                key={ticket.id}
                onClick={() => openTicket(ticket)}
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
          <span>{filteredTickets.length} of {total} tickets</span>
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
