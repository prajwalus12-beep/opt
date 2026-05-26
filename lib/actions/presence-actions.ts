'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function inviteMember(email: string, fullName: string, password?: string, role: string = 'employee') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if admin
  const adminProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    return { error: 'Admin service key not configured' }
  }

  // Initialize Supabase Admin Client
  const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey)

  const finalPassword = password || 'Password123!'

  try {
    // Create user in Supabase Auth using the admin API
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    })

    if (error) {
      return { error: error.message }
    }

    // Use upsert to avoid race conditions with the handle_new_user trigger
    if (authData?.user) {
      await prisma.profile.upsert({
        where: { id: authData.user.id },
        update: {
          password: finalPassword,
          role: role,
          full_name: fullName,
          email: email
        },
        create: {
          id: authData.user.id,
          full_name: fullName,
          email: email,
          password: finalPassword,
          role: role
        }
      })
    }

    revalidatePath('/admin/presence')
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return { error: message }
  }
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  try {
    // Update Supabase Auth password
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    })

    if (authError) return { error: authError.message }

    // Update profile password
    await prisma.profile.update({
      where: { id: user.id },
      data: { password: password }
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return { error: message }
  }
}

export async function toggleRemoteStatus(date: Date, isCurrentlyRemote: boolean, userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const targetUserId = userId || user.id
  const normalizedDate = startOfDay(date)

  try {
    if (isCurrentlyRemote) {
      // Revert to office: delete entry using compound unique key (avoids prior findUnique query)
      await prisma.remoteWorkEntry.delete({
        where: {
          user_id_work_date: {
            user_id: targetUserId,
            work_date: normalizedDate,
          }
        }
      })
    } else {
      // Mark remote: create entry (avoids prior findUnique query)
      await prisma.remoteWorkEntry.create({
        data: {
          user_id: targetUserId,
          work_date: normalizedDate,
        }
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return { error: message }
  }

  // Targeted revalidation: Only revalidate the path that is actually affected to avoid heavy
  // and slow server-side re-rendering of pages for unchanged dashboards.
  if (userId) {
    revalidatePath('/admin/presence')
  } else {
    revalidatePath('/dashboard/presence')
  }
  
  return { success: true }
}

export async function deleteProfile(profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if admin
  const adminProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (adminProfile?.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    // Delete from Supabase Auth if service key is available
    if (supabaseServiceKey) {
      const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey)
      await supabaseAdmin.auth.admin.deleteUser(profileId)
    }

    // Delete profile (will cascade to remote_work_entries due to Prisma/DB constraint)
    // Even if the cascade from auth.users works, doing it explicitly ensures consistency.
    // We use deleteMany instead of delete to avoid throwing if it's already gone due to cascade.
    await prisma.profile.deleteMany({
      where: { id: profileId }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return { error: message }
  }

  revalidatePath('/admin/presence')
  return { success: true }
}

export async function getEmployeePresence(monthStr: string, userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const targetUserId = userId || user.id
  
  // Parse month string YYYY-MM
  const date = new Date(`${monthStr}-01`)
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)

  const entries = await prisma.remoteWorkEntry.findMany({
    where: {
      user_id: targetUserId,
      work_date: {
        gte: startDate,
        lte: endDate,
      }
    },
    select: { work_date: true }
  })

  return entries.map(d => format(d.work_date, 'yyyy-MM-dd'))
}

// For Admin: Get all remote entries for a date range
export async function getAllPresence(startDate: string, endDate: string) {
  const entries = await prisma.remoteWorkEntry.findMany({
    where: {
      work_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    },
    include: {
      profile: {
        select: {
          id: true,
          full_name: true,
          avatar_url: true,
        }
      }
    }
  })

  // Map to match the expected format in client components
  return entries.map(entry => ({
    work_date: format(entry.work_date, 'yyyy-MM-dd'),
    profiles: entry.profile
  }))
}
