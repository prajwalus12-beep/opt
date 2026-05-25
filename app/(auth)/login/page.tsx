import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login - Office Presence Tracker',
  description: 'Employee login for Office Presence Tracker',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspace Hub</h1>
          <p className="text-sm text-slate-500 mt-2">Manage your remote working days</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
