'use client'

import { useState, useTransition } from 'react'
import { Home, Loader2, Building2 } from 'lucide-react'
import { toggleRemoteStatus } from '@/lib/actions/presence-actions'
import { toast } from 'sonner'

interface TogglePresenceProps {
  date: Date
  isRemote: boolean
  userId?: string
  showPillAndBox?: boolean
  dateNumberElement?: React.ReactNode
}

export function TogglePresence({ 
  date, 
  isRemote, 
  userId, 
  showPillAndBox = true, 
  dateNumberElement 
}: TogglePresenceProps) {
  const [isPending, startTransition] = useTransition()
  // Optimistic UI state
  const [optimisticRemote, setOptimisticRemote] = useState(isRemote)

  const handleToggle = () => {
    const originalState = optimisticRemote
    const newState = !originalState

    // Optimistic update
    setOptimisticRemote(newState)

    startTransition(async () => {
      // Format date to local YYYY-MM-DD string to avoid timezone shifting during serialization
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`

      const result = await toggleRemoteStatus(dateStr, originalState, userId)
      if (result.error) {
        // Revert on error
        setOptimisticRemote(originalState)
        toast.error(result.error)
      } else {
        toast.success(newState ? 'Marked as Remote' : 'Marked as Office')
      }
    })
  }

  // Pill JSX
  const pill = optimisticRemote ? (
    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Remote
    </span>
  ) : (
    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Office
    </span>
  )

  // Status Box JSX
  const statusBox = optimisticRemote ? (
    <div className="bg-emerald-50/50 border border-emerald-100/50 text-emerald-800 py-1.5 px-3 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 w-full">
      <span>🏡</span>
      <span>Working from home</span>
    </div>
  ) : (
    <div className="bg-slate-50 border border-slate-100 text-slate-600 py-1.5 px-3 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 w-full">
      <span>🏢</span>
      <span>In office workspace</span>
    </div>
  )

  // Button JSX
  const button = (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors border cursor-pointer ${
        optimisticRemote
          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          : 'bg-white border-slate-950 text-slate-950 hover:bg-slate-50'
      } disabled:opacity-70`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : optimisticRemote ? (
        <Building2 size={13} className="text-indigo-600" />
      ) : (
        <Home size={13} className="text-slate-500" />
      )}
      {optimisticRemote ? 'Mark Office' : 'Mark Remote'}
    </button>
  )

  return (
    <div className="flex flex-col flex-1 justify-between h-full w-full gap-2">
      {showPillAndBox && (
        <>
          {dateNumberElement ? (
            /* Month View Top Row */
            <div className="flex justify-between items-center w-full">
              {dateNumberElement}
              {pill}
            </div>
          ) : (
            /* Week/Day View Top Row */
            <div className="flex justify-between items-center w-full">
              <span className="text-sm font-medium text-slate-500">Location Status</span>
              {pill}
            </div>
          )}
          
          {/* Status Box */}
          <div className="flex-1 flex items-center justify-center">
            {statusBox}
          </div>
        </>
      )}
      
      {/* Action Button */}
      <div className="w-full">
        {button}
      </div>
    </div>
  )
}
