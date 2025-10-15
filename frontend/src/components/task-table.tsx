'use client'

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  Row,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { 
  RiCheckLine, 
  RiTimeLine, 
  RiDeleteBin6Line, 
  RiFlagLine, 
  RiArrowDownSLine, 
  RiArrowRightSLine, 
  RiEditLine,
  RiMoreLine,
  RiArrowUpDownLine,
  RiFilter3Line
} from '@remixicon/react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useTasks, useDeleteTask, useToggleTask, useUpdateTask } from '@/hooks/use-tasks'
import { useSearchContext } from '@/contexts/search-context'
import { useTaskSearch } from '@/hooks/use-search'
import { TASK_PRIORITIES } from '@/lib/constants'
import { Task, TaskStatus } from '@/types'
import TaskEditModal from '@/components/task-edit-modal'
import { toast } from 'sonner'

const STATUS_CONFIG = {
  [TaskStatus.PENDING]: {
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

export default function TaskTable() {
  const { data: allTasks = [], isLoading } = useTasks()
  const { searchQuery } = useSearchContext()
  const { filteredTasks, isSearching } = useTaskSearch(allTasks, searchQuery)
  
  const deleteTaskMutation = useDeleteTask()
  const toggleTaskMutation = useToggleTask()
  const updateTaskMutation = useUpdateTask()
  
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  // Use filtered tasks if searching, otherwise all tasks
  const tasksToShow = isSearching ? filteredTasks : allTasks

  const getTaskStatus = (task: Task): TaskStatus => {
    if (task.status) return task.status
    if (task.completed) return TaskStatus.COMPLETED
    return TaskStatus.PENDING
  }

  // Build proper parent-child hierarchy - memoized to prevent infinite loops
  const hierarchicalTasks = useMemo(() => {
    const buildTaskHierarchy = (tasks: Task[]): Task[] => {
      const taskMap = new Map<string, Task>()
      tasks.forEach(task => {
        taskMap.set(task.id, { ...task, children: [] })
      })
      
      const rootTasks: Task[] = []
      
      tasks.forEach(task => {
        const currentTask = taskMap.get(task.id)!
        
        if (task.parentId && taskMap.has(task.parentId)) {
          const parent = taskMap.get(task.parentId)!
          if (!parent.children) parent.children = []
          parent.children.push(currentTask)
        } else {
          rootTasks.push(currentTask)
        }
      })
      
      return rootTasks
    }

    return buildTaskHierarchy(tasksToShow)
  }, [tasksToShow])

  // Flatten hierarchy for table display - memoized to prevent infinite loops
  const flatTasks = useMemo(() => {
    const flattenHierarchy = (tasks: Task[], level = 0): Array<Task & { level: number }> => {
      const result: Array<Task & { level: number }> = []
      
      tasks.forEach(task => {
        result.push({ ...task, level })
        if (task.children && task.children.length > 0) {
          result.push(...flattenHierarchy(task.children, level + 1))
        }
      })
      
      return result
    }

    return flattenHierarchy(hierarchicalTasks)
  }, [hierarchicalTasks])

  // Apply filters and handle expansion state
  const filteredData = useMemo(() => {
    const applyFilters = (tasks: Array<Task & { level: number }>) => {
      return tasks.filter((task, index) => {
        // Apply status and priority filters
        const taskStatus = getTaskStatus(task)
        if (statusFilter !== 'all' && taskStatus !== statusFilter) return false
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
        
        // Handle expansion state for child tasks
        if (task.level > 0) {
          // Find the parent task
          let parentIndex = index - 1
          while (parentIndex >= 0 && tasks[parentIndex].level >= task.level) {
            parentIndex--
          }
          
          if (parentIndex >= 0) {
            const parentTask = tasks[parentIndex]
            // Only show child if parent is expanded
            if (!expanded[parentTask.id]) {
              return false
            }
          }
        }
        
        return true
      })
    }

    return applyFilters(flatTasks)
  }, [flatTasks, statusFilter, priorityFilter, expanded])

  const canMoveToCompleted = (task: Task): boolean => {
    if (!task.children || task.children.length === 0) return true
    return task.children.every(child => child.completed)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(dateString).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    if (newStatus === TaskStatus.COMPLETED && !canMoveToCompleted(task)) {
      toast.warning('Cannot complete parent task', {
        description: 'Please complete all child tasks first.'
      })
      return
    }

    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        completed: newStatus === TaskStatus.COMPLETED
      }
    })
  }

  const handleDeleteTask = () => {
    if (!deleteTaskId) return
    
    deleteTaskMutation.mutate(deleteTaskId, {
      onSuccess: () => {
        setDeleteTaskId(null)
      }
    })
  }

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredData.map(task => task.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    if (isBulkUpdating) return // Prevent multiple simultaneous bulk operations
    
    const tasksToUpdate = Array.from(selectedTasks)
      .map(taskId => filteredData.find(t => t.id === taskId))
      .filter(Boolean) as Task[]

    if (tasksToUpdate.length === 0) {
      toast.warning('No tasks selected')
      return
    }

    // Check for parent tasks that can't be completed
    if (newStatus === TaskStatus.COMPLETED) {
      const invalidParentTasks = tasksToUpdate.filter(task => !canMoveToCompleted(task))
      if (invalidParentTasks.length > 0) {
        toast.warning(`Cannot complete ${invalidParentTasks.length} parent task(s)`, {
          description: 'Some parent tasks have incomplete child tasks.'
        })
        return
      }
    }

    setIsBulkUpdating(true)
    let successCount = 0
    let errorCount = 0

    try {
      // Process updates sequentially to avoid race conditions
      for (const task of tasksToUpdate) {
        try {
          await updateTaskMutation.mutateAsync({
            id: task.id,
            updates: {
              status: newStatus,
              completed: newStatus === TaskStatus.COMPLETED
            }
          })
          successCount++
        } catch (error) {
          console.error(`Failed to update task ${task.id}:`, error)
          errorCount++
        }
      }
    } finally {
      setIsBulkUpdating(false)
      setSelectedTasks(new Set())
    }

    if (successCount > 0) {
      const statusLabel = {
        [TaskStatus.PENDING]: 'To Do',
        [TaskStatus.IN_PROGRESS]: 'In Progress', 
        [TaskStatus.COMPLETED]: 'Done'
      }[newStatus]
      
      toast.success(`Updated ${successCount} task${successCount !== 1 ? 's' : ''} to ${statusLabel}`)
    }

    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} task${errorCount !== 1 ? 's' : ''}`)
    }
  }

  // Table Row Component with Selection
  const TableRow = ({ row }: { row: Row<Task & { level: number }> }) => {
    const task = row.original
    const isSelected = selectedTasks.has(task.id)

    return (
      <tr className={`border-b hover:bg-gray-50 transition-colors group ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}>
        <td className="px-4 py-3 w-8">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleSelectTask(task.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-4 py-3">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    )
  }

  const columns: ColumnDef<Task & { level: number }>[] = [
    {
      id: 'task',
      header: 'Task',
      accessorKey: 'title',
      cell: ({ row }) => {
        const task = row.original
        const hasChildren = task.children && task.children.length > 0
        const indent = task.level * 24

        return (
          <div className="flex items-center min-w-0" style={{ paddingLeft: `${indent}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mr-2"
                onClick={() => {
                  setExpanded(prev => ({
                    ...prev,
                    [task.id]: !prev[task.id]
                  }))
                }}
              >
                {expanded[task.id] ? (
                  <RiArrowDownSLine className="h-4 w-4" />
                ) : (
                  <RiArrowRightSLine className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-8" />
            )}
            
            <button
              onClick={() => {
                if (!canMoveToCompleted(task) && !task.completed) {
                  toast.warning('Cannot complete parent task', {
                    description: 'Please complete all child tasks first.'
                  })
                  return
                }
                toggleTaskMutation.mutate(task.id)
              }}
              className={`mr-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                task.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : canMoveToCompleted(task) 
                    ? 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              }`}
              disabled={!canMoveToCompleted(task) && !task.completed}
            >
              <RiCheckLine className={`w-3 h-3 transition-all ${
                task.completed ? 'opacity-100' : 'opacity-0'
              }`} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm flex-1">
                  <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                    {task.title}
                  </span>
                  {hasChildren && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {task.children?.filter(child => child.completed).length || 0}/{task.children?.length || 0}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditTask(task)
                  }}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RiEditLine className="w-3 h-3" />
                </Button>
              </div>
              {task.description && (
                <div className={`text-xs mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Status
          <RiArrowUpDownLine className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => getTaskStatus(row),
      cell: ({ row }) => {
        const task = row.original
        const status = getTaskStatus(task)
        const config = STATUS_CONFIG[status]

        return (
          <Select
            value={status}
            onValueChange={(newStatus: TaskStatus) => handleStatusChange(task, newStatus)}
          >
            <SelectTrigger className="w-32 h-8">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className="text-xs">{config.label}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskStatus.PENDING}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  To Do
                </div>
              </SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  In Progress
                </div>
              </SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Done
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: 'priority',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Priority
          <RiArrowUpDownLine className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorKey: 'priority',
      cell: ({ row }) => {
        const priority = row.original.priority
        const config = TASK_PRIORITIES[priority]
        
        return (
          <Badge className={`${config.color} text-xs font-medium`}>
            <RiFlagLine className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        )
      },
    },
    {
      id: 'assignee',
      header: 'Assignee',
      cell: ({ row }) => {
        const assignee = row.original.assignee
        
        if (!assignee) return <span className="text-gray-400 text-sm">Unassigned</span>
        
        return (
          <div className="flex items-center gap-2">
            <img 
              src={assignee.avatar || ''} 
              alt={assignee.name}
              className="w-6 h-6 rounded-full border border-gray-200"
            />
            <span className="text-sm font-medium">{assignee.name}</span>
          </div>
        )
      },
    },
    {
      id: 'dueDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Due Date
          <RiArrowUpDownLine className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorKey: 'dueDate',
      cell: ({ row }) => {
        const dueDate = row.original.dueDate
        
        if (!dueDate) return <span className="text-gray-400 text-sm">No due date</span>
        
        return (
          <div className="flex items-center gap-1">
            <RiTimeLine className="w-3 h-3" />
            <span className={`text-sm ${
              isOverdue(dueDate) && !row.original.completed
                ? 'text-red-600 font-medium'
                : 'text-gray-600'
            }`}>
              {formatDate(dueDate)}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const task = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <RiMoreLine className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditTask(task)}>
                <RiEditLine className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteTaskId(task.id)}
                className="text-red-600 focus:text-red-600"
              >
                <RiDeleteBin6Line className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-gray-100 border-b" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b bg-white" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <RiFilter3Line className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={TaskStatus.PENDING}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.COMPLETED}>Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter('all')
            setPriorityFilter('all')
            setColumnFilters([])
          }}
        >
          Clear filters
        </Button>
      </div>

      {/* Search Results Info */}
      {isSearching && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Showing {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700">Bulk actions:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange(TaskStatus.PENDING)}
                disabled={isBulkUpdating}
                className="h-8 text-xs"
              >
                {isBulkUpdating ? 'Updating...' : 'Mark as To Do'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange(TaskStatus.IN_PROGRESS)}
                disabled={isBulkUpdating}
                className="h-8 text-xs"
              >
                {isBulkUpdating ? 'Updating...' : 'Mark as In Progress'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusChange(TaskStatus.COMPLETED)}
                disabled={isBulkUpdating}
                className="h-8 text-xs"
              >
                {isBulkUpdating ? 'Updating...' : 'Mark as Done'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTasks(new Set())}
                disabled={isBulkUpdating}
                className="h-8 text-xs text-gray-600"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg bg-white shadow-sm">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-gray-50">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === filteredData.length && filteredData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No tasks yet</div>
            <div className="text-gray-400 text-sm">
              {isSearching 
                ? `No tasks match "${searchQuery}". Try a different search term.`
                : 'Create your first task to get started!'
              }
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              {(() => {
                if (!deleteTaskId) return 'Are you sure you want to delete this task? This action cannot be undone.'
                
                const taskToDelete = filteredData.find(t => t.id === deleteTaskId)
                if (!taskToDelete) return 'Are you sure you want to delete this task? This action cannot be undone.'
                
                const childTasks = filteredData.filter(t => t.parentId === deleteTaskId)
                
                if (childTasks.length > 0) {
                  return (
                    <div className="space-y-2">
                      <p>Are you sure you want to delete "<strong>{taskToDelete.title}</strong>"?</p>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          ⚠️ This will also delete {childTasks.length} subtask{childTasks.length !== 1 ? 's' : ''}:
                        </p>
                        <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                          {childTasks.map(child => (
                            <li key={child.id}>{child.title}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-sm text-gray-600">This action cannot be undone.</p>
                    </div>
                  )
                }
                
                return `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`
              })()}
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

      {/* Edit Modal */}
      <TaskEditModal 
        task={editTask}
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
      />
    </>
  )
}