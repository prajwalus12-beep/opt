'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginEmployee, loginAdmin } from '@/lib/actions/auth-actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface LoginFormProps {
  isAdmin?: boolean
}

export function LoginForm({ isAdmin = false }: LoginFormProps) {
  const [loading, setLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    const result = isAdmin 
      ? await loginAdmin(formData)
      : await loginEmployee(formData)

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    }
    // Note: redirect is handled in the server action if successful
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isAdmin ? 'Admin Login' : 'Employee Login'}</CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'Sign in to access the admin dashboard.' 
            : 'Sign in to manage your remote working days.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
