import React from "react";

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}
export enum Priority {
  LOW = "LOW", 
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",  
  URGENT = "URGENT",           
}

export enum formAction {
  CREATE = "create",
  EDIT = "edit",
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority?: Priority;
  userId: number;  // Add this field to match API response
}

export interface TaskFormProps {
  action?: formAction
  task?: Task;
  onComplete?: (task: Task) => void;
  onClose?: () => void;
}

export interface TaskContextValue {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, taskData: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  isLoading?: boolean;  // Add loading state
  error?: string | null;  // Add error state
}

export interface UseDragAndDropOptions<TItem, TDestination> {
  onDropItem: (
    itemId: string,
    destination: TDestination
  ) => Promise<void> | void;
  loadingDelay?: number;
  onError?: (error: unknown) => void;
}

export interface IColorSchema {
    primary: string;
    hover: string;
    focus: string;
    button: string;
    titleColor: string;
}

export interface IStatusColors {
  bg: string;
  text: string;
  hover?: string;
}

export type StatusColorVariant = {
  selected: string;
  default: string;
};