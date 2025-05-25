'use client'
import { useTaskContext } from '@/app/context/TaskContext';
import { TaskStatus, Task } from '@/app/shared/types/tasks';
import { useState, useRef, useEffect } from 'react';

export default function TaskBoard() {
  const { tasks, updateTaskStatus, setTasks } = useTaskContext();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // Group tasks by status
  const pendingTasks = tasks.filter(task => task.status === TaskStatus.PENDING);
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);

  // Click outside handler for edit form
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (editFormRef.current && !editFormRef.current.contains(event.target as Node)) {
        setEditingTask(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editFormRef]);

  // Handle drag and drop with API integration preparation
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: TaskStatus) => {
    if (draggedTaskId) {
      try {
        // Set loading state for the task being updated
        setIsLoading(prev => ({ ...prev, [draggedTaskId]: true }));
        
        // Simulate API call delay
        // In a real app, you would replace this with your API call
        // await updateTaskStatusAPI(draggedTaskId, newStatus);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update task status in context
        updateTaskStatus(draggedTaskId, newStatus);
      } catch (error) {
        console.error("Error updating task status:", error);
        // Handle error (show notification etc.)
      } finally {
        setIsLoading(prev => ({ ...prev, [draggedTaskId]: false }));
        setDraggedTaskId(null);
      }
    }
  };

  // Delete task handler
  const handleDeleteTask = (taskId: string) => {
    if (deleteConfirm === taskId) {
      // Simulate API call for delete
      // In real app, replace with actual API call
      setTasks(tasks.filter(task => task.id !== taskId));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(taskId);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  // Edit task handler
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  // Save edited task
  const handleSaveTask = (updatedTask: Task) => {
    // Simulate API call for update
    // In real app, replace with actual API call
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setEditingTask(null);
  };

  // Task Edit Form
  const EditTaskForm = ({ task }: { task: Task }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveTask({
        ...task,
        title,
        description
      });
    };

    return (
      <div 
        ref={editFormRef}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Edit Task</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render a task card
  const TaskCard = ({ task }: { task: Task }) => {
    const isBeingEdited = editingTask?.id === task.id;
    const isConfirmingDelete = deleteConfirm === task.id;
    const isTaskLoading = isLoading[task.id];
    
    // Define status colors - improved for better visibility
    const statusColors = {
      [TaskStatus.PENDING]: 'bg-amber-200 text-amber-900 border-amber-300',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-200 text-blue-900 border-blue-300',
      [TaskStatus.COMPLETED]: 'bg-emerald-200 text-emerald-900 border-emerald-300'
    };

    return (
      <div 
        draggable={!isBeingEdited && !isConfirmingDelete}
        onDragStart={() => handleDragStart(task.id)}
        className={`bg-white rounded-lg shadow-md p-4 mb-3 relative ${
          isTaskLoading ? 'opacity-60' : 'hover:shadow-lg'
        } transition-all border border-gray-100 hover:border-gray-200 ${
          isConfirmingDelete ? 'border-red-300 bg-red-50' : ''
        }`}
      >
        {isTaskLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg mb-2 text-gray-900">{task.title}</h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => handleEditTask(task)}
              className="text-gray-500 hover:text-indigo-700 p-1 rounded hover:bg-gray-100"
              title="Edit task"
            >
    
            </button>
            <button 
              onClick={() => handleDeleteTask(task.id)}
              className={`p-1 rounded ${
                isConfirmingDelete ? 'text-red-600 hover:bg-red-100' : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
              }`}
              title={isConfirmingDelete ? "Click again to confirm deletion" : "Delete task"}
            >
         
            </button>
          </div>
        </div>
        
        <p className="text-gray-700 text-sm mb-3">{task.description}</p>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]} border`}>
          {task.status}
        </span>
        
        {isConfirmingDelete && (
          <div className="mt-2 text-center text-xs text-red-600 bg-red-100 p-1 rounded">
            Click delete again to confirm
          </div>
        )}
      </div>
    );
  };

  // Column component
  const Column = ({ 
    title, 
    tasks, 
    status, 
    bgColor,
    borderColor,
    iconClass,
    onDrop
  }: { 
    title: string; 
    tasks: Task[]; 
    status: TaskStatus; 
    bgColor: string;
    borderColor: string;
    iconClass: string;
    onDrop: (status: TaskStatus) => Promise<void>;
  }) => {
    const [isColumnDragTarget, setIsColumnDragTarget] = useState(false);
    
    return (
      <div 
        className={`${bgColor} rounded-lg shadow-md p-4 flex-1 min-w-[300px] border ${borderColor} 
        ${isColumnDragTarget ? 'ring-2 ring-indigo-400' : ''} transition-all`}
        onDragOver={(e) => {
          handleDragOver(e);
          setIsColumnDragTarget(true);
        }}
        onDragLeave={() => setIsColumnDragTarget(false)}
        onDrop={() => {
          onDrop(status);
          setIsColumnDragTarget(false);
        }}
      >
        <h2 className="font-bold text-lg mb-4 flex items-center justify-between text-gray-800 border-b pb-2">
          <span className="flex items-center">
            <i className={`${iconClass} mr-2`}></i>
            {title}
          </span>
          <span className="bg-white rounded-full px-3 py-1 text-sm shadow-sm">
            {tasks.length}
          </span>
        </h2>
        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-600 bg-white bg-opacity-60 rounded-lg border border-dashed border-gray-300">
              No tasks yet
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 inline-flex items-center justify-center">
            Task Board
          </h1>
          <p className="text-gray-600 mt-2">Drag and drop tasks between columns to update their status</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 pb-8">
          <Column 
            title="To Do" 
            tasks={pendingTasks} 
            status={TaskStatus.PENDING} 
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
            iconClass="fas fa-list-ul text-amber-600"
            onDrop={handleDrop}
          />
          
          <Column 
            title="In Progress" 
            tasks={inProgressTasks} 
            status={TaskStatus.IN_PROGRESS} 
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
            iconClass="fas fa-spinner text-blue-600"
            onDrop={handleDrop}
          />
          
          <Column 
            title="Completed" 
            tasks={completedTasks} 
            status={TaskStatus.COMPLETED} 
            bgColor="bg-emerald-50"
            borderColor="border-emerald-200"
            iconClass="fas fa-check-circle text-emerald-600"
            onDrop={handleDrop}
          />
        </div>
      </div>
      
      {editingTask && <EditTaskForm task={editingTask} />}
    </div>
  );
}