"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { Task, TaskContextValue, TaskStatus } from "../shared/types/tasks";
import { useFetcher } from "@/app/_hooks/useFetcher";

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { get, error, isLoading } = useFetcher<Task[]>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL
  });
  
  // Fetch tasks when component mounts
  useEffect(() => {
    const fetchTasks = async () => {
      const fetchedTasks = await get('tasks');
      
      if (fetchedTasks) {
        // Filter tasks by userId = 1
        const userTasks = fetchedTasks.filter(task => task.userId === 1);
        setTasks(userTasks);
      }
    };
    
    fetchTasks();
  }, []);

  // Add new task
  const addTask = (task: Task) => {
    setTasks(prevTasks => [...prevTasks, task]);
  };

  // Update task
  const updateTask = (taskId: string, updatedTask: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );
  };

  // Update task status
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      )
    );
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        setTasks,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        isLoading,
        error
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}