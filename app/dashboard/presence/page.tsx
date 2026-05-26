import { DashboardClient } from '@/components/presence/dashboard-client'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard - Office Presence Tracker',
  description: 'Manage your remote working days.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  // Redirect admins to the admin dashboard
  if (profile?.role === 'admin') {
    redirect('/admin/presence')
  }

  let initialRemoteDates: string[] = []
  
  if (user) {
    const data = await prisma.remoteWorkEntry.findMany({
      where: { user_id: user.id },
      select: { work_date: true }
    })
      
    initialRemoteDates = data.map(d => format(d.work_date, 'yyyy-MM-dd'))
  }

  return (
    <DashboardClient 
      initialRemoteDates={initialRemoteDates} 
      userId={user.id}
    />
  )
}
