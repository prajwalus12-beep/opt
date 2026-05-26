'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Calendar as CalendarIcon,
  Settings,
  Lock,
  Loader2
} from 'lucide-react'
import { TogglePresence } from '@/components/presence/toggle-presence'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { updateUserPassword } from '@/lib/actions/presence-actions'
import { toast } from 'sonner'

interface DashboardClientProps {
  initialRemoteDates: string[] // YYYY-MM-DD format
  userId?: string
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getWeekDays(date: Date) {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay();
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(curr.setDate(first + i)));
  }
  return days;
}

function formatDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DashboardClient({ initialRemoteDates, userId }: DashboardClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month')

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month' || view === 'list') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  }

  const isRemote = (date: Date) => {
    return initialRemoteDates.includes(formatDateStr(date))
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    setIsUpdating(true)
    try {
      const result = await updateUserPassword(newPassword)
      if (result.success) {
        toast.success('Password updated successfully')
        setIsSettingsOpen(false)
        setNewPassword('')
      } else {
        toast.error(result.error || 'Failed to update password')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  let dateLabel = "";
  if (view === 'month' || view === 'list') {
    dateLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  } else if (view === 'week') {
    const weekDays = getWeekDays(currentDate);
    const start = weekDays[0];
    const end = weekDays[6];
    dateLabel = `${monthNames[start.getMonth()].substring(0, 3)} ${start.getDate()} - ${monthNames[end.getMonth()].substring(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
  } else if (view === 'day') {
    dateLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }

  // Generate Month View Days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthCells = [];
  for (let i = 0; i < firstDay; i++) monthCells.push(null);
  for (let i = 1; i <= daysInMonth; i++) monthCells.push(new Date(year, month, i));

  // Generate Week View Days
  const weekCells = getWeekDays(currentDate).filter(d => d.getDay() !== 0 && d.getDay() !== 6);

  // Generate List View Days (Weekdays in current month)
  const listCells = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      listCells.push(d);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">My Schedule</h2>
          <p className="text-sm text-slate-500">Plan your remote working days.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setIsSettingsOpen(true)}>
          <Settings size={16} /> Update Password
        </Button>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-slate-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="new-password"
                  type="text"
                  placeholder="Enter new password"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Updating your password will also update what the admin sees in the team roster.</p>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="gap-2">
                {isUpdating && <Loader2 size={16} className="animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <Tabs defaultValue="month" value={view} onValueChange={setView} className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight size={16} />
              </Button>
              <h2 className="text-lg font-semibold ml-2 text-slate-800 w-48">{dateLabel}</h2>
            </div>

            <TabsList>
              <TabsTrigger value="day" className="gap-2"><CalendarDays size={16} /> <span className="hidden sm:inline">Day</span></TabsTrigger>
              <TabsTrigger value="week" className="gap-2"><CalendarDays size={16} /> <span className="hidden sm:inline">Week</span></TabsTrigger>
              <TabsTrigger value="month" className="gap-2"><CalendarIcon size={16} /> <span className="hidden sm:inline">Month</span></TabsTrigger>
              <TabsTrigger value="list" className="gap-2"><List size={16} /> <span className="hidden sm:inline">List</span></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="month" className="mt-0">
            <Card className="overflow-hidden border-slate-200">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-l border-slate-200">
                {monthCells.map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} className="h-32 border-r border-b border-slate-100 bg-slate-50/50" />;

                  const isToday = formatDateStr(date) === formatDateStr(new Date());
                  const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                  return (
                    <div key={date.toISOString()} className={`h-32 p-2 border-r border-b border-slate-100 flex flex-col transition-colors ${isWeekend ? 'bg-slate-50/50' : 'hover:bg-slate-50'} ${isToday ? 'bg-indigo-50/20' : ''}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700 px-1'}`}>
                          {date.getDate()}
                        </span>
                      </div>

                      {!isWeekend && (
                        <div className="mt-auto">
                          <TogglePresence
                            date={date}
                            isRemote={isRemote(date)}
                            userId={userId}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {weekCells.map(date => (
                <Card key={date.toISOString()} className="p-4 flex flex-col min-h-[220px]">
                  <div className="text-center pb-4 border-b border-slate-100 mb-4">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{date.getDate()}</p>
                    <p className="text-xs text-slate-400 mt-1">{monthNames[date.getMonth()]}</p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-sm text-center text-slate-500 mb-3">Location Status</p>
                    <TogglePresence
                      date={date}
                      isRemote={isRemote(date)}
                      userId={userId}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="day" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Just showing one day in similar format to week */}
              <Card className="p-4 flex flex-col min-h-[220px]">
                <div className="text-center pb-4 border-b border-slate-100 mb-4">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{currentDate.getDate()}</p>
                  <p className="text-xs text-slate-400 mt-1">{monthNames[currentDate.getMonth()]}</p>
                </div>
                {currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && (
                  <div className="mt-auto">
                    <p className="text-sm text-center text-slate-500 mb-3">Location Status</p>
                    <TogglePresence
                      date={currentDate}
                      isRemote={isRemote(currentDate)}
                      userId={userId}
                    />
                  </div>
                )}
                {(currentDate.getDay() === 0 || currentDate.getDay() === 6) && (
                  <div className="mt-auto flex justify-center items-center h-full">
                    <p className="text-sm text-slate-400 italic">Weekend</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <Card className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listCells.map(date => {
                    const remote = isRemote(date);
                    // only show remote entries as requested: "Show ONLY remote entries. DO NOT show office entries."
                    // Wait, if we only show remote entries in list view, they can't toggle from office to remote here.
                    // The prompt says: "Show ONLY remote entries. DO NOT show office entries. Features: inline toggle, remove remote status, empty state: 'No remote work logged'"
                    if (!remote) return null;

                    return (
                      <tr key={date.toISOString()} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 flex justify-end">
                          <div className="w-36">
                            <TogglePresence
                              date={date}
                              isRemote={remote}
                              userId={userId}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {listCells.filter(date => isRemote(date)).length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                        No remote work logged
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
