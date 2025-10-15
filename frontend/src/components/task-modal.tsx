'use client'

import { useState } from 'react'
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
import { useTaskContext } from '@/contexts/task-context'
import { TaskPriority, TaskStatus, SubTaskInput } from '@/types'
import { DUMMY_USERS, CURRENT_USER_ID } from '@/lib/constants'
import { toast } from 'sonner'
import { RiAddLine, RiDeleteBin6Line } from '@remixicon/react'

export default function TaskModal() {
  const { isCreateModalOpen, closeCreateModal } = useTaskContext()
  const { data: allTasks = [] } = useTasks()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING)
  const [dueDate, setDueDate] = useState('')
  const [parentId, setParentId] = useState<string>('none')
  const [assigneeId, setAssigneeId] = useState<string>(CURRENT_USER_ID)
  const [subtasks, setSubtasks] = useState<SubTaskInput[]>([])
  const [showSubtasks, setShowSubtasks] = useState(false)

  const createTaskMutation = useCreateTask()

  // Get only parent tasks (tasks without a parentId)
  const parentTasks = allTasks.filter(task => !task.parentId)

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

      createTaskMutation.mutate({
        title: trimmedTitle,
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
        completed: status === TaskStatus.COMPLETED,
        parentId: parentId && parentId !== 'none' ? parentId : undefined,
        assigneeId,
      }, {
        onSuccess: (newTask) => {
          // If there are subtasks, create them
          if (subtasks.length > 0) {
            createSubtasks(newTask.id)
          }
          setTitle('')
          setDescription('')
          setPriority('medium')
          setStatus(TaskStatus.PENDING)
          setDueDate('')
          setParentId('none')
          setAssigneeId(CURRENT_USER_ID)
          setSubtasks([])
          setShowSubtasks(false)
          closeCreateModal()
        },
        onError: (error) => {
          console.error('Failed to create task:', error)
          // Error is already handled in the hook with toast
        }
      })
    } catch (error) {
      console.error('Unexpected error during task creation:', error)
      toast.error('Unexpected error occurred')
    }
  }

  const createSubtasks = async (parentTaskId: string) => {
    for (const subtask of subtasks) {
      if (subtask.title.trim()) {
        try {
          await createTaskMutation.mutateAsync({
            title: subtask.title.trim(),
            description: subtask.description?.trim() || undefined,
            priority: subtask.priority || 'medium',
            status: TaskStatus.PENDING,
            completed: false,
            parentId: parentTaskId,
            assigneeId: subtask.assigneeId || CURRENT_USER_ID,
          })
        } catch (error) {
          console.error('Failed to create subtask:', error)
        }
      }
    }
  }

  const addSubtask = () => {
    setSubtasks([...subtasks, { title: '', description: '', priority: 'medium', assigneeId: CURRENT_USER_ID }])
  }

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const updateSubtask = (index: number, field: keyof SubTaskInput, value: string) => {
    const updated = [...subtasks]
    updated[index] = { ...updated[index], [field]: value }
    setSubtasks(updated)
  }

  const isFormValid = title.trim().length >= 2

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={closeCreateModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Create New Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div>
            <label htmlFor="parentTask" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Task (Optional)
            </label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a parent task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent task</SelectItem>
                {parentTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center space-x-2">
                        <img 
                          src={user.avatar || ''} 
                          alt={user.name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          {parentId === 'none' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Subtasks (Optional)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <RiAddLine className="h-4 w-4 mr-1" />
                  {showSubtasks ? 'Hide Subtasks' : 'Add Subtasks'}
                </Button>
              </div>
              
              {showSubtasks && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600">
                    Add subtasks to break down this task into smaller pieces
                  </p>
                  
                  {subtasks.map((subtask, index) => (
                    <div key={index} className="space-y-2 p-3 bg-white rounded border">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-700">Subtask {index + 1}</span>
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
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Select 
                          value={subtask.priority || 'medium'} 
                          onValueChange={(value: TaskPriority) => updateSubtask(index, 'priority', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={subtask.assigneeId || CURRENT_USER_ID} 
                          onValueChange={(value) => updateSubtask(index, 'assigneeId', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DUMMY_USERS.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center space-x-2">
                                  <img 
                                    src={user.avatar || ''} 
                                    alt={user.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                  <span>{user.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubtask}
                    className="w-full border-dashed border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600"
                  >
                    <RiAddLine className="h-4 w-4 mr-2" />
                    Add Another Subtask
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateModal}
              disabled={createTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createTaskMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}