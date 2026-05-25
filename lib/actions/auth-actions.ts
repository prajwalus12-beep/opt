'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function loginEmployee(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get role and redirect accordingly
  if (data.user) {
    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
      select: { role: true }
    })
    
    if (profile?.role === 'admin') {
      redirect('/admin/presence')
    }
  }

  redirect('/dashboard/presence')
}

export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Validate role
  if (data.user) {
    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
      select: { role: true }
    })
    
    if (profile?.role !== 'admin') {
      // Sign out if not admin
      await supabase.auth.signOut()
      return { error: 'Unauthorized access. Admin privileges required.' }
    }
  }

  redirect('/admin/presence')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}
