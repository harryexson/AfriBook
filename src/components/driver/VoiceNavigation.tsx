'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Navigation2, Volume2, VolumeX, X, ArrowUp, ArrowUpRight, ArrowUpLeft,
  RotateCw, Flag, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchDrivingRoute, distanceMeters, type LatLng, type NavigationRoute, type NavigationStep } from '@/lib/navigation/osrm'

interface VoiceNavigationProps {
  destination: LatLng
  /** Shown in the header, e.g. "Chioma's Kitchen" or "Emeka Okafor". Street-level only — never the full precise address. */
  destinationLabel: string
  onClose: () => void
  /** Fired once the driver's live position comes within arrival range of the destination. */
  onArrived?: () => void
}

const ARRIVAL_RADIUS_M = 30
const STEP_ADVANCE_RADIUS_M = 25
const MUTE_STORAGE_KEY = 'afribook-driver-nav-muted'

function iconForStep(step: NavigationStep) {
  if (step.maneuverType === 'arrive') return Flag
  if (step.maneuverType === 'roundabout' || step.maneuverType === 'rotary') return RotateCw
  if (step.modifier === 'left' || step.modifier === 'sharp left' || step.modifier === 'slight left') return ArrowUpLeft
  if (step.modifier === 'right' || step.modifier === 'sharp right' || step.modifier === 'slight right') return ArrowUpRight
  return ArrowUp
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatEta(seconds: number): string {
  const min = Math.round(seconds / 60)
  if (min < 1) return '< 1 min'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

/** Speaks driving instructions aloud as the driver reaches each turn — the "voice turn-by-turn" piece of the driver app. */
export default function VoiceNavigation({ destination, destinationLabel, onClose, onArrived }: VoiceNavigationProps) {
  const [route, setRoute] = useState<NavigationRoute | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [muted, setMuted] = useState(false)
  const [arrived, setArrived] = useState(false)
  const spokenStepRef = useRef(-1)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === 'true')
    } catch {
      // localStorage unavailable (private browsing, etc.) — default to unmuted.
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (muted || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    window.speechSynthesis.speak(utterance)
  }, [muted])

  // Acquire an initial fix, then fetch the route from here to the destination.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location services are not available on this device')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCurrentPosition(origin)
        fetchDrivingRoute(origin, destination)
          .then((r) => {
            setRoute(r)
            setLoading(false)
          })
          .catch(() => {
            setError('Could not calculate a route — check your connection')
            setLoading(false)
          })
      },
      () => {
        setError('Location permission is required for turn-by-turn navigation')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    )
    // Only re-run if the destination itself changes, not on every render.
  }, [destination.lat, destination.lng])

  // Live-track position, advance through steps, and detect arrival.
  useEffect(() => {
    if (!route || typeof navigator === 'undefined' || !navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCurrentPosition(here)

        if (distanceMeters(here, destination) <= ARRIVAL_RADIUS_M) {
          setArrived(true)
          onArrived?.()
          return
        }

        setStepIndex((prevIndex) => {
          const next = route.steps[prevIndex + 1]
          if (next && distanceMeters(here, next.location) <= STEP_ADVANCE_RADIUS_M) {
            return prevIndex + 1
          }
          return prevIndex
        })
      },
      () => {
        // A transient GPS read failure shouldn't kill navigation — just skip this update.
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    )

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [route, destination, onArrived])

  // Speak each new step exactly once, when we first reach it.
  useEffect(() => {
    if (!route || arrived) return
    const step = route.steps[stepIndex]
    if (step && spokenStepRef.current !== stepIndex) {
      spokenStepRef.current = stepIndex
      speak(step.instruction)
    }
  }, [route, stepIndex, arrived, speak])

  useEffect(() => {
    if (arrived) speak(`You've arrived at ${destinationLabel}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived])

  useEffect(() => () => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }, [])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    if (next) window.speechSynthesis?.cancel()
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(next))
    } catch {
      // Best-effort only.
    }
  }

  const currentStep = route?.steps[stepIndex]
  const nextStep = route?.steps[stepIndex + 1]
  const distanceToNextTurn = currentPosition && currentStep
    ? distanceMeters(currentPosition, (nextStep ?? currentStep).location)
    : currentStep?.distanceMeters ?? 0

  const StepIcon = currentStep ? iconForStep(currentStep) : Navigation2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96"
    >
      <div className="rounded-t-2xl sm:rounded-2xl bg-dark-500 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Navigation2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm font-semibold truncate">Navigating to {destinationLabel}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={muted ? 'Unmute voice directions' : 'Mute voice directions'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-white/70 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating route…
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-300 py-2">{error}</p>
          )}

          {!loading && !error && arrived && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="font-semibold">You&apos;ve arrived at {destinationLabel}</p>
            </div>
          )}

          {!loading && !error && !arrived && currentStep && (
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <StepIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-tight">{formatDistance(distanceToNextTurn)}</p>
                <p className="text-sm text-white/80 truncate">{currentStep.instruction}</p>
                {nextStep && (
                  <p className="text-xs text-white/50 mt-1 truncate">Then: {nextStep.instruction}</p>
                )}
              </div>
            </div>
          )}

          {!loading && !error && route && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs text-white/60">
              <span>{formatDistance(route.distanceMeters)} total</span>
              <span>ETA {formatEta(route.durationSec)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
