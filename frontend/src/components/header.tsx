'use client'

import BrandLogo from '@/components/header/brand-logo'
import SearchBar from '@/components/header/search-bar'
import UserMenu from '@/components/header/user-menu'
import { useAuth } from '@/contexts/auth-context'

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <BrandLogo />
        <SearchBar />
        <UserMenu user={user} isAuthenticated={isAuthenticated} />
      </div>
    </header>
  )
}