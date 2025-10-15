'use client'

import { useState } from 'react'
import { RiCheckLine, RiTimeLine, RiDeleteBin6Line, RiFlagLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTasks, useDeleteTask, useToggleTask } from '@/hooks/use-tasks'
import { useSearchContext } from '@/contexts/search-context'
import { useTaskSearch } from '@/hooks/use-search'
import { TASK_PRIORITIES } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'

export default function TaskList() {
  const { data: allTasks = [], isLoading } = useTasks()
  const { searchQuery } = useSearchContext()
  const { filteredTasks, isSearching } = useTaskSearch(allTasks, searchQuery)
  const deleteTaskMutation = useDeleteTask()
  const toggleTaskMutation = useToggleTask()
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const handleDeleteTask = () => {
    if (deleteTaskId) {
      deleteTaskMutation.mutate(deleteTaskId, {
        onSuccess: () => setDeleteTaskId(null)
      })
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

  // Show search results or all tasks
  const tasksToShow = isSearching ? filteredTasks : allTasks

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
        {tasksToShow.map((task) => (
          <div
            key={task.id}
            className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 ease-in-out ${
              task.completed ? 'opacity-75 bg-gray-50' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <button
                onClick={() => toggleTaskMutation.mutate(task.id)}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white shadow-sm scale-100'
                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50 active:scale-95'
                }`}
                disabled={toggleTaskMutation.isPending}
              >
                <RiCheckLine 
                  className={`w-3 h-3 transition-all duration-200 ease-in-out ${
                    task.completed 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-50'
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`text-sm font-medium transition-all duration-300 ease-in-out ${
                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {highlightMatch(task.title, searchQuery)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        TASK_PRIORITIES[task.priority].color
                      }`}
                    >
                      <RiFlagLine className="w-3 h-3 mr-1" />
                      {TASK_PRIORITIES[task.priority].label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTaskId(task.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 ease-in-out"
                    >
                      <RiDeleteBin6Line className="w-4 h-4" />
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

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Created {formatDate(task.createdAt)}</span>
                  {task.dueDate && (
                    <div className="flex items-center space-x-1">
                      <RiTimeLine className="w-3 h-3" />
                      <span
                        className={
                          isOverdue(task.dueDate) && !task.completed
                            ? 'text-red-500 font-medium'
                            : ''
                        }
                      >
                        Due {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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