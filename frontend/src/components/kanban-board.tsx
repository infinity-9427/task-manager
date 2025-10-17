'use client'

import React from 'react'
import { RiCheckLine, RiTimeLine, RiDeleteBin6Line, RiFlagLine, RiArrowDownSLine, RiArrowRightSLine, RiEditLine, RiUser3Line, RiMoreLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTasks, useDeleteTask, useToggleTask, useUpdateTask } from '@/hooks/use-tasks'
import { useSearchContext } from '@/contexts/search-context'
import { useTaskSearch } from '@/hooks/use-search'
import { TASK_PRIORITIES } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'
import { Task, TaskStatus } from '@/types'
import { useState, useEffect, useMemo, useRef } from 'react'
import TaskEditModal from '@/components/task-edit-modal'
import { toast } from 'sonner'

const COLUMN_CONFIG = {
  [TaskStatus.TO_DO]: {
    title: 'To Do',
    className: 'bg-gray-50/80 border-gray-200/80 backdrop-blur-sm',
    headerClassName: 'text-gray-700 bg-gray-100/80',
    statusIndicator: 'bg-gray-400'
  },
  [TaskStatus.IN_PROGRESS]: {
    title: 'In Progress', 
    className: 'bg-blue-50/80 border-blue-200/80 backdrop-blur-sm',
    headerClassName: 'text-blue-700 bg-blue-100/80',
    statusIndicator: 'bg-blue-500'
  },
  [TaskStatus.COMPLETED]: {
    title: 'Done',
    className: 'bg-green-50/80 border-green-200/80 backdrop-blur-sm',
    headerClassName: 'text-green-700 bg-green-100/80',
    statusIndicator: 'bg-green-500'
  }
}

export default function KanbanBoard() {
  const { data: allTasks = [], isLoading } = useTasks()
  const { searchQuery } = useSearchContext()
  const { filteredTasks, isSearching } = useTaskSearch(allTasks, searchQuery)
  
  
  const deleteTaskMutation = useDeleteTask()
  const toggleTaskMutation = useToggleTask()
  const updateTaskMutation = useUpdateTask()
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [resetTaskId, setResetTaskId] = useState<string | null>(null)
  const [pendingResetStatus, setPendingResetStatus] = useState<TaskStatus | null>(null)
  const lastSyncedTasksRef = useRef<string>('')

  // Use filtered tasks if searching, otherwise all tasks
  const tasksToShow = isSearching ? filteredTasks : allTasks

  // Get task status based on completed field and status field
  const getTaskStatus = (task: Task): TaskStatus => {
    // If the task has a status field, prioritize it
    if (task.status) return task.status
    // Fallback to completed field
    if (task.completed) return TaskStatus.COMPLETED
    return TaskStatus.TO_DO
  }

  // Check if all child tasks are completed
  const areAllChildrenCompleted = (task: Task): boolean => {
    if (!task.children || task.children.length === 0) return true
    return task.children.every(child => child.completed)
  }

  // Check if a parent task can be moved to completed status
  const canMoveToCompleted = (task: Task): boolean => {
    if (!task.children || task.children.length === 0) return true
    return areAllChildrenCompleted(task)
  }

  // Build proper parent-child hierarchy
  const buildTaskHierarchy = (tasks: Task[]): Task[] => {
    // First, create a map of all tasks
    const taskMap = new Map<string, Task>()
    tasks.forEach(task => {
      taskMap.set(task.id.toString(), { ...task, children: [] })
    })
    
    // Then, build the hierarchy
    const rootTasks: Task[] = []
    
    tasks.forEach(task => {
      const currentTask = taskMap.get(task.id.toString())!
      
      if (task.parentId && taskMap.has(task.parentId.toString())) {
        // This is a child task
        const parent = taskMap.get(task.parentId.toString())!
        if (!parent.children) parent.children = []
        parent.children.push(currentTask)
      } else {
        // This is a root task
        rootTasks.push(currentTask)
      }
    })
    
    return rootTasks
  }

  const hierarchicalTasks = buildTaskHierarchy(tasksToShow)

  // Memoize the tasksByStatus to prevent infinite re-renders
  const tasksByStatus = useMemo(() => ({
    [TaskStatus.TO_DO]: hierarchicalTasks.filter(task => getTaskStatus(task) === TaskStatus.TO_DO),
    [TaskStatus.IN_PROGRESS]: hierarchicalTasks.filter(task => getTaskStatus(task) === TaskStatus.IN_PROGRESS),
    [TaskStatus.COMPLETED]: hierarchicalTasks.filter(task => getTaskStatus(task) === TaskStatus.COMPLETED)
  }), [hierarchicalTasks])

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
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


  // Simple state management for each column (no drag-and-drop)
  const [pendingTasks, setPendingTasks] = useState<Task[]>(tasksByStatus[TaskStatus.TO_DO])
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>(tasksByStatus[TaskStatus.IN_PROGRESS])
  const [completedTasks, setCompletedTasks] = useState<Task[]>(tasksByStatus[TaskStatus.COMPLETED])

  // Keep drag-and-drop state in sync with actual task data - only when tasks actually change
  const tasksSignature = JSON.stringify(allTasks.map(t => `${t.id}-${t.status}-${t.completed}`))
  useEffect(() => {
    if (lastSyncedTasksRef.current !== tasksSignature) {
      setPendingTasks(tasksByStatus[TaskStatus.TO_DO])
      setInProgressTasks(tasksByStatus[TaskStatus.IN_PROGRESS])
      setCompletedTasks(tasksByStatus[TaskStatus.COMPLETED])
      lastSyncedTasksRef.current = tasksSignature
    }
  }, [tasksSignature, tasksByStatus])

  // Handle drag end to update task status based on which column it landed in
  useEffect(() => {
    // Avoid infinite loops by checking if we're currently updating
    if (updateTaskMutation.isPending) return
    
    // Check for tasks that have moved between columns
    const allCurrentTasks = [...pendingTasks, ...inProgressTasks, ...completedTasks]
    
    // Find tasks that have changed columns
    allCurrentTasks.forEach(task => {
      let newStatus: TaskStatus | null = null
      
      // Determine which column the task is now in
      if (pendingTasks.includes(task)) {
        newStatus = TaskStatus.TO_DO
      } else if (inProgressTasks.includes(task)) {
        newStatus = TaskStatus.IN_PROGRESS
      } else if (completedTasks.includes(task)) {
        newStatus = TaskStatus.COMPLETED
      }
      
      // Check if status has actually changed
      if (newStatus && getTaskStatus(task) !== newStatus) {
        handleTaskStatusChange(task, newStatus)
      }
    })
  }, [pendingTasks, inProgressTasks, completedTasks, updateTaskMutation.isPending])

  // Handle task status change via drag and drop
  const handleTaskStatusChange = (task: Task, newStatus: TaskStatus) => {
    try {
      // Prevent moving to completed if it has incomplete children
      if (newStatus === TaskStatus.COMPLETED && !canMoveToCompleted(task)) {
        toast.warning('Cannot complete parent task', {
          description: 'Please complete all child tasks first.'
        })
        // Reset the task to its original position
        resetLocalState()
        return
      }
      
      // Check if moving from COMPLETED to PENDING (requires reset confirmation)
      if (task.completed && newStatus === TaskStatus.TO_DO) {
        setResetTaskId(task.id.toString())
        setPendingResetStatus(newStatus)
        // Reset the drag state temporarily
        resetLocalState()
        return
      }
      
      // For all other moves, update normally
      updateTaskStatus(task, newStatus)
      
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
      resetLocalState()
    }
  }

  // Helper function to reset local state to match server data
  const resetLocalState = () => {
    setPendingTasks(tasksByStatus[TaskStatus.TO_DO])
    setInProgressTasks(tasksByStatus[TaskStatus.IN_PROGRESS])
    setCompletedTasks(tasksByStatus[TaskStatus.COMPLETED])
  }

  // Helper function to update task status
  const updateTaskStatus = (task: Task, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        completed: newStatus === TaskStatus.COMPLETED
      }
    })
  }

  // Handle task reset confirmation
  const handleTaskReset = (confirmed: boolean) => {
    if (!resetTaskId || !pendingResetStatus) return
    
    try {
      if (confirmed) {
        // Reset the task and all its children
        const taskToReset = allTasks.find(t => t.id.toString() === resetTaskId)
        if (taskToReset) {
          resetTaskAndChildren(taskToReset, pendingResetStatus)
          toast.success('Task reset successfully', {
            description: 'Task and all subtasks have been marked as incomplete.'
          })
        }
      } else {
        // User cancelled, just reset the drag state
        resetLocalState()
      }
    } catch (error) {
      console.error('Error resetting task:', error)
      toast.error('Failed to reset task')
      resetLocalState()
    } finally {
      setResetTaskId(null)
      setPendingResetStatus(null)
    }
  }

  // Reset task and all its children to incomplete
  const resetTaskAndChildren = (task: Task, newStatus: TaskStatus) => {
    // Get all child tasks
    const childTasks = allTasks.filter(t => t.parentId === task.id)
    
    // Reset parent task
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        completed: false
      }
    })
    
    // Reset all child tasks
    childTasks.forEach(child => {
      updateTaskMutation.mutate({
        id: child.id,
        updates: {
          status: TaskStatus.TO_DO,
          completed: false
        }
      })
    })
  }

  const handleDeleteTask = () => {
    if (!deleteTaskId) return
    
    try {
      deleteTaskMutation.mutate(parseInt(deleteTaskId), {
        onSuccess: () => {
          setDeleteTaskId(null)
        },
        onError: (error) => {
          console.error('Delete task error:', error)
          // Error is already handled in the hook with toast
        }
      })
    } catch (error) {
      console.error('Unexpected error during task deletion:', error)
      toast.error('Unexpected error occurred')
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const highlightMatch = (text: string, query: string): React.JSX.Element => {
    if (!query.trim() || !isSearching) return <span>{text}</span>
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    )
  }

  const renderTaskGroup = (task: Task): React.ReactNode => {
    const isParent = task.children && task.children.length > 0
    const isExpanded = expandedTasks.has(task.id.toString())
    const canComplete = canMoveToCompleted(task)
    
    return (
      <div key={task.id} className="space-y-2">
        {/* Parent Task */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm hover:shadow-lg transition-all duration-300 cursor-grab active:cursor-grabbing hover:border-gray-300/80 group">
          <div className="flex items-start space-x-3">
            {/* Expand/Collapse button for parent tasks */}
            {isParent ? (
              <button
                onClick={() => toggleTaskExpansion(task.id.toString())}
                className="mt-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                {isExpanded ? (
                  <RiArrowDownSLine className="w-4 h-4" />
                ) : (
                  <RiArrowRightSLine className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <button
              onClick={() => {
                if (!canComplete && !task.completed) {
                  toast.warning('Cannot complete parent task', {
                    description: 'Please complete all child tasks first.'
                  })
                  return
                }
                
                try {
                  toggleTaskMutation.mutate(task.id, {
                    onError: (error) => {
                      console.error('Toggle task error:', error)
                      // Error is already handled in the hook with toast
                    }
                  })
                } catch (error) {
                  console.error('Unexpected error during task toggle:', error)
                  toast.error('Unexpected error occurred')
                }
              }}
              className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 ${
                task.completed
                  ? 'bg-green-500 border-green-500 text-white shadow-md'
                  : canComplete 
                    ? 'border-gray-300 hover:border-green-400 hover:bg-green-50/50 active:scale-95'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              } ${!canComplete && !task.completed ? 'opacity-50' : ''}`}
              disabled={toggleTaskMutation.isPending || (!canComplete && !task.completed)}
              title={!canComplete && !task.completed ? 'Complete all child tasks first' : ''}
            >
              <RiCheckLine 
                className={`w-3.5 h-3.5 transition-all duration-200 ease-in-out ${
                  task.completed 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-50'
                }`}
              />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3
                      className={`text-sm font-medium transition-all duration-300 ease-in-out ${
                        task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                      } ${isParent ? 'font-semibold' : ''}`}
                    >
                      {highlightMatch(task.title, searchQuery)}
                    </h3>
                    {isParent && (
                      <span className="text-xs text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full font-medium">
                        {task.children?.filter(child => child.completed).length || 0}/{task.children?.length || 0}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!task.parentId && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          TASK_PRIORITIES[task.priority].color
                        }`}
                      >
                        <RiFlagLine className="w-3 h-3 mr-1" />
                        {TASK_PRIORITIES[task.priority].label}
                      </span>
                    )}
                    
                    {!task.parentId && task.assignee && (
                      <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold border border-gray-200">
                          {task.assignee.name?.charAt(0)?.toUpperCase() || task.assignee.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium">{task.assignee.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        setEditTask(task)
                      } catch (error) {
                        console.error('Error opening edit modal:', error)
                        toast.error('Failed to open edit modal')
                      }
                    }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                  >
                    <RiEditLine className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      try {
                        setDeleteTaskId(task.id.toString())
                      } catch (error) {
                        console.error('Error opening delete modal:', error)
                        toast.error('Failed to open delete confirmation')
                      }
                    }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                  >
                    <RiDeleteBin6Line className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {task.description && (
                <p
                  className={`text-sm mb-2 transition-all duration-300 ease-in-out ${
                    task.completed ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {highlightMatch(task.description, searchQuery)}
                </p>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3 text-gray-500">
                  <span>Created {formatDate(task.createdAt)}</span>
                  {task.dueDate && (
                    <div className="flex items-center space-x-1">
                      <RiTimeLine className="w-3 h-3" />
                      <span
                        className={`px-2 py-1 rounded-md ${
                          isOverdue(task.dueDate) && !task.completed
                            ? 'text-red-600 bg-red-50 font-medium'
                            : 'text-gray-600 bg-gray-100'
                        }`}
                      >
                        Due {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
                
                {task.status && (
                  <div className={`w-2 h-2 rounded-full ${COLUMN_CONFIG[task.status].statusIndicator}`} />
                )}
              </div>
              
              {isParent && !canComplete && !task.completed && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  Complete all child tasks before marking this as done
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Child Tasks */}
        {isParent && isExpanded && task.children && (
          <div className="ml-8 space-y-2">
            {task.children.map((child) => (
              <div
                key={child.id}
                className="bg-white/60 rounded-lg border-l-4 border-l-purple-300 border border-gray-200/60 p-3 shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 group/child backdrop-blur-sm"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-6" />
                  
                  <button
                    onClick={() => {
                      try {
                        toggleTaskMutation.mutate(child.id, {
                          onError: (error) => {
                            console.error('Toggle child task error:', error)
                            // Error is already handled in the hook with toast
                          }
                        })
                      } catch (error) {
                        console.error('Unexpected error during child task toggle:', error)
                        toast.error('Unexpected error occurred')
                      }
                    }}
                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 ${
                      child.completed
                        ? 'bg-green-500 border-green-500 text-white shadow-md'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50 active:scale-95'
                    }`}
                    disabled={toggleTaskMutation.isPending}
                  >
                    <RiCheckLine 
                      className={`w-3 h-3 transition-all duration-200 ease-in-out ${
                        child.completed 
                          ? 'opacity-100 scale-100' 
                          : 'opacity-0 scale-50'
                      }`}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4
                            className={`text-sm font-medium transition-all duration-300 ease-in-out ${
                              child.completed ? 'line-through text-gray-500' : 'text-gray-700'
                            }`}
                          >
                            {highlightMatch(child.title, searchQuery)}
                          </h4>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {child.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <RiTimeLine className="w-3 h-3" />
                              {new Date(child.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover/child:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            try {
                              setEditTask(child)
                            } catch (error) {
                              console.error('Error opening child edit modal:', error)
                              toast.error('Failed to open edit modal')
                            }
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                        >
                          <RiEditLine className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            try {
                              setDeleteTaskId(child.id.toString())
                            } catch (error) {
                              console.error('Error opening child delete modal:', error)
                              toast.error('Failed to open delete confirmation')
                            }
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                        >
                          <RiDeleteBin6Line className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {child.description && (
                      <p
                        className={`text-xs mb-2 transition-all duration-300 ease-in-out ${
                          child.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {highlightMatch(child.description, searchQuery)}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <span>Created {formatDate(child.createdAt)}</span>
                        {child.dueDate && (
                          <div className="flex items-center space-x-1">
                            <RiTimeLine className="w-3 h-3" />
                            <span
                              className={`px-1.5 py-0.5 rounded-md ${
                                isOverdue(child.dueDate) && !child.completed
                                  ? 'text-red-600 bg-red-50 font-medium'
                                  : 'text-gray-600 bg-gray-100'
                              }`}
                            >
                              Due {formatDate(child.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {child.status && (
                        <div className={`w-1.5 h-1.5 rounded-full ${COLUMN_CONFIG[child.status].statusIndicator}`} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderColumn = (
    status: TaskStatus,
    tasks: Task[]
  ) => {
    const config = COLUMN_CONFIG[status]
    
    return (
      <div className={`flex-1 min-w-0 ${config.className} rounded-xl border-2 p-4 transition-all duration-200`}>
        <div className={`${config.headerClassName} -m-4 mb-4 p-4 rounded-t-xl border-b border-gray-200/30`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${config.statusIndicator}`} />
              <h2 className="font-semibold text-base md:text-lg">{config.title}</h2>
            </div>
            <span className="text-xs md:text-sm font-medium bg-white/60 px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </div>
        </div>
        
        <div
          className="space-y-3 min-h-[200px] md:min-h-[300px] transition-all duration-200"
        >
          {tasks.map(renderTaskGroup)}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No tasks yet
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div key={columnIndex} className="bg-gray-50 rounded-lg border p-3 md:p-4">
            <div className="bg-gray-100 -m-3 md:-m-4 mb-3 md:mb-4 p-3 md:p-4 rounded-t-lg">
              <Skeleton className="h-5 md:h-6 w-20 md:w-24 mb-1" />
              <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
            </div>
            <div className="space-y-2 md:space-y-3">
              {Array.from({ length: 3 }).map((_, taskIndex) => (
                <div key={taskIndex} className="bg-white rounded-lg border p-3 md:p-4">
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
          </div>
        ))}
      </div>
    )
  }


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

  return (
    <>
      {isSearching && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Showing {tasksToShow.length} result{tasksToShow.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {renderColumn(TaskStatus.TO_DO, pendingTasks)}
        {renderColumn(TaskStatus.IN_PROGRESS, inProgressTasks)}
        {renderColumn(TaskStatus.COMPLETED, completedTasks)}
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

      <Dialog open={!!resetTaskId} onOpenChange={() => handleTaskReset(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Task Progress</DialogTitle>
            <DialogDescription>
              You&apos;re moving a completed task back to &quot;To Do&quot;. This will mark the task and all its subtasks as incomplete. Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleTaskReset(false)}
              disabled={updateTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => handleTaskReset(true)}
              disabled={updateTaskMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateTaskMutation.isPending ? 'Resetting...' : 'Reset Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskEditModal 
        task={editTask}
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
      />
    </>
  )
}