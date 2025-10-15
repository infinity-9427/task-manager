'use client'

import { memo } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { RiBarChartLine } from '@remixicon/react'

const BrandLogo = memo(function BrandLogo() {
  return (
    <div className="flex-shrink-0">
      <Link 
        href={ROUTES.home} 
        className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
      >
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <RiBarChartLine className="w-5 h-5" />
        </div>
        <span>TaskPro</span>
      </Link>
    </div>
  )
})

export default BrandLogo