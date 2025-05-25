'use client'
import React, { createContext, useContext, useState } from 'react';
import { Task, TaskStatus } from '../_hooks/useDragAndDrop';

interface TaskContextValue {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

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
    const newTask: Task = {
      id: generateId(),
      ...taskData
    };
    
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