import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Admin Login - Office Presence Tracker',
  description: 'Admin login for Office Presence Tracker',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Workspace Admin</h1>
          <p className="text-sm text-slate-400 mt-2">Manage team presence</p>
        </div>
        <LoginForm isAdmin />
      </div>
    </div>
  )
}
