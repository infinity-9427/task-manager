"use client";
import { useState, useEffect } from "react";
import { Task, TaskStatus, Priority } from '@/app/shared/types/tasks';
import { useTaskContext } from "@/app/context/TaskContext";

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
}

const TaskModal = ({ taskId, onClose }: TaskModalProps) => {
  const { tasks } = useTaskContext();
  const [task, setTask] = useState<Task | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (taskId) {
      const selectedTask = tasks.find(t => t.id === taskId);
      if (selectedTask) {
        setTask(selectedTask);
        // Add a small delay to trigger the fade-in animation
        setTimeout(() => setIsVisible(true), 10);
      }
    }
    return () => setIsVisible(false);
  }, [taskId, tasks]);

  if (!task) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    // Wait for the animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-amber-500';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case TaskStatus.COMPLETED:
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusText = (status: string) => {
    return status.replace('_', ' ');
  };

  const getPriorityLabel = (priority?: Priority): string => {
    if (!priority) return "No priority";
    
    switch (priority) {
      case Priority.LOW:
        return "Low";
      case Priority.MEDIUM:
        return "Medium";
      case Priority.HIGH:
        return "High";
      case Priority.URGENT:
        return "Urgent";
      default:
        return "No priority";
    }
  };
  
  const getPriorityColor = (priority?: Priority): string => {
    if (!priority) return "bg-gray-500/50 text-gray-300";
    
    switch (priority) {
      case Priority.LOW:
        return "bg-green-800/50 text-green-300";
      case Priority.MEDIUM:
        return "bg-amber-800/50 text-amber-300";
      case Priority.HIGH:
        return "bg-pink-800/50 text-pink-300";
      case Priority.URGENT:
        return "bg-purple-800/50 text-purple-300";
      default:
        return "bg-gray-500/50 text-gray-300";
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black transition-all duration-300 ${
        isVisible ? 'bg-opacity-50 backdrop-blur-sm' : 'bg-opacity-0 backdrop-blur-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isVisible ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-90'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status indicator bar */}
        <div className={`h-1.5 w-full ${getStatusColor(task.status)}`}></div>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <h2 className="text-xl font-semibold text-white">{task.title}</h2>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-white leading-relaxed">
              {task.description || "No description provided"}
            </p>
          </div>
          
          {/* Status - Now read-only */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
            <div className="flex items-center">
              <span className={`px-3 py-1.5 rounded-full text-sm ${getStatusColor(task.status)} text-white`}>
                {getStatusText(task.status)}
              </span>
            </div>
          </div>
          
          {/* Priority */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Priority</h3>
            <div className="flex items-center">
              <span className={`px-3 py-1.5 rounded-full text-sm ${getPriorityColor(task.priority)} inline-flex items-center gap-2`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3 3h18v18H3V3z" fill="none"/>
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>
                </svg>
                {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>
          
          {/* Due date if available */}
          {task.dueDate && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Due Date</h3>
              <div className="flex items-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>
          )}
          
          {/* Tags if available */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Close button only */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;