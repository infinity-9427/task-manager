'use client'

import TaskTable from '@/components/task-table'
import { RiTableLine } from '@remixicon/react'

export default function TasksPage() {
  return (
    <div className="pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <RiTableLine className="h-6 w-6 text-gray-600" />
          <div>
            <p className="text-gray-600">Organize and track your tasks </p>
          </div>
        </div>
        
        <TaskTable />
      </div>
    </div>
  )
}