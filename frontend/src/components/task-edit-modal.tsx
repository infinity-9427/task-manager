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
import { useUpdateTask, useTasks } from '@/hooks/use-tasks'
import { TaskPriority, Task, TaskStatus } from '@/types'
import { DUMMY_USERS } from '@/lib/constants'
import { toast } from 'sonner'

interface TaskEditModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export default function TaskEditModal({ task, isOpen, onClose }: TaskEditModalProps) {
  const { data: allTasks = [] } = useTasks()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING)
  const [dueDate, setDueDate] = useState('')
  const [parentId, setParentId] = useState<string>('none')
  const [assigneeId, setAssigneeId] = useState<string>('unassigned')

  const updateTaskMutation = useUpdateTask()

  // Get only parent tasks (tasks without a parentId) excluding current task
  const parentTasks = allTasks.filter(t => !t.parentId && t.id !== task?.id)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setStatus(task.status || (task.completed ? TaskStatus.COMPLETED : TaskStatus.PENDING))
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setParentId(task.parentId || 'none')
      setAssigneeId(task.assigneeId || 'unassigned')
    }
  }, [task])

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
          parentId: parentId && parentId !== 'none' ? parentId : undefined,
          assigneeId: assigneeId === 'unassigned' ? undefined : assigneeId,
        }
      }, {
        onSuccess: () => {
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Edit Task
          </DialogTitle>
          {task && (
            <div className="text-sm text-gray-500 mt-1">
              {task.parentId ? (
                <span>
                  Subtask of: <strong>{allTasks.find(t => t.id === task.parentId)?.title || 'Unknown'}</strong>
                </span>
              ) : (
                <span>Parent task</span>
              )}
            </div>
          )}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div>
            <label htmlFor="edit-parentTask" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Task (Optional)
            </label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a parent task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent task</SelectItem>
                {parentTasks.map((parentTask) => (
                  <SelectItem key={parentTask.id} value={parentTask.id}>
                    {parentTask.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">
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

          <div>
            <label htmlFor="edit-assignee" className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No assignee</SelectItem>
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
            <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <Input
              id="edit-dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || updateTaskMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}