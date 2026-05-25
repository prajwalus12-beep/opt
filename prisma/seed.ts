import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables for seeding:')
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL is missing')
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY is missing')
  console.error('\nPlease ensure these are defined in your .env file.')
  process.exit(1)
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const adminEmail = 'admin@example.com'
  const adminPassword = 'password123'

  console.log('🌱 Starting seed...')

  // Check if admin profile already exists
  const existingAdmin = await prisma.profile.findFirst({
    where: { role: 'admin' }
  })

  if (existingAdmin) {
    console.log('✅ Admin already exists. Skipping seed.')
    return
  }

  console.log('🚀 Creating initial admin user...')

  // Create user in Supabase Auth using the admin API
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'System Admin',
      role: 'admin'
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('⚠️ Auth user exists, but profile was missing. Attempting to find and update...')
      
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
      const user = userData.users.find(u => u.email === adminEmail)
      
      if (user) {
        await prisma.profile.upsert({
          where: { id: user.id },
          update: { role: 'admin' },
          create: {
            id: user.id,
            email: user.email!,
            full_name: 'System Admin',
            role: 'admin'
          }
        })
        console.log('✅ Profile updated/created for existing user.')
      }
    } else {
      console.error('❌ Error creating admin:', error.message)
    }
  } else {
    console.log(`🎉 Admin created successfully: ${adminEmail}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
