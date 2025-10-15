'use client'

import { memo } from 'react'
import Link from 'next/link'
import { APP_CONFIG, ROUTES } from '@/lib/constants'

const BrandLogo = memo(function BrandLogo() {
  return (
    <div className="flex-shrink-0">
      <Link 
        href={ROUTES.home} 
        className="text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors"
      >
        {APP_CONFIG.name}
      </Link>
    </div>
  )
})

export default BrandLogo