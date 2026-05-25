import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user role dynamically
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  const role = (profile?.role || 'employee') as 'admin' | 'employee'

  return (
    <AppLayout role={role} userEmail={user.email}>
      {children}
    </AppLayout>
  )
}
