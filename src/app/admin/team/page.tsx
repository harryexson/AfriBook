'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, timeAgo } from '@/lib/utils'
import type { AdminRole } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Users, UserCheck, Mail, Shield, Plus, Search,
  Edit3, Trash2, X, Check, ChevronDown, ChevronUp,
  ArrowRight, Lock, AlertTriangle, UserPlus,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type TeamMemberStatus = 'active' | 'invited' | 'suspended'

type Permission =
  | 'view_users' | 'manage_users' | 'view_businesses' | 'manage_businesses'
  | 'view_payments' | 'manage_payments' | 'view_support' | 'manage_support'
  | 'view_analytics' | 'manage_promotions' | 'manage_team' | 'manage_settings'
  | 'view_compliance'

interface TeamMember {
  id: string
  name: string
  email: string
  role: AdminRole
  status: TeamMemberStatus
  permissions: Permission[]
  lastActive: string
  createdAt: string
  avatarColor: string
}

interface TeamActivity {
  id: string
  actorName: string
  action: string
  targetName: string
  timestamp: string
}

const ALL_PERMISSIONS: { key: Permission; label: string }[] = [
  { key: 'view_users', label: 'View Users' },
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'view_businesses', label: 'View Businesses' },
  { key: 'manage_businesses', label: 'Manage Businesses' },
  { key: 'view_payments', label: 'View Payments' },
  { key: 'manage_payments', label: 'Manage Payments' },
  { key: 'view_support', label: 'View Support' },
  { key: 'manage_support', label: 'Manage Support' },
  { key: 'view_analytics', label: 'View Analytics' },
  { key: 'manage_promotions', label: 'Manage Promotions' },
  { key: 'manage_team', label: 'Manage Team' },
  { key: 'manage_settings', label: 'Manage Settings' },
  { key: 'view_compliance', label: 'View Compliance' },
]

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS.map((p) => p.key),
  admin: ['view_users', 'manage_users', 'view_businesses', 'manage_businesses', 'view_payments', 'view_support', 'manage_support', 'view_analytics', 'manage_promotions', 'view_compliance'],
  finance: ['view_users', 'view_businesses', 'view_payments', 'manage_payments', 'view_analytics', 'view_compliance'],
  moderator: ['view_users', 'manage_users', 'view_businesses', 'manage_businesses', 'view_support', 'manage_support', 'view_compliance'],
  support: ['view_users', 'view_businesses', 'view_support', 'manage_support', 'view_compliance'],
}

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  finance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  moderator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  support: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const STATUS_STYLES: Record<TeamMemberStatus, { bg: string; dot: string; label: string }> = {
  active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', dot: 'bg-emerald-500', label: 'Active' },
  invited: { bg: 'bg-amber-100 dark:bg-amber-900/30', dot: 'bg-amber-500', label: 'Invited' },
  suspended: { bg: 'bg-red-100 dark:bg-red-900/30', dot: 'bg-red-500', label: 'Suspended' },
}

const AVATAR_GRADIENTS = [
  'from-amber-400 to-amber-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-purple-400 to-purple-600',
  'from-red-400 to-red-600',
  'from-cyan-400 to-cyan-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-600',
]

const MOCK_TEAM: TeamMember[] = [
  { id: 'tm_1', name: 'Sarah Chen', email: 'sarah.chen@afribook.com', role: 'super_admin', status: 'active', permissions: ROLE_PERMISSIONS.super_admin, lastActive: '2026-07-13T08:23:00Z', createdAt: '2025-01-15T10:00:00Z', avatarColor: AVATAR_GRADIENTS[0] },
  { id: 'tm_2', name: 'James Okafor', email: 'james.okafor@afribook.com', role: 'admin', status: 'active', permissions: ROLE_PERMISSIONS.admin, lastActive: '2026-07-13T07:45:00Z', createdAt: '2025-03-22T14:30:00Z', avatarColor: AVATAR_GRADIENTS[1] },
  { id: 'tm_3', name: 'Amina Hassan', email: 'amina.hassan@afribook.com', role: 'support', status: 'active', permissions: ROLE_PERMISSIONS.support, lastActive: '2026-07-12T16:12:00Z', createdAt: '2025-05-10T09:15:00Z', avatarColor: AVATAR_GRADIENTS[2] },
  { id: 'tm_4', name: 'David Kim', email: 'david.kim@afribook.com', role: 'finance', status: 'active', permissions: ROLE_PERMISSIONS.finance, lastActive: '2026-07-13T06:30:00Z', createdAt: '2025-04-18T11:45:00Z', avatarColor: AVATAR_GRADIENTS[3] },
  { id: 'tm_5', name: 'Lisa Thompson', email: 'lisa.thompson@afribook.com', role: 'moderator', status: 'active', permissions: ROLE_PERMISSIONS.moderator, lastActive: '2026-07-11T14:55:00Z', createdAt: '2025-06-05T08:20:00Z', avatarColor: AVATAR_GRADIENTS[4] },
  { id: 'tm_6', name: 'Peter Njoroge', email: 'peter.njoroge@afribook.com', role: 'support', status: 'invited', permissions: ROLE_PERMISSIONS.support, lastActive: '', createdAt: '2026-07-10T13:00:00Z', avatarColor: AVATAR_GRADIENTS[5] },
  { id: 'tm_7', name: 'Maria Garcia', email: 'maria.garcia@afribook.com', role: 'admin', status: 'active', permissions: ROLE_PERMISSIONS.admin, lastActive: '2026-07-13T09:10:00Z', createdAt: '2025-02-28T16:00:00Z', avatarColor: AVATAR_GRADIENTS[6] },
  { id: 'tm_8', name: 'Ahmed Ali', email: 'ahmed.ali@afribook.com', role: 'finance', status: 'suspended', permissions: ROLE_PERMISSIONS.finance, lastActive: '2026-06-20T11:30:00Z', createdAt: '2025-07-12T10:30:00Z', avatarColor: AVATAR_GRADIENTS[7] },
  { id: 'tm_9', name: 'Grace Mensah', email: 'grace.mensah@afribook.com', role: 'moderator', status: 'invited', permissions: ROLE_PERMISSIONS.moderator, lastActive: '', createdAt: '2026-07-12T09:45:00Z', avatarColor: AVATAR_GRADIENTS[8] },
  { id: 'tm_10', name: 'Tom Williams', email: 'tom.williams@afribook.com', role: 'support', status: 'active', permissions: ROLE_PERMISSIONS.support, lastActive: '2026-07-13T05:20:00Z', createdAt: '2025-09-01T14:15:00Z', avatarColor: AVATAR_GRADIENTS[9] },
]

const MOCK_ACTIVITY: TeamActivity[] = [
  { id: 'act_1', actorName: 'Sarah Chen', action: 'invited', targetName: 'Grace Mensah', timestamp: '2026-07-12T09:45:00Z' },
  { id: 'act_2', actorName: 'Sarah Chen', action: 'invited', targetName: 'Peter Njoroge', timestamp: '2026-07-10T13:00:00Z' },
  { id: 'act_3', actorName: 'James Okafor', action: 'suspended', targetName: 'Ahmed Ali', timestamp: '2026-06-20T12:00:00Z' },
  { id: 'act_4', actorName: 'Maria Garcia', action: 'changed role of', targetName: 'Lisa Thompson', timestamp: '2026-06-15T10:30:00Z' },
  { id: 'act_5', actorName: 'Sarah Chen', action: 'reactivated', targetName: 'Tom Williams', timestamp: '2026-05-28T14:00:00Z' },
  { id: 'act_6', actorName: 'David Kim', action: 'removed', targetName: 'Carlos Rivera', timestamp: '2026-05-10T09:15:00Z' },
  { id: 'act_7', actorName: 'Sarah Chen', action: 'changed role of', targetName: 'James Okafor', timestamp: '2026-04-02T16:45:00Z' },
  { id: 'act_8', actorName: 'James Okafor', action: 'invited', targetName: 'Amina Hassan', timestamp: '2026-03-18T11:20:00Z' },
]

