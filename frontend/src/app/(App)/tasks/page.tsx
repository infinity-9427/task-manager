'use client'

import { useState } from 'react'
import TaskTable from '@/components/task-table'
import ChatSidebar from '@/components/chat-sidebar'
import { RiTableLine, RiChatSmile3Line } from '@remixicon/react'
import { Button } from '@/components/ui/button'

export default function TasksPage() {
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="pt-4 sm:pt-6 pb-16 lg:pb-12">
            <div className="w-full px-3 sm:px-4 lg:px-6">
              {/* Header Section */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <RiTableLine className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tasks</h1>
                      <p className="text-xs sm:text-sm text-gray-600">Organize and track your team&apos;s work</p>
                    </div>
                  </div>
                  
                  {/* Mobile Chat Toggle */}
                  <Button
                    onClick={() => setShowMobileChat(true)}
                    className="lg:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-sm"
                    size="sm"
                  >
                    <RiChatSmile3Line className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <TaskTable />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Chat Sidebar */}
      <ChatSidebar />
      
      {/* Mobile Chat Overlay */}
      {showMobileChat && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800"># general</h3>
                </div>
                <Button
                  onClick={() => setShowMobileChat(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              {/* Mobile Chat Content */}
              <div className="flex-1 overflow-hidden">
                <ChatSidebar isMobile />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}