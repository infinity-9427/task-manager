'use client'
import React, { createContext, useContext, useState } from 'react';
import  { TaskStatus, Task, TaskContextValue } from '@/app/shared/types/tasks';

const TaskContext = createContext<TaskContextValue>({
  tasks: [],
  setTasks: () => {},
  addTask: () => {},
  updateTask: () => {},
  updateTaskStatus: () => {},
  deleteTask: () => {} // <-- Default deleteTask
});

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    // Ensure status is one of the valid enum values
    let normalizedStatus = taskData.status;
    
    // Validation to ensure status is a valid enum value
    if (!Object.values(TaskStatus).includes(taskData.status)) {
      console.warn(`Invalid status: ${taskData.status}, defaulting to PENDING`);
      normalizedStatus = TaskStatus.PENDING;
    }
    
    const newTask: Task = {
      id: generateId(),
      ...taskData,
      status: normalizedStatus
    };
    
    console.log('Adding new task with normalized status:', newTask);
    setTasks(currentTasks => [...currentTasks, newTask]);
  };

  const updateTask = (taskId: string, taskData: Omit<Task, 'id'>) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId
          ? { ...task, ...taskData }
          : task
      )
    );
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus } 
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.filter(task => task.id !== taskId)
    );
  };

  return (
    <TaskContext.Provider value={{ tasks, setTasks, addTask, updateTask, updateTaskStatus, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  return useContext(TaskContext);
}