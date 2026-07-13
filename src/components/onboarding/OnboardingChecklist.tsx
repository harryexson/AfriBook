'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistTask {
  id: string
  icon: LucideIcon
  label: string
  description: string
  completed: boolean
  href?: string
  onClick?: () => void
}

interface OnboardingChecklistProps {
  title: string
  tasks: ChecklistTask[]
}

export default function OnboardingChecklist({ title, tasks }: OnboardingChecklistProps) {
  const completedCount = tasks.filter((t) => t.completed).length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <span className="text-xs font-medium text-text-secondary">
          {completedCount}/{tasks.length}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
        <motion.div
          className="h-full rounded-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ul className="space-y-1" role="list">
        {tasks.map((task, i) => {
          const Icon = task.icon
          const rowClassName = cn(
            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-200',
            task.completed
              ? 'bg-surface-secondary/50'
              : 'hover:bg-surface-secondary',
          )

          const content = (
            <>
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  task.completed
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-surface-secondary text-text-secondary',
                )}
              >
                {task.completed ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    task.completed
                      ? 'text-text-tertiary line-through'
                      : 'text-text-primary',
                  )}
                >
                  {task.label}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">{task.description}</p>
              </div>

              {!task.completed && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                  Do now
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </>
          )

          return (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              {task.href ? (
                <Link href={task.href} onClick={task.onClick} className={rowClassName}>
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={task.onClick} className={rowClassName}>
                  {content}
                </button>
              )}
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
