'use client'
import React, { createContext, useContext, useState } from 'react';
import  { TaskStatus, Task, TaskContextValue } from '@/app/shared/types/tasks';

const TaskContext = createContext<TaskContextValue>({
  tasks: [],
  setTasks: () => {},
  addTask: () => {},
  updateTaskStatus: () => {}
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

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus } 
          : task
      )
    );
  };

  return (
    <TaskContext.Provider value={{ tasks, setTasks, addTask, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  return useContext(TaskContext);
}