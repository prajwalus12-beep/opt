'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, CalendarDays, Users, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/actions/auth-actions'

interface AppLayoutProps {
  children: React.ReactNode
  role: 'employee' | 'admin'
  userEmail?: string
}

function NavLinks({ navItems, pathname, onNavItemClick }: { 
  navItems: { href: string, label: string, icon: any }[], 
  pathname: string,
  onNavItemClick: () => void 
}) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  return (
    <div className="flex flex-col gap-2">
      {navItems.map((item) => {
        // Split href into path and query to correctly match both parts
        const [itemPath, itemQuery] = item.href.split('?')
        const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null

        // Active if path matches AND tab param matches (or both have no tab)
        const isActive = pathname === itemPath && currentTab === itemTab

        return (
          <Link
            key={item.href}
            href={item.href}
            scroll={false}
            onClick={onNavItemClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive 
                ? 'bg-slate-100 text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function AppLayout({ children, role, userEmail }: AppLayoutProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navItems = role === 'admin' 
    ? [
        { href: '/admin/presence', label: 'Team Schedule', icon: CalendarDays },
        { href: '/admin/presence?tab=team', label: 'Team Roster', icon: Users },
      ]
    : [
        { href: '/dashboard/presence', label: 'My Schedule', icon: CalendarDays },
      ]

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for Desktop */}
      <div className="hidden border-r bg-slate-50/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Home className="h-5 w-5 text-indigo-600" />
              <span className="text-slate-900 tracking-tight">Workspace Hub</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLinks 
                navItems={navItems} 
                pathname={pathname} 
                onNavItemClick={() => {}} 
              />
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Home className="h-5 w-5 text-indigo-600" />
                  <span>Workspace Hub</span>
                </Link>
                <NavLinks 
                  navItems={navItems} 
                  pathname={pathname} 
                  onNavItemClick={() => setIsMobileOpen(false)} 
                />
              </nav>
            </SheetContent>
          </Sheet>
          
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
        
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8 bg-slate-50/30">
          {children}
        </main>
      </div>
    </div>
  )
}