export default function TeamManagementPage() {
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('support')
  const [invitePermissions, setInvitePermissions] = useState<Permission[]>([])

  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [editRole, setEditRole] = useState<AdminRole>('support')

  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null)

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const totalAdmins = team.length
  const activeSessions = team.filter((m) => m.status === 'active').length
  const pendingInvites = team.filter((m) => m.status === 'invited').length
  const rolesUsed = new Set(team.map((m) => m.role)).size

  const filtered = useMemo(() => {
    return team.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      }
      return true
    })
  }, [team, roleFilter, statusFilter, search])

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('error', 'Name and email are required')
      return
    }
    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'invited',
      permissions: invitePermissions.length > 0 ? invitePermissions : ROLE_PERMISSIONS[inviteRole],
      lastActive: '',
      createdAt: new Date().toISOString(),
      avatarColor: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)],
    }
    setTeam((prev) => [newMember, ...prev])
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('support')
    setInvitePermissions([])
    showToast('success', `Invitation sent to ${newMember.email}`)
  }

  const handleEditRole = () => {
    if (!editMember) return
    setTeam((prev) =>
      prev.map((m) =>
        m.id === editMember.id ? { ...m, role: editRole, permissions: ROLE_PERMISSIONS[editRole] } : m
      )
    )
    setEditMember(null)
    showToast('success', `${editMember.name}'s role updated to ${editRole}`)
  }

  const handleRemove = () => {
    if (!removeMember) return
    setTeam((prev) => prev.filter((m) => m.id !== removeMember.id))
    setRemoveMember(null)
    showToast('success', `${removeMember.name} removed from the team`)
  }

  const toggleInvitePermission = (perm: Permission) => {
    setInvitePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Team Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage admin team members, roles, and permissions.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Invite Member</span>
        </button>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Admins" value={totalAdmins} icon={Users} accent="bg-amber-500" />
        <AdminStatCard label="Active Sessions" value={activeSessions} icon={UserCheck} accent="bg-emerald-500" />
        <AdminStatCard label="Pending Invites" value={pendingInvites} icon={Mail} accent="bg-blue-500" />
        <AdminStatCard label="Roles Used" value={rolesUsed} icon={Shield} accent="bg-purple-500" />
      </motion.div>

      <motion.div variants={ITEM}>
        <div className="rounded-2xl bg-surface border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <button
              onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Permissions Matrix</span>
              {showPermissionsMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <AnimatePresence>
            {showPermissionsMatrix && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Role Permissions Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left text-text-tertiary font-medium whitespace-nowrap">Permission</th>
                          {(['super_admin', 'admin', 'finance', 'moderator', 'support'] as AdminRole[]).map((r) => (
                            <th key={r} className="px-3 py-2 text-center text-text-tertiary font-medium whitespace-nowrap capitalize">{r.replace('_', ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ALL_PERMISSIONS.map((perm) => (
                          <tr key={perm.key} className="border-b border-border-light hover:bg-surface-secondary transition-colors">
                            <td className="px-3 py-2 text-text-secondary whitespace-nowrap">{perm.label}</td>
                            {(['super_admin', 'admin', 'finance', 'moderator', 'support'] as AdminRole[]).map((r) => (
                              <td key={r} className="px-3 py-2 text-center">
                                {ROLE_PERMISSIONS[r].includes(perm.key) ? (
                                  <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-text-tertiary/40 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden lg:table-cell">Last Active</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => {
                  const statusStyle = STATUS_STYLES[member.status]
                  return (
                    <tr key={member.id} className="border-b border-border-light hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0', member.avatarColor)}>
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary truncate">{member.name}</p>
                            <p className="text-xs text-text-tertiary md:hidden truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{member.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', ROLE_COLORS[member.role])}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
                          <span className="text-text-secondary text-xs capitalize">{statusStyle.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary hidden lg:table-cell">
                        {member.lastActive ? timeAgo(member.lastActive) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary hidden lg:table-cell">
                        {formatDate(member.createdAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditMember(member); setEditRole(member.role) }}
                            className="p-1.5 rounded-lg hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
                            title="Edit role"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRemoveMember(member)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-tertiary hover:text-red-500 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-16 text-center text-text-tertiary">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p>No team members found</p>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-tertiary">{filtered.length} of {team.length} members</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={ITEM}>
        <div className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Team Activity Log</h3>
          <div className="space-y-3">
            {MOCK_ACTIVITY.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                  {act.action === 'invited' ? (
                    <UserPlus className="w-4 h-4 text-blue-500" />
                  ) : act.action === 'suspended' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : act.action === 'removed' ? (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">{act.actorName}</span>
                    <span className="text-text-secondary mx-1">{act.action}</span>
                    <span className="font-medium">{act.targetName}</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">{timeAgo(act.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Invite Modal */}
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg max-h-[80vh] z-50 focus:outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Dialog.Title className="text-lg font-semibold text-text-primary font-heading">Invite Team Member</Dialog.Title>
                <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-4 h-4 text-text-tertiary" />
                </Dialog.Close>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm font-medium text-text-primary">Full Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="support">Support</option>
                    <option value="moderator">Moderator</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Permissions</label>
                  <p className="text-xs text-text-tertiary mt-0.5 mb-2">Override default role permissions if needed</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.key}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs',
                          invitePermissions.includes(perm.key)
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                            : 'bg-surface-secondary border-border hover:border-border'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={invitePermissions.includes(perm.key)}
                          onChange={() => toggleInvitePermission(perm.key)}
                          className="sr-only"
                        />
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          invitePermissions.includes(perm.key)
                            ? 'bg-amber-500 border-amber-500'
                            : 'border-border'
                        )}>
                          {invitePermissions.includes(perm.key) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-text-secondary">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                <Dialog.Close className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleInvite}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Invite
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Role Modal */}
      <Dialog.Root open={!!editMember} onOpenChange={(open) => { if (!open) setEditMember(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-md z-50 focus:outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Dialog.Title className="text-lg font-semibold text-text-primary font-heading">Edit Role</Dialog.Title>
                <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-4 h-4 text-text-tertiary" />
                </Dialog.Close>
              </div>
              <div className="p-4 space-y-4">
                {editMember && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                    <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold', editMember.avatarColor)}>
                      {editMember.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{editMember.name}</p>
                      <p className="text-xs text-text-tertiary">{editMember.email}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-text-primary">New Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AdminRole)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="support">Support</option>
                    <option value="moderator">Moderator</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary">
                  <p className="text-xs text-text-tertiary mb-2">This role will have the following permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {ROLE_PERMISSIONS[editRole].map((perm) => (
                      <span key={perm} className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary">
                        {ALL_PERMISSIONS.find((p) => p.key === perm)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                <Dialog.Close className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleEditRole}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Update Role
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Remove Confirmation Modal */}
      <Dialog.Root open={!!removeMember} onOpenChange={(open) => { if (!open) setRemoveMember(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-[25%] left-1/2 -translate-x-1/2 w-full max-w-md z-50 focus:outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary font-heading">Remove Team Member</h3>
                <p className="text-sm text-text-secondary mt-2">
                  Are you sure you want to remove <span className="font-medium text-text-primary">{removeMember?.name}</span> from the team?
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 border-t border-border">
                <Dialog.Close className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Member
                </button>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
