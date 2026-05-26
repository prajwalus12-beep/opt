'use client'

import Link from 'next/link'
import { Home, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/actions/auth-actions'

interface AppLayoutProps {
  children: React.ReactNode
  role: 'employee' | 'admin'
  userEmail?: string
}

export function AppLayout({ children, role, userEmail }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header with App Logo and Navigation/User Menu */}
      <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5 text-indigo-600" />
          <span className="text-slate-900 tracking-tight">Workspace Hub</span>
        </Link>
        
        <div className="w-full flex-1">
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700">
                    {userEmail?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{role === 'admin' ? 'Admin Account' : 'My Account'}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={logout}>
              <button type="submit" className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      
      {/* Main Content Area */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8 bg-slate-50/30">
        {children}
      </main>
    </div>
  )
}
