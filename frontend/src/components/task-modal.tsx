'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTask, useTasks } from '@/hooks/use-tasks'
import { taskAPI } from '@/lib/task-api'
import { useTaskContext } from '@/contexts/task-context'
import { TaskPriority, TaskStatus, SubTaskInput } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useMessagingUsers } from '@/lib/messages-api'
import { toast } from 'sonner'
import { RiAddLine, RiDeleteBin6Line, RiCloseLine } from '@remixicon/react'

export default function TaskModal() {
  const { isCreateModalOpen, closeCreateModal } = useTaskContext()
  const { user } = useAuth()
  const { data: usersData } = useMessagingUsers()
  const users = usersData?.users || []
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TO_DO)
  const [dueDate, setDueDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [assigneeId, setAssigneeId] = useState<string>('')
  // Safe subtask state management
  const [subtasks, setSubtasks] = useState<SubTaskInput[]>([])
  const [showSubtasks, setShowSubtasks] = useState(false)

  const createTaskMutation = useCreateTask()
  const { invalidate: invalidateTasks } = useTasks()

  // Set assigneeId when user is loaded
  useEffect(() => {
    if (user?.id && !assigneeId) {
      setAssigneeId(user.id.toString())
    }
  }, [user?.id, assigneeId])

  // Get display name for assignee
  const getAssigneeDisplayName = (userId: string): string => {
    const userOption = users.find(u => u.id.toString() === userId)
    if (!userOption) return 'Select assignee'
    
    const isCurrentUser = user?.id !== undefined && userOption.id.toString() === user.id.toString()
    return isCurrentUser && users.length === 1 
      ? 'Myself' 
      : isCurrentUser 
        ? `${userOption.name || userOption.email} (You)`
        : userOption.name || userOption.email
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const trimmedTitle = title.trim()
      if (!trimmedTitle || trimmedTitle.length < 2) {
        toast.error('Title is required', {
          description: 'Please enter a title with at least 2 characters.'
        })
        return
      }

      const parsedAssigneeId = parseInt(assigneeId)
      if (isNaN(parsedAssigneeId) || parsedAssigneeId <= 0) {
        toast.error('Please select a valid assignee')
        return
      }

      // Validate subtasks
      const validSubtasks = subtasks.filter(st => st.title.trim().length > 0)
      
      // If there are subtasks, create them sequentially BEFORE closing modal
      if (validSubtasks.length > 0) {
        createTaskWithSubtasks(trimmedTitle, description.trim(), priority, status, dueDate, parsedAssigneeId, validSubtasks)
      } else {
        // Simple task creation without subtasks
        createTaskMutation.mutate({
          title: trimmedTitle,
          description: description.trim() || undefined,
          priority,
          status,
          dueDate: dueDate || undefined,
          completed: status === TaskStatus.COMPLETED,
          assigneeId: parsedAssigneeId,
        }, {
          onSuccess: () => {
            toast.success('Task created successfully!')
            closeCreateModal()
            resetForm()
          },
          onError: (error) => {
            console.error('Failed to create task:', error)
          }
        })
      }
    } catch (error) {
      console.error('Unexpected error during task creation:', error)
      toast.error('Unexpected error occurred')
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority(TaskPriority.MEDIUM)
    setStatus(TaskStatus.TO_DO)
    setDueDate(new Date().toISOString().split('T')[0])
    setAssigneeId(user?.id?.toString() || '')
    setSubtasks([])
    setShowSubtasks(false)
  }

  // Create task with subtasks sequentially
  const createTaskWithSubtasks = async (
    title: string, 
    description: string, 
    priority: TaskPriority, 
    status: TaskStatus, 
    dueDate: string, 
    assigneeId: number, 
    validSubtasks: SubTaskInput[]
  ) => {
    try {
      console.log('Creating main task with subtasks...')
      
      // Step 1: Create the main task first
      createTaskMutation.mutate({
        title,
        description: description || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
        completed: status === TaskStatus.COMPLETED,
        assigneeId,
      }, {
        onSuccess: async (newTask) => {
          console.log('Main task created:', newTask.id)
          
          // Step 2: Create subtasks sequentially
          let successCount = 0
          let failCount = 0
          
          for (const subtask of validSubtasks) {
            try {
              // Create each subtask using direct API call (no assigneeId for subtasks)
              const createdSubtask = await taskAPI.createTask({
                title: subtask.title.trim(),
                description: subtask.description?.trim() || undefined,
                priority: TaskPriority.MEDIUM, // Default priority for subtasks
                status: TaskStatus.TO_DO,
                completed: false,
                parentId: newTask.id,
                dueDate: subtask.dueDate || undefined,
                // No assigneeId - subtasks don't have assignees
              })
              
              console.log(`Subtask "${subtask.title}" created successfully:`, createdSubtask.id)
              successCount++
            } catch (error) {
              console.error(`Error creating subtask "${subtask.title}":`, error)
              failCount++
            }
          }
          
          // Invalidate tasks cache to refresh the UI
          invalidateTasks()
          
          // Show final result
          if (successCount > 0 && failCount === 0) {
            toast.success(`Task created with ${successCount} subtasks successfully!`)
          } else if (successCount > 0 && failCount > 0) {
            toast.warning(`Task created with ${successCount} subtasks. ${failCount} failed.`)
          } else if (failCount > 0) {
            toast.error('Task created but all subtasks failed.')
          }
          
          // Close modal and reset form
          closeCreateModal()
          resetForm()
        },
        onError: (error) => {
          console.error('Failed to create main task:', error)
          toast.error('Failed to create task')
        }
      })
    } catch (error) {
      console.error('Error in createTaskWithSubtasks:', error)
      toast.error('Failed to create task with subtasks')
    }
  }

  const addSubtask = () => {
    setSubtasks(prev => [...prev, { 
      title: '', 
      description: '',
      dueDate: ''
    }])
  }

  const removeSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index))
  }

  const updateSubtask = (index: number, field: keyof SubTaskInput, value: string) => {
    setSubtasks(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const isFormValid = title.trim().length >= 2 && assigneeId && users.length > 0

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
      if (!open) {
        closeCreateModal()
      }
    }}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader className="p-3 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Create New Task
              </DialogTitle>
              {users.length > 0 && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  <span className="hidden sm:inline">Create a task and optionally add subtasks below</span>
                  <span className="sm:hidden">Create a new task</span>
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeCreateModal}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Close create modal"
            >
              <RiCloseLine className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div>
            <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
              className="w-full h-9 sm:h-10 text-sm sm:text-base"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={2}
              className="w-full resize-none text-sm sm:text-base"
            />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TO_DO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="assignee" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Select assignee">
                    {assigneeId ? getAssigneeDisplayName(assigneeId) : 'Select assignee'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((userOption) => {
                    const isCurrentUser = user?.id !== undefined && userOption.id.toString() === user.id.toString()
                    const displayName = isCurrentUser && users.length === 1 
                      ? 'Myself' 
                      : isCurrentUser 
                        ? `${userOption.name || userOption.email} (You)`
                        : userOption.name || userOption.email
                    
                    return (
                      <SelectItem key={userOption.id} value={userOption.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                            {userOption.name?.charAt(0)?.toUpperCase() || userOption.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm sm:text-base truncate">{displayName}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-9 sm:h-10 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Subtasks Section - RE-ENABLED WITH SAFE PATTERNS */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Subtasks (Optional)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-purple-600 border-purple-300 hover:bg-purple-50 text-xs sm:text-sm h-8 sm:h-9 self-start sm:self-auto"
              >
                <RiAddLine className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {showSubtasks ? 'Hide Subtasks' : 'Add Subtasks'}
              </Button>
            </div>
            
            {showSubtasks && (
              <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg border">
                <p className="text-xs sm:text-sm text-gray-600">
                  Add subtasks to break down this task into smaller pieces
                </p>
                
                {subtasks.map((subtask, index) => (
                  <div key={index} className="space-y-1.5 sm:space-y-2 p-2.5 sm:p-3 bg-white rounded border">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Subtask {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubtask(index)}
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <RiDeleteBin6Line className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                    
                    <Input
                      placeholder="Subtask title..."
                      value={subtask.title}
                      onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                      className="text-xs sm:text-sm h-8 sm:h-9"
                    />
                    
                    <Textarea
                      placeholder="Subtask description (optional)..."
                      value={subtask.description || ''}
                      onChange={(e) => updateSubtask(index, 'description', e.target.value)}
                      rows={2}
                      className="text-xs sm:text-sm resize-none"
                    />
                    
                    <div>
                      <Input
                        type="date"
                        placeholder="Due date (optional)..."
                        value={subtask.dueDate || ''}
                        onChange={(e) => updateSubtask(index, 'dueDate', e.target.value)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                      />
                    </div>
                    </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubtask}
                  className="w-full border-dashed border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600 h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <RiAddLine className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Add Another Subtask
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateModal}
              disabled={createTaskMutation.isPending}
              className="h-9 sm:h-10 text-sm sm:text-base order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createTaskMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 h-9 sm:h-10 text-sm sm:text-base order-1 sm:order-2"
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}