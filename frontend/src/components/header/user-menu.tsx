'use client'

import { memo } from 'react'
import { 
  RiUser3Line, 
  RiLogoutBoxLine, 
  RiSettings3Line, 
  RiChat3Line,
  RiTaskLine
} from '@remixicon/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface User {
  id: number;
  email: string;
  name: string;
}

interface UserMenuProps {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
}

const UserMenu = memo<UserMenuProps>(function UserMenu({ user, isAuthenticated }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  // Generate avatar color based on email - Professional McKinsey-style palette
  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-gradient-to-br from-slate-600 to-slate-700', // Professional gray
      'bg-gradient-to-br from-blue-600 to-blue-700',   // Corporate blue
      'bg-gradient-to-br from-emerald-600 to-emerald-700', // Success green
      'bg-gradient-to-br from-violet-600 to-violet-700',   // Premium purple
      'bg-gradient-to-br from-amber-600 to-amber-700',     // Warm amber
      'bg-gradient-to-br from-rose-600 to-rose-700',       // Elegant rose
      'bg-gradient-to-br from-teal-600 to-teal-700',       // Professional teal
      'bg-gradient-to-br from-indigo-600 to-indigo-700',   // Deep indigo
      'bg-gradient-to-br from-cyan-600 to-cyan-700',       // Modern cyan
      'bg-gradient-to-br from-orange-600 to-orange-700'    // Energetic orange
    ];
    const hash = email?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  // Get first letter of email
  const getInitial = (email: string) => {
    return email?.charAt(0)?.toUpperCase() || 'U';
  };

  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-0">
            <div className={`w-full h-full rounded-full ${getAvatarColor(user?.email || '')} flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-white/20 hover:shadow-xl hover:ring-2 hover:ring-white/30 transition-all duration-300`}>
              <span className="text-white text-sm font-bold tracking-tight drop-shadow-sm select-none">
                {getInitial(user?.email || '')}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || 'No email'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/tasks" className="cursor-pointer">
              <RiTaskLine className="mr-2 h-4 w-4" />
              <span>Tasks</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/chat" className="cursor-pointer">
              <RiChat3Line className="mr-2 h-4 w-4" />
              <span>Messages</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RiSettings3Line className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <RiLogoutBoxLine className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Link href="/auth?mode=login">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-10 transition-colors hover:bg-blue-50 hover:border-blue-200"
      >
        <RiUser3Line className="w-4 h-4 mr-2" />
        Login
      </Button>
    </Link>
  )
})

export default UserMenu