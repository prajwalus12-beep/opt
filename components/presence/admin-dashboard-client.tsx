'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Calendar as CalendarIcon,
  Home,
  Users,
  Trash2,
  Plus,
  Search,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  User
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteProfile, inviteMember } from '@/lib/actions/presence-actions'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdminDashboardClientProps {
  remoteEntries: {
    work_date: string
    profiles: {
      id: string
      full_name: string
      avatar_url: string | null
    } | null
  }[]
  teamMembers: {
    id: string,
    full_name: string,
    avatar_url: string | null,
    email: string,
    role: string,
    password?: string | null
  }[]
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

export function AdminDashboardContent({ remoteEntries, teamMembers }: AdminDashboardClientProps) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(curr.setDate(first + i)));
    }
    return days;
  };

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  };

  const router = useRouter()
  const searchParams = useSearchParams()
  // Read from URL only for initial state (supports direct links like /admin/presence?tab=team)
  const [adminTab, setAdminTab] = useState(searchParams.get('tab') || 'schedule')

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [searchQuery, setSearchQuery] = useState('')

  // Invite dialog state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState('employee')
  const [isInviting, setIsInviting] = useState(false)

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Instant tab switching — pure local state, no router.push/server re-render
  const handleTabChange = (newTab: string) => {
    setAdminTab(newTab)
  }

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

  const getRemoteUsersForDate = (dateStr: string) => {
    return remoteEntries
      .filter(entry => entry.work_date === dateStr && entry.profiles)
      .map(entry => entry.profiles!)
  }

  const handleDeleteProfile = async (id: string) => {
    if (confirm('Are you sure you want to remove this team member? This will also remove all their attendance records.')) {
      const result = await deleteProfile(id)
      if (result.success) {
        toast.success('Team member removed successfully')
      } else {
        toast.error(result.error || 'Failed to remove team member')
      }
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteName || !invitePassword) {
      toast.error('Please fill in all fields')
      return
    }

    setIsInviting(true)
    try {
      const result = await inviteMember(inviteEmail, inviteName, invitePassword, inviteRole)
      if (result.success) {
        toast.success('Member added successfully')
        setIsInviteDialogOpen(false)
        setInviteEmail('')
        setInviteName('')
        setInvitePassword('')
        setInviteRole('employee')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to add member')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsInviting(false)
    }
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthCells = [];
  for (let i = 0; i < firstDay; i++) monthCells.push(null);
  for (let i = 1; i <= daysInMonth; i++) monthCells.push(new Date(year, month, i));

  const weekCells = getWeekDays(currentDate).filter(d => d.getDay() !== 0 && d.getDay() !== 6);

  const listCells = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      listCells.push(d);
    }
  }

  const filteredTeam = teamMembers.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const dateStrForDay = formatDateStr(currentDate);
  const remoteUsersForDay = getRemoteUsersForDate(dateStrForDay);
  const isWeekendForDay = currentDate.getDay() === 0 || currentDate.getDay() === 6;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Workspace Hub</h2>
          <p className="text-sm text-slate-500">Manage team presence and organization.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleTabChange('schedule')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${adminTab === 'schedule' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Team Schedule
        </button>
        <button
          onClick={() => handleTabChange('team')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${adminTab === 'team' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <span className="flex items-center gap-2"><Users size={16} /> Team Roster</span>
        </button>
      </div>

      {adminTab === 'schedule' ? (
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
                <TooltipProvider>

                  {/* Week Days Header */}
                  <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 border-l border-slate-200">
                    {monthCells.map((date, idx) => {

                      // Empty Cell
                      if (!date) {
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="h-32 border-r border-b border-slate-100 bg-slate-50/50"
                          />
                        );
                      }

                      const dateStr = formatDateStr(date);
                      const isWeekend = idx % 7 === 0 || idx % 7 === 6;
                      const isToday = dateStr === formatDateStr(new Date());
                      const remoteUsers = getRemoteUsersForDate(dateStr);

                      return (
                        <div
                          key={date.toISOString()}
                          className={`h-32 p-2 border-r border-b border-slate-100 flex flex-col justify-between transition-colors
                            ${isWeekend
                              ? "bg-slate-50/50"
                              : "bg-white hover:bg-slate-50/50"
                            }`}
                        >
                          {/* Date and Today Badge */}
                          <div className="flex justify-between items-center w-full">
                            <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                              isToday 
                                ? 'bg-indigo-600 text-white font-bold' 
                                : 'text-slate-800'
                            }`}>
                              {date.getDate()}
                            </span>
                            {isToday && (
                              <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                TODAY
                              </span>
                            )}
                          </div>

                          {/* Remote Users Info / Office-Only */}
                          {!isWeekend ? (
                            <div className="flex-1 flex flex-col justify-center items-center gap-1.5">
                              {remoteUsers.length > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={<div className="w-full flex flex-col items-center gap-1 cursor-pointer" />}
                                  >
                                    {/* Remote Pill */}
                                    <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold hover:bg-emerald-100 transition-colors shadow-sm">
                                      <span>🏡</span>
                                      <span>Remote {remoteUsers.length}</span>
                                    </div>
                                    
                                    {/* Avatars */}
                                    <div className="flex items-center justify-center gap-1 mt-0.5">
                                      {remoteUsers.slice(0, 3).map((u) => (
                                        <Avatar key={u.id} className="h-5 w-5 border border-white">
                                          {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                                          <AvatarFallback className="text-[8px] bg-indigo-50 text-indigo-700 font-bold">
                                            {u.full_name.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {remoteUsers.length > 3 && (
                                        <span className="text-[10px] font-bold text-slate-500">
                                          +{remoteUsers.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>

                                  <TooltipContent side="top">
                                    <div className="space-y-1 min-w-[150px]">
                                      <p className="font-semibold text-xs border-b pb-1 mb-1">
                                        Remote Employees ({remoteUsers.length})
                                      </p>
                                      {remoteUsers.map((user: any) => (
                                        <div key={user.id} className="text-xs">
                                          {user.full_name}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold py-3">
                                  Office-Only
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                </TooltipProvider>
              </Card>
            </TabsContent>
            <TabsContent value="week" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {weekCells.map(date => {
                  const dateStr = formatDateStr(date);
                  const remoteUsers = getRemoteUsersForDate(dateStr);
                  const hasRemote = remoteUsers.length > 0;

                  return (
                    <Card 
                      key={date.toISOString()} 
                      className={`p-4 flex flex-col min-h-[240px] transition-all duration-200 border ${
                        hasRemote 
                          ? 'bg-emerald-50/20 border-emerald-200 shadow-[0_1px_3px_rgba(16,185,129,0.1)]' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-center pb-3 border-b border-slate-100 mb-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{date.getDate()}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{monthNames[date.getMonth()]}</p>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3 text-sm font-semibold text-slate-700">
                          <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400">Remote Status</span>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold">{remoteUsers.length}</Badge>
                        </div>

                        <div className="overflow-y-auto space-y-2 flex-1 max-h-[120px] pr-1">
                          {remoteUsers.length > 0 ? (
                            remoteUsers.map(u => (
                              <div key={u.id} className="flex items-center text-sm bg-white p-2 rounded-md border border-slate-100 shadow-sm">
                                <Avatar className="h-5 w-5 mr-2">
                                  <AvatarFallback className="text-[9px] bg-slate-200 font-semibold">
                                    {u.full_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-700 truncate">{u.full_name.split(' ')[0]}</span>
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-4">
                              All in Office
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="day" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {(() => {
                  const hasRemote = !isWeekendForDay && remoteUsersForDay.length > 0;
                  return (
                    <Card 
                      className={`p-4 flex flex-col min-h-[240px] transition-all duration-200 border ${
                        hasRemote 
                          ? 'bg-emerald-50/20 border-emerald-200 shadow-[0_1px_3px_rgba(16,185,129,0.1)]' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="text-center pb-3 border-b border-slate-100 mb-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{currentDate.getDate()}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{monthNames[currentDate.getMonth()]}</p>
                      </div>

                      {!isWeekendForDay ? (
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-3 text-sm font-semibold text-slate-700">
                            <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-400">Remote Status</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold">{remoteUsersForDay.length}</Badge>
                          </div>

                          <div className="overflow-y-auto space-y-2 flex-1 max-h-[120px] pr-1">
                            {remoteUsersForDay.length > 0 ? (
                              remoteUsersForDay.map(u => (
                                <div key={u.id} className="flex items-center text-sm bg-white p-2 rounded-md border border-slate-100 shadow-sm">
                                  <Avatar className="h-5 w-5 mr-2">
                                    <AvatarFallback className="text-[9px] bg-slate-200 font-semibold">
                                      {u.full_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-slate-700 truncate">{u.full_name.split(' ')[0]}</span>
                                </div>
                              ))
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-4">
                                All in Office
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex justify-center items-center">
                          <p className="text-sm text-slate-400 italic">Weekend</p>
                        </div>
                      )}
                    </Card>
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <Card className="overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Remote Count</th>
                      <th className="px-6 py-4 font-medium">Team Members (Remote)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listCells.map(date => {
                      const dateStr = formatDateStr(date);
                      const remoteUsers = getRemoteUsersForDate(dateStr);

                      return (
                        <tr key={dateStr} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            {remoteUsers.length > 0 ? (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                {remoteUsers.length} Remote
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">0 Remote</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {remoteUsers.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {remoteUsers.map(u => (
                                  <div key={u.id} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs font-medium text-slate-700">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-[8px] bg-slate-200">
                                        {u.full_name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {u.full_name.split(' ')[0]}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Everyone in office</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Team Roster</h2>
                <p className="text-sm text-slate-500">Manage your organization&apos;s team members.</p>
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search members..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="gap-2" onClick={() => setIsInviteDialogOpen(true)}>
                  <Plus size={16} /> Add Member
                </Button>
              </div>
            </div>

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">Initial Password</label>
                    <Input
                      id="password"
                      type="text"
                      placeholder="Password123!"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      disabled={isInviting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting} className="gap-2">
                      {isInviting && <Loader2 size={16} className="animate-spin" />}
                      Add Member
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <div className="rounded-md border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Team Member</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Password</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeam.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs border border-indigo-100">
                              {member.full_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-slate-900 block">{member.full_name}</span>
                            <span className="text-[10px] text-slate-500">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {member.role === 'admin' ? (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-50 gap-1">
                            <Shield size={12} /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-50 gap-1">
                            <User size={12} /> Employee
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 group">
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                            {showPasswords[member.id] ? member.password : '••••••••'}
                          </code>
                          <button
                            onClick={() => togglePasswordVisibility(member.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPasswords[member.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProfile(member.id)}
                          title="Remove Member"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTeam.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                        No team members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export function AdminDashboardClient(props: AdminDashboardClientProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-slate-500">Loading dashboard...</p></div>}>
      <AdminDashboardContent {...props} />
    </Suspense>
  )
}
