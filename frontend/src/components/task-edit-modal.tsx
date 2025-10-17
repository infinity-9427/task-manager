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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateTask, useCreateTask, useDeleteTask, useTasks } from '@/hooks/use-tasks'
import { TaskPriority, Task, TaskStatus, SubTaskInput } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useMessagingUsers } from '@/lib/messages-api'
import { toast } from 'sonner'
import { 
  RiCloseLine, 
  RiSaveLine, 
  RiAddLine, 
  RiDeleteBin6Line,
  RiEditLine,
  RiFlagLine,
  RiCalendarLine,
  RiUser3Line,
  RiCheckLine
} from '@remixicon/react'

interface TaskEditModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export default function TaskEditModal({ task, isOpen, onClose }: TaskEditModalProps) {
  const { user } = useAuth()
  const { data: usersData } = useMessagingUsers()
  const users = usersData?.users || []
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TO_DO)
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [subtasks, setSubtasks] = useState<(SubTaskInput & { id?: number, isExisting?: boolean })[]>([])
  const [deletedSubtaskIds, setDeletedSubtaskIds] = useState<number[]>([])

  const updateTaskMutation = useUpdateTask()
  const createSubtaskMutation = useCreateTask()
  const deleteSubtaskMutation = useDeleteTask()

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setStatus(task.status || (task.completed ? TaskStatus.COMPLETED : TaskStatus.TO_DO))
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setAssigneeId(task.assigneeId?.toString() || '')
      
      // Load existing subtasks
      const existingSubtasks = (task.children || []).map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description || '',
        dueDate: subtask.dueDate ? subtask.dueDate.split('T')[0] : '',
        isExisting: true
      }))
      setSubtasks(existingSubtasks)
      setDeletedSubtaskIds([])
    }
  }, [task])

  // Helper functions
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

  const addSubtask = () => {
    setSubtasks([...subtasks, { 
      title: '', 
      description: '',
      dueDate: '',
      isExisting: false
    }])
  }

  const removeSubtask = (index: number) => {
    const subtask = subtasks[index]
    if (subtask.isExisting && subtask.id) {
      setDeletedSubtaskIds([...deletedSubtaskIds, subtask.id])
    }
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const updateSubtask = (index: number, field: keyof SubTaskInput, value: any) => {
    const updated = [...subtasks]
    updated[index] = { ...updated[index], [field]: value }
    setSubtasks(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!task) {
        toast.error('No task selected for editing')
        return
      }
      
      const trimmedTitle = title.trim()
      if (!trimmedTitle || trimmedTitle.length < 2) {
        toast.error('Title is required', {
          description: 'Please enter a title with at least 2 characters.'
        })
        return
      }

      updateTaskMutation.mutate({
        id: task.id,
        updates: {
          title: trimmedTitle,
          description: description.trim() || undefined,
          priority,
          status,
          dueDate: dueDate || undefined,
          completed: status === TaskStatus.COMPLETED,
          assigneeId: parseInt(assigneeId),
        }
      }, {
        onSuccess: async () => {
          // Handle subtask deletions
          for (const deletedId of deletedSubtaskIds) {
            try {
              await deleteSubtaskMutation.mutateAsync(deletedId)
            } catch (error) {
              console.error(`Failed to delete subtask ${deletedId}:`, error)
            }
          }

          // Handle subtask updates and creations
          for (const subtask of subtasks) {
            if (!subtask.title.trim()) continue

            try {
              if (subtask.isExisting && subtask.id) {
                // Update existing subtask (no assigneeId for subtasks)
                await updateTaskMutation.mutateAsync({
                  id: subtask.id,
                  updates: {
                    title: subtask.title.trim(),
                    description: subtask.description?.trim() || undefined,
                    dueDate: subtask.dueDate || undefined,
                    // No assigneeId or priority changes for subtasks
                  }
                })
              } else {
                // Create new subtask (no assigneeId for subtasks)
                await createSubtaskMutation.mutateAsync({
                  title: subtask.title.trim(),
                  description: subtask.description?.trim() || undefined,
                  priority: TaskPriority.MEDIUM, // Default priority for subtasks
                  status: TaskStatus.TO_DO,
                  completed: false,
                  parentId: task!.id,
                  dueDate: subtask.dueDate || undefined,
                  // No assigneeId - subtasks don't have assignees
                })
              }
            } catch (error) {
              console.error('Failed to save subtask:', error)
              toast.error(`Failed to save subtask: ${subtask.title}`)
            }
          }
          
          onClose()
        },
        onError: (error) => {
          console.error('Failed to update task:', error)
          // Error is already handled in the hook with toast
        }
      })
    } catch (error) {
      console.error('Unexpected error during task update:', error)
      toast.error('Unexpected error occurred')
    }
  }

  const isFormValid = title.trim().length >= 2

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0" showCloseButton={false}>
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Edit Task
                  </DialogTitle>
                  <RiEditLine className="w-6 h-6 text-blue-600" />
                </div>
                {task && (
                  <div className="text-sm text-gray-600">
                    {task.parentId ? (
                      <Badge variant="outline" className="text-xs">
                        Subtask
                      </Badge>
                    ) : (
                      <span>Editing main task and its subtasks</span>
                    )}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Task Information Accordion */}
            <Accordion type="multiple" defaultValue={["basic", "details", "subtasks"]} className="space-y-4">
              
              {/* Basic Information */}
              <AccordionItem value="basic" className="border rounded-lg">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <RiEditLine className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold">Basic Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 mb-2">
                        Title *
                      </label>
                      <Input
                        id="edit-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter task title..."
                        required
                        className="w-full h-10"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        id="edit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter task description..."
                        rows={4}
                        className="w-full resize-none"
                      />
                    </div>
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
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                        <SelectTrigger className="h-10">
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
                      <label htmlFor="edit-priority" className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority
                      </label>
                      <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                          <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                          <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                          <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="edit-assignee" className="block text-sm font-semibold text-gray-700 mb-2">
                        Assignee
                      </label>
                      <Select value={assigneeId} onValueChange={setAssigneeId}>
                        <SelectTrigger className="h-10">
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
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center text-white text-xs font-bold">
                                    {userOption.name?.charAt(0)?.toUpperCase() || userOption.email?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <span>{displayName}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="edit-dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                        Due Date
                      </label>
                      <Input
                        id="edit-dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Subtasks Management */}
              {!task?.parentId && (
                <AccordionItem value="subtasks" className="border rounded-lg">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <RiCheckLine className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-lg font-semibold">Subtasks</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 font-medium">
                        {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Manage subtasks for this task
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSubtask}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <RiAddLine className="h-4 w-4 mr-1" />
                          Add Subtask
                        </Button>
                      </div>
                      
                      {subtasks.length > 0 && (
                        <div className="space-y-3">
                          {subtasks.map((subtask, index) => (
                            <Card key={index} className="border border-gray-200">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                      Subtask {index + 1}
                                      {subtask.isExisting && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Existing
                                        </Badge>
                                      )}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSubtask(index)}
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <RiDeleteBin6Line className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  <Input
                                    placeholder="Subtask title..."
                                    value={subtask.title}
                                    onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                                    className="text-sm"
                                  />
                                  
                                  <Textarea
                                    placeholder="Subtask description (optional)..."
                                    value={subtask.description || ''}
                                    onChange={(e) => updateSubtask(index, 'description', e.target.value)}
                                    rows={2}
                                    className="text-sm resize-none"
                                  />
                                  
                                  <div>
                                    <Input
                                      type="date"
                                      placeholder="Due date (optional)..."
                                      value={subtask.dueDate || ''}
                                      onChange={(e) => updateSubtask(index, 'dueDate', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Action Buttons */}
            <Separator />
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateTaskMutation.isPending || createSubtaskMutation.isPending || deleteSubtaskMutation.isPending}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || updateTaskMutation.isPending || createSubtaskMutation.isPending || deleteSubtaskMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6"
              >
                <RiSaveLine className="h-4 w-4 mr-2" />
                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}