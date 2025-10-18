'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RiCalendarLine,
  RiUser3Line,
  RiFlagLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseLine
} from '@remixicon/react'
import { Task, TaskStatus } from '@/types'
import { TASK_PRIORITIES } from '@/lib/constants'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

const STATUS_CONFIG = {
  [TaskStatus.TO_DO]: {
    label: 'To Do',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    dotColor: 'bg-gray-400'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500'
  },
  [TaskStatus.COMPLETED]: {
    label: 'Done',
    color: 'bg-green-100 text-green-700 border-green-200',
    dotColor: 'bg-green-500'
  }
}

export default function TaskDetailModal({ 
  task, 
  isOpen, 
  onClose
}: TaskDetailModalProps) {
  if (!task) return null

  const getTaskStatus = (task: Task): TaskStatus => {
    if (task.status) return task.status
    if (task.completed) return TaskStatus.COMPLETED
    return TaskStatus.TO_DO
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: new Date(dateString).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const taskStatus = getTaskStatus(task)
  const statusConfig = STATUS_CONFIG[taskStatus]
  const priorityConfig = TASK_PRIORITIES[task.priority]
  const subtasks = task.subtasks || task.children || []
  const hasSubtasks = subtasks.length > 0
  const completedSubtasks = subtasks.filter(child => child.completed).length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-2xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden p-0 bg-white border shadow-xl" showCloseButton={false}>
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <DialogHeader className="relative p-4 sm:p-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-medium text-white mb-2 leading-tight break-words">
                      {task.title}
                    </DialogTitle>
                    {task.description && (
                      <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-light break-words">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {/* Priority badge - Only for parent tasks */}
                  {!task.parentId && (
                    <div className="flex-shrink-0 mt-2 sm:mt-0">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white font-medium text-xs sm:text-sm">
                        <RiFlagLine className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 opacity-80" />
                        {priorityConfig.label}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    statusConfig.color.includes('gray') 
                      ? 'bg-white/20 text-white' 
                      : statusConfig.color.includes('blue') 
                        ? 'bg-blue-500/20 text-blue-100' 
                        : 'bg-green-500/20 text-green-100'
                  }`}>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 bg-white" />
                    {statusConfig.label}
                  </div>
                  {task.parentId && (
                    <Badge className="bg-white/20 text-white border-white/30 text-xs px-2 py-1">
                      Subtask
                    </Badge>
                  )}
                  {task.completed && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-emerald-500/20 text-emerald-100">
                      <RiCheckLine className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/20 rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 flex-shrink-0"
              >
                <RiCloseLine className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Task Insights */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/50">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white" />
                  </div>
                  <span className="truncate">Task Overview</span>
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 ${
                      statusConfig.color.includes('gray') 
                        ? 'bg-slate-100' 
                        : statusConfig.color.includes('blue') 
                          ? 'bg-blue-50' 
                          : 'bg-emerald-50'
                    }`}>
                      <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full ${statusConfig.dotColor}`} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Status</p>
                    <p className="text-sm sm:text-lg font-semibold text-slate-900">{statusConfig.label}</p>
                  </div>
                  {!task.parentId && (
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 ${
                        priorityConfig.color.includes('red') 
                          ? 'bg-red-50' 
                          : priorityConfig.color.includes('orange') 
                            ? 'bg-orange-50' 
                            : priorityConfig.color.includes('yellow') 
                              ? 'bg-yellow-50' 
                              : 'bg-slate-50'
                      }`}>
                        <RiFlagLine className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Priority</p>
                      <p className="text-sm sm:text-lg font-semibold text-slate-900">{priorityConfig.label}</p>
                    </div>
                  )}
                  {task.completed && (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-50 mb-2 sm:mb-3">
                        <RiCheckLine className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Completion</p>
                      <p className="text-sm sm:text-lg font-semibold text-emerald-600">Completed</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/50">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                    <RiFlagLine className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="truncate">Task Details</span>
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Assignee - Only for parent tasks */}
                  {!task.parentId && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <RiUser3Line className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                        <label className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide uppercase">
                          Assignee
                        </label>
                      </div>
                      {task.assignee ? (
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm sm:text-lg shadow-md">
                            {task.assignee.name?.charAt(0)?.toUpperCase() || task.assignee.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm sm:text-base text-slate-900 truncate">{task.assignee.name}</div>
                            <div className="text-xs sm:text-sm text-slate-500 truncate">{task.assignee.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl text-slate-500 text-center border border-slate-200/50">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-2">
                            <RiUser3Line className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium">Unassigned</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Due Date */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2">
                      <RiCalendarLine className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide uppercase">
                        Due Date
                      </label>
                    </div>
                    {task.dueDate ? (
                      <div className={`p-3 sm:p-4 rounded-xl border ${
                        isOverdue(task.dueDate) && !task.completed
                          ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200 shadow-sm'
                          : 'bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200/50'
                      }`}>
                        <div className={`font-semibold text-sm sm:text-lg ${
                          isOverdue(task.dueDate) && !task.completed
                            ? 'text-red-700'
                            : 'text-slate-900'
                        }`}>
                          {formatDate(task.dueDate)}
                        </div>
                        {isOverdue(task.dueDate) && !task.completed && (
                          <div className="inline-flex items-center mt-2 sm:mt-3 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                            Overdue
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-xl text-slate-500 text-center border border-slate-200/50">
                        <RiCalendarLine className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 mx-auto mb-2" />
                        <span className="text-xs sm:text-sm font-medium">No due date set</span>
                      </div>
                    )}
                  </div>

                  {/* Created */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2">
                      <RiTimeLine className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide uppercase">
                        Created
                      </label>
                    </div>
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                      <div className="font-semibold text-sm sm:text-base text-slate-900">{formatDateTime(task.createdAt)}</div>
                      {task.createdBy && (
                        <div className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">by {task.createdBy.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Priority - Only for parent tasks */}
                  {!task.parentId && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2">
                        <RiFlagLine className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                        <label className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide uppercase">
                          Priority
                        </label>
                      </div>
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${priorityConfig.color}`}>
                          <RiFlagLine className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                          {priorityConfig.label}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subtasks */}
            {hasSubtasks && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                        <RiCheckLine className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <span className="truncate">Subtasks</span>
                    </h3>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-xs sm:text-sm font-semibold text-slate-600">
                        {completedSubtasks} of {subtasks.length} completed
                      </div>
                      <div className="w-20 sm:w-24 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${subtasks.length ? (completedSubtasks / subtasks.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className={`group p-4 sm:p-5 rounded-xl border transition-all duration-300 ${
                        subtask.completed 
                          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-sm' 
                          : 'bg-gradient-to-r from-slate-50 to-slate-100/30 border-slate-200/50 hover:shadow-md hover:border-slate-300/50'
                      }`}>
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            subtask.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                              : 'border-slate-300 group-hover:border-slate-400'
                          }`}>
                            <RiCheckLine className={`w-3 h-3 sm:w-4 sm:h-4 transition-opacity duration-200 ${subtask.completed ? 'opacity-100' : 'opacity-0'}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-sm sm:text-base transition-all duration-200 break-words ${
                                  subtask.completed ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}>
                                  {subtask.title}
                                </h4>
                                {subtask.description && (
                                  <p className={`text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed transition-all duration-200 break-words ${
                                    subtask.completed ? 'text-slate-400' : 'text-slate-600'
                                  }`}>
                                    {subtask.description}
                                  </p>
                                )}
                                
                                {subtask.dueDate && (
                                  <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                      isOverdue(subtask.dueDate) && !subtask.completed
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      <RiCalendarLine className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      {formatDate(subtask.dueDate)}
                                    </div>
                                    {isOverdue(subtask.dueDate) && !subtask.completed && (
                                      <span className="text-xs font-semibold text-red-600 px-2 py-1 bg-red-50 rounded-full">Overdue</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}