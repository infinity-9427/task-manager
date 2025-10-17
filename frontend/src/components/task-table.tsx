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
import { Task, TaskStatus, TaskPriority } from '@/types'
import TaskEditModal from '@/components/task-edit-modal'
import TaskDetailModal from '@/components/task-detail-modal'
import { toast } from 'sonner'

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

export default function TaskTable() {
  const { data: allTasks = [], isLoading } = useTasks()
  const { searchQuery } = useSearchContext()
  const { filteredTasks, isSearching } = useTaskSearch(allTasks, searchQuery)
  
  const deleteTaskMutation = useDeleteTask()
  const toggleTaskMutation = useToggleTask()
  const updateTaskMutation = useUpdateTask()
  
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  // Use filtered tasks if searching, otherwise all tasks (with safe fallbacks)
  const tasksToShow = isSearching ? (filteredTasks || []) : (allTasks || [])

  const getTaskStatus = (task: Task): TaskStatus => {
    if (task.status) return task.status
    if (task.completed) return TaskStatus.COMPLETED
    return TaskStatus.TO_DO
  }

  // Use existing hierarchy from API response or build from flat tasks
  const hierarchicalTasks = useMemo(() => {
    if (!tasksToShow || !Array.isArray(tasksToShow)) return []
    
    // Check if tasks already have subtasks/children from API
    const tasksWithHierarchy = tasksToShow.filter(task => 
      !task.parentId && ((task.subtasks && task.subtasks.length > 0) || (task.children && task.children.length > 0))
    )
    
    if (tasksWithHierarchy.length > 0) {
      // Use API-provided hierarchy, ensure children property exists
      return tasksToShow.filter(task => !task.parentId).map(task => ({
        ...task,
        children: task.subtasks || task.children || []
      }))
    }
    
    // Fallback: build hierarchy from flat task list
    const buildTaskHierarchy = (tasks: Task[]): Task[] => {
      const taskMap = new Map<number, Task>()
      tasks.forEach(task => {
        if (task?.id) {
          taskMap.set(task.id, { ...task, children: [] })
        }
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
    
    deleteTaskMutation.mutate(parseInt(deleteTaskId), {
      onSuccess: () => {
        setDeleteTaskId(null)
      }
    })
  }

  const handleSelectTask = (taskId: number, checked: boolean) => {
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
        [TaskStatus.TO_DO]: 'To Do',
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

    const handleRowClick = (e: React.MouseEvent) => {
      // Don't open detail modal if clicking on interactive elements
      const target = e.target as HTMLElement
      if (
        target.closest('button') || 
        target.closest('input') || 
        target.closest('select') ||
        target.closest('[role="combobox"]') ||
        target.closest('[role="button"]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="menuitem"]')
      ) {
        return
      }
      setDetailTask(task)
    }

    return (
      <tr 
        className={`border-b hover:bg-gray-50 transition-colors group cursor-pointer ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={handleRowClick}
      >
        <td className="px-4 py-3 w-8" onClick={(e) => e.stopPropagation()}>
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
              <SelectItem value={TaskStatus.TO_DO}>
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
        const task = row.original
        
        // Hide priority for subtasks
        if (task.parentId) {
          return <span className="text-gray-400 text-sm">—</span>
        }
        
        const priority = task.priority
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
        const task = row.original
        
        // Hide assignee for subtasks
        if (task.parentId) {
          return <span className="text-gray-400 text-sm">—</span>
        }
        
        const assignee = task.assignee
        
        if (!assignee) return <span className="text-gray-400 text-sm">Unassigned</span>
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-xs font-bold border border-gray-200">
              {assignee.name?.charAt(0)?.toUpperCase() || assignee.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
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
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <RiMoreLine className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  setDetailTask(null)
                  setTimeout(() => setEditTask(task), 100)
                }}>
                  <RiEditLine className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTaskId(task.id.toString())
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <RiDeleteBin6Line className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            <SelectItem value={TaskStatus.TO_DO}>To Do</SelectItem>
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
            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
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
            Showing {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
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
                onClick={() => handleBulkStatusChange(TaskStatus.TO_DO)}
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
        {(!filteredData || filteredData.length === 0) && (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <RiTimeLine className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isSearching ? 'No matching tasks' : 'No tasks yet'}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              {isSearching 
                ? `No tasks match "${searchQuery || ''}". Try adjusting your search criteria or filters.`
                : 'Create your first task'
              }
            </p>
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
                
                const taskToDelete = filteredData.find(t => t.id.toString() === deleteTaskId)
                if (!taskToDelete) return 'Are you sure you want to delete this task? This action cannot be undone.'
                
                const childTasks = filteredData.filter(t => t.parentId?.toString() === deleteTaskId)
                
                if (childTasks.length > 0) {
                  return (
                    <div className="space-y-2">
                      <p>Are you sure you want to delete &quot;<strong>{taskToDelete.title}</strong>&quot;?</p>
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

      {/* Detail Modal */}
      <TaskDetailModal 
        task={detailTask}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        onEdit={(task) => {
          setDetailTask(null)
          // Small delay to ensure detail modal closes before edit modal opens
          setTimeout(() => setEditTask(task), 100)
        }}
        onDelete={(taskId) => {
          setDetailTask(null)
          setDeleteTaskId(taskId)
        }}
      />
    </>
  )
}