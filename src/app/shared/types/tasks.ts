import React from "react";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in progress",
  COMPLETED = "completed",
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
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (taskId: string, taskData: Omit<Task, "id">) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
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