'use client'

import { useTasks } from '@/hooks/use-tasks'
import { TaskStatus } from '@/types'
import { 
  RiCheckboxCircleLine,
  RiTimeLine,
  RiTeamLine,
  RiTableLine,
  RiFilterLine,
  RiOrganizationChart,
  RiStackLine,
  RiLineChartLine
} from '@remixicon/react'
import Link from 'next/link'

export default function HomePage() {
0


  const features = [
    {
      icon: RiTableLine,
      title: 'Advanced Data Table',
      description: 'Professional table interface with sorting, filtering, and bulk operations',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: RiOrganizationChart,
      title: 'Nested Task Hierarchy',
      description: 'Organize complex projects with parent tasks and unlimited subtask levels',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: RiFilterLine,
      title: 'Smart Filtering',
      description: 'Advanced filters by status, priority, assignee, and custom search',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: RiTeamLine,
      title: 'Team Collaboration',
      description: 'Assign tasks to team members and track progress across projects',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center">

            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Task
              <span className="text-blue-600 block">Management Platform</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your workflow with our comprehensive task management solution. 
              Built for teams that demand efficiency, transparency, and results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/tasks"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
               Go to Dashboard
              </Link>
              
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start">
                <div className={`${feature.bgColor} ${feature.color} p-3 rounded-lg flex-shrink-0`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
