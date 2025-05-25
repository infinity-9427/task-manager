import React from 'react';

export enum TaskStatus {
  PENDING = 'pending',    
  IN_PROGRESS = 'in progress',
  COMPLETED = 'completed'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}

export interface TaskContextValue {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}