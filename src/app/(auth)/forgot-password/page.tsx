'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailForm = z.infer<typeof emailSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: EmailForm) => {
    setSubmitLoading(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </motion.div>

          <div>
            <h2 className="text-xl font-bold text-text-primary font-heading">Check your email</h2>
            <p className="text-sm text-text-secondary mt-2">
              We&apos;ve sent a password reset link to your email. It may take a few minutes to arrive.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20">
            <p className="text-xs text-text-secondary">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => { setSent(false); setSubmitLoading(false) }}
                className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <p className="text-sm text-text-secondary">
            Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-text-primary placeholder-text-tertiary',
                    'bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all',
                    errors.email ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-amber-500'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className={cn(
                'w-full py-3 rounded-xl font-semibold text-sm transition-all',
                'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
                'hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25',
                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
              )}
            >
              {submitLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Send reset link
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
