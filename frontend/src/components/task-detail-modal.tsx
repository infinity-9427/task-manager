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
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0" showCloseButton={false}>
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {task.title}
                  </DialogTitle>
                  {/* Priority badge - Only for parent tasks */}
                  {!task.parentId && (
                    <Badge className={`${priorityConfig.color} text-xs font-semibold px-2 py-1`}>
                      <RiFlagLine className="w-3 h-3 mr-1" />
                      {priorityConfig.label}
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {task.description}
                  </p>
                )}
                {task.parentId && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Subtask
                    </Badge>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-gray-100 transition-colors"
              >
                <RiCloseLine className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <Accordion type="multiple" defaultValue={["status", "details", "subtasks"]} className="space-y-4">
            
            {/* Status Information */}
            <AccordionItem value="status" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full ${statusConfig.dotColor}`} />
                  </div>
                  <span className="text-lg font-semibold">Task Status</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${statusConfig.color}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotColor}`} />
                    <span>{statusConfig.label}</span>
                  </div>
                  {task.completed && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-300">
                      <RiCheckLine className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Task Details */}
            <AccordionItem value="details" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <RiFlagLine className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-lg font-semibold">Task Details</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assignee - Only for parent tasks */}
                  {!task.parentId && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <RiUser3Line className="h-4 w-4" />
                        Assignee
                      </label>
                      {task.assignee ? (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                            {task.assignee.name?.charAt(0)?.toUpperCase() || task.assignee.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{task.assignee.name}</div>
                            <div className="text-sm text-gray-500">{task.assignee.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-500">Unassigned</div>
                      )}
                    </div>
                  )}

                  {/* Due Date */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <RiCalendarLine className="h-4 w-4" />
                      Due Date
                    </label>
                    {task.dueDate ? (
                      <div className={`p-3 rounded-lg ${
                        isOverdue(task.dueDate) && !task.completed
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-gray-50'
                      }`}>
                        <div className={`font-medium ${
                          isOverdue(task.dueDate) && !task.completed
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {formatDate(task.dueDate)}
                        </div>
                        {isOverdue(task.dueDate) && !task.completed && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-500">No due date set</div>
                    )}
                  </div>

                  {/* Created */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <RiTimeLine className="h-4 w-4" />
                      Created
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{formatDateTime(task.createdAt)}</div>
                      {task.createdBy && (
                        <div className="text-sm text-gray-500 mt-1">by {task.createdBy.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Priority - Only for parent tasks */}
                  {!task.parentId && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <RiFlagLine className="h-4 w-4" />
                        Priority
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Badge className={`${priorityConfig.color} text-sm font-medium`}>
                          <RiFlagLine className="w-3 h-3 mr-1" />
                          {priorityConfig.label}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Subtasks */}
            {hasSubtasks && (
              <AccordionItem value="subtasks" className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <RiCheckLine className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-lg font-semibold">Subtasks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 font-medium">
                        {completedSubtasks}/{subtasks.length} completed
                      </Badge>
                      <div className="w-20 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${subtasks.length ? (completedSubtasks / subtasks.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-3">
                    {subtasks.map((subtask, index) => (
                      <Card key={subtask.id} className={`transition-all duration-200 ${
                        subtask.completed 
                          ? 'bg-green-50 border-green-200 shadow-sm' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              subtask.completed
                                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                : 'border-gray-300'
                            }`}>
                              <RiCheckLine className={`w-3.5 h-3.5 ${subtask.completed ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`font-medium ${
                                    subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {subtask.title}
                                  </h4>
                                  {subtask.description && (
                                    <p className={`text-sm mt-1 ${
                                      subtask.completed ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {subtask.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-3 mt-2">
                                    {subtask.dueDate && (
                                      <div className={`text-xs flex items-center gap-1 ${
                                        isOverdue(subtask.dueDate) && !subtask.completed
                                          ? 'text-red-600'
                                          : 'text-gray-500'
                                      }`}>
                                        <RiCalendarLine className="w-3 h-3" />
                                        {formatDate(subtask.dueDate)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  )
}