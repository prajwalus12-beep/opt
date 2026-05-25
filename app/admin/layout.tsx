import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  // Get user role dynamically
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  // Protect admin routes
  if (profile?.role !== 'admin') {
    redirect('/dashboard/presence')
  }

  return (
    <AppLayout role="admin" userEmail={user.email}>
      {children}
    </AppLayout>
  )
}
