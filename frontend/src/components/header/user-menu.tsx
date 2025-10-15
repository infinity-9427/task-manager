'use client'

import { memo } from 'react'
import { RiUser3Line } from '@remixicon/react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { AuthState } from '@/types'
import { ROUTES } from '@/lib/constants'

interface UserMenuProps {
  readonly authState: AuthState
}

const UserMenu = memo<UserMenuProps>(function UserMenu({ authState }) {
  if (authState.isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
          {authState.user?.avatar ? (
            <Image 
              src={authState.user.avatar} 
              alt={authState.user.name || 'User'} 
              width={32} 
              height={32} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <RiUser3Line className="w-5 h-5 text-purple-600" />
          )}
        </div>
        {authState.user?.name && (
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {authState.user.name}
          </span>
        )}
      </div>
    )
  }

  return (
    <Link href={ROUTES.login}>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-10 transition-colors hover:bg-purple-50 hover:border-purple-200"
      >
        Login
      </Button>
    </Link>
  )
})

export default UserMenu