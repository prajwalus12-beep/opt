import { AdminDashboardClient } from '@/components/presence/admin-dashboard-client'
import { getAllPresence } from '@/lib/actions/presence-actions'
import { prisma } from '@/lib/prisma'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

export const metadata = {
  title: 'Admin Dashboard - Office Presence Tracker',
  description: 'Monitor team office presence.',
}

export default async function AdminPresencePage() {
  // Fetch current month, previous and next to give some buffer
  const now = new Date()
  const startDate = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(addMonths(now, 1)), 'yyyy-MM-dd')

  const remoteEntries = await getAllPresence(startDate, endDate)
  
  // Fetch all profiles for the team roster/filtering
  const teamMembers = await prisma.profile.findMany({
    select: {
      id: true,
      full_name: true,
      avatar_url: true,
      email: true,
      role: true,
      password: true,
    },
    orderBy: {
      full_name: 'asc'
    }
  })

  return (
    <AdminDashboardClient 
      remoteEntries={remoteEntries} 
      teamMembers={teamMembers} 
    />
  )
}
