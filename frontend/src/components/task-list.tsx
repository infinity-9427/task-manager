'use client'

import { useState } from 'react'
import { RiCheckLine, RiTimeLine, RiDeleteBin6Line, RiFlagLine, RiArrowDownSLine, RiArrowRightSLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// Temporarily removing accordion to isolate infinite loop issue
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion'
import { useTasks, useDeleteTask, useToggleTask } from '@/hooks/use-tasks'
import { useSearchContext } from '@/contexts/search-context'
import { useTaskSearch } from '@/hooks/use-search'
import { TASK_PRIORITIES } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'
import { safeMap, safeGet } from '@/lib/error-utils'
import { Task } from '@/types'

export default function TaskList() {
  const { data: allTasks = [], isLoading, isError, error } = useTasks()
  const { searchQuery } = useSearchContext()
  const { filteredTasks, isSearching } = useTaskSearch(allTasks, searchQuery)
  const deleteTaskMutation = useDeleteTask()
  const toggleTaskMutation = useToggleTask()
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  // Safe task filtering - ensure we only work with valid task objects
  const safeAllTasks = safeMap(allTasks, (task: Task) => task).filter(
    (task): task is Task => 
      task && 
      typeof task === 'object' && 
      typeof task.id !== 'undefined' && 
      typeof task.title === 'string'
  )

  const handleDeleteTask = () => {
    if (deleteTaskId) {
      const taskIdNumber = parseInt(deleteTaskId)
      if (!isNaN(taskIdNumber) && taskIdNumber > 0) {
        deleteTaskMutation.mutate(taskIdNumber, {
          onSuccess: () => setDeleteTaskId(null)
        })
      }
    }
  }

  const formatDate = (dateString?: string): string => {
    try {
      if (!dateString) return 'No date'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    } catch (error) {
      console.warn('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const isOverdue = (dueDate?: string): boolean => {
    try {
      if (!dueDate) return false
      const due = new Date(dueDate)
      const now = new Date()
      return !isNaN(due.getTime()) && due < now
    } catch (error) {
      console.warn('Error checking overdue status:', error)
      return false
    }
  }

  // Handle error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-2">Failed to load tasks</div>
        <div className="text-gray-500 text-sm mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <Skeleton className="w-5 h-5 rounded border-2" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Show search results or all tasks with safe filtering
  const tasksToShow = isSearching ? 
    safeMap(filteredTasks || [], (task: Task) => task) : 
    safeAllTasks

  // Handle empty states
  if (tasksToShow.length === 0) {
    if (isSearching) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">
            No tasks match &ldquo;{searchQuery}&rdquo;. Try a different search term.
          </div>
        </div>
      )
    }
    
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No tasks yet</div>
        <div className="text-gray-400 text-sm">Create your first task to get started!</div>
      </div>
    )
  }

  const highlightMatch = (text?: string, query?: string): React.JSX.Element => {
    try {
      // Safe handling of undefined/null values
      const safeText = text || ''
      const safeQuery = query?.trim() || ''
      
      if (!safeQuery || !isSearching) {
        return <span>{safeText}</span>
      }
      
      const regex = new RegExp(`(${safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      const parts = safeText.split(regex)
      
      return (
        <span>
          {parts.map((part, index) => 
            regex.test(part) ? (
              <mark key={`highlight-${index}`} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
                {part}
              </mark>
            ) : (
              <span key={`text-${index}`}>{part}</span>
            )
          )}
        </span>
      )
    } catch (error) {
      console.warn('Error highlighting text:', error)
      return <span>{text || ''}</span>
    }
  }

  const renderTaskItem = (task: Task, isSubtask = false, depth = 0) => {
    // Prevent infinite recursion - limit depth to 1 level
    if (depth > 1) {
      return null
    }
    const taskId = safeGet(task, 'id', null)
    const taskTitle = safeGet(task, 'title', 'Untitled Task')
    const taskDescription = safeGet(task, 'description', '')
    const taskCompleted = safeGet(task, 'completed', false)
    const taskPriority = safeGet(task, 'priority', 'medium')
    const taskCreatedAt = safeGet(task, 'createdAt', '')
    const taskDueDate = safeGet(task, 'dueDate', null)
    const subtasks = safeGet(task, 'subtasks', []) || []

    if (!taskId) {
      console.warn('Task missing ID:', task)
      return null
    }

    const priorityConfig = TASK_PRIORITIES[taskPriority] || TASK_PRIORITIES.medium
    const hasSubtasks = subtasks.length > 0
    const completedSubtasks = subtasks.filter(st => safeGet(st, 'completed', false)).length

    return (
      <div
        key={`task-${taskId}`}
        className={`bg-white rounded-lg border border-gray-200 ${
          isSubtask ? 'ml-6 border-l-4 border-l-blue-200' : ''
        } hover:shadow-md hover:border-gray-300 transition-all duration-200 ease-in-out ${
          taskCompleted ? 'opacity-75 bg-gray-50' : ''
        }`}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <button
              onClick={() => {
                if (taskId && typeof taskId === 'number') {
                  toggleTaskMutation.mutate(taskId)
                }
              }}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 ${
                taskCompleted
                  ? 'bg-green-500 border-green-500 text-white shadow-sm scale-100'
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50 active:scale-95'
              }`}
              disabled={toggleTaskMutation.isPending}
              aria-label={taskCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <RiCheckLine 
                className={`w-3 h-3 transition-all duration-200 ease-in-out ${
                  taskCompleted 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-50'
                }`}
              />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <h3
                    className={`text-sm font-medium transition-all duration-300 ease-in-out ${
                      taskCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                    } ${isSubtask ? 'text-sm' : 'text-base'}`}
                  >
                    {highlightMatch(taskTitle, searchQuery)}
                  </h3>
                  {hasSubtasks && !isSubtask && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {completedSubtasks}/{subtasks.length} subtasks
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      priorityConfig.color
                    }`}
                  >
                    <RiFlagLine className="w-3 h-3 mr-1" />
                    {priorityConfig.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (taskId) {
                        setDeleteTaskId(taskId.toString())
                      }
                    }}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 ease-in-out"
                    aria-label="Delete task"
                  >
                    <RiDeleteBin6Line className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {taskDescription && (
                <p
                  className={`text-sm mb-2 transition-all duration-300 ease-in-out ${
                    taskCompleted ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {highlightMatch(taskDescription, searchQuery)}
                </p>
              )}

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Created {formatDate(taskCreatedAt)}</span>
                {taskDueDate && (
                  <div className="flex items-center space-x-1">
                    <RiTimeLine className="w-3 h-3" />
                    <span
                      className={
                        isOverdue(taskDueDate) && !taskCompleted
                          ? 'text-red-500 font-medium'
                          : ''
                      }
                    >
                      Due {formatDate(taskDueDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasSubtasks && !isSubtask && subtasks.length > 0 && (
          <div className="border-t border-gray-100 mt-3">
            <button
              onClick={() => toggleTaskExpansion(taskId)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Subtasks ({completedSubtasks}/{subtasks.length} completed)
                </span>
              </div>
              {expandedTasks.has(taskId) ? (
                <RiArrowDownSLine className="w-4 h-4 text-gray-500" />
              ) : (
                <RiArrowRightSLine className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {expandedTasks.has(taskId) && (
              <div className="space-y-2 px-4 py-3">
                {subtasks.map((subtask, index) => (
                  <div key={`subtask-${subtask.id}-${index}`} className="ml-4 p-2 bg-white border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (subtask.id && typeof subtask.id === 'number') {
                            toggleTaskMutation.mutate(subtask.id)
                          }
                        }}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          subtask.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {subtask.completed && <RiCheckLine className="w-3 h-3" />}
                      </button>
                      <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {subtask.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {isSearching && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Showing {tasksToShow.length} result{tasksToShow.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {safeMap(tasksToShow, (task, index) => {
          // Only show parent tasks (tasks without parentId) in the main list
          const parentId = safeGet(task, 'parentId', null)
          if (parentId) return null

          return renderTaskItem(task)
        }).filter(Boolean)}
      </div>

      <Dialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTaskId(null)}
              disabled={deleteTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}