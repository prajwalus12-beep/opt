'use client'

import { useState, useTransition } from 'react'
import { Home, Loader2 } from 'lucide-react'
import { toggleRemoteStatus } from '@/lib/actions/presence-actions'
import { toast } from 'sonner'

interface TogglePresenceProps {
  date: Date
  isRemote: boolean
  userId?: string
}

export function TogglePresence({ date, isRemote, userId }: TogglePresenceProps) {
  const [isPending, startTransition] = useTransition()
  // Optimistic UI state
  const [optimisticRemote, setOptimisticRemote] = useState(isRemote)

  const handleToggle = () => {
    // Optimistic update
    setOptimisticRemote(!optimisticRemote)

    startTransition(async () => {
      const result = await toggleRemoteStatus(date, userId)
      if (result.error) {
        // Revert on error
        setOptimisticRemote(optimisticRemote)
        toast.error(result.error)
      } else {
        toast.success(optimisticRemote ? 'Marked as Office' : 'Marked as Remote')
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors border ${
        optimisticRemote
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      } disabled:opacity-70`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Home size={14} />
      )}
      {optimisticRemote ? 'Remote' : 'Mark Remote'}
    </button>
  )
}
