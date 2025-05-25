'use client'

import { useState, useEffect } from 'react';
import { useDragAndDrop as useFormKitDragAndDrop } from '@formkit/drag-and-drop/react';

// Define TaskStatus type to ensure we only use valid statuses
export type TaskStatus = 'pendiente' | 'en progreso' | 'completada';

// Task interface to ensure consistent task shape
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedUser: string;
  status: TaskStatus;
}

// Options for the hook, including an optional onAlert callback
interface UseKanbanDragAndDropOptions {
  onStatusChange?: (taskIds: string[], newStatus: TaskStatus) => Promise<void> | void;
  onError?: (error: Error) => void;
  onAlert?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

// Props needed for the hook
interface UseKanbanDragAndDropProps {
  pendienteTasks: Task[];
  enProgresoTasks: Task[];
  completadaTasks: Task[];
  setPendienteTasks: (tasks: Task[]) => void;
  setEnProgresoTasks: (tasks: Task[]) => void;
  setCompletadaTasks: (tasks: Task[]) => void;
  columnType: TaskStatus;
  options?: UseKanbanDragAndDropOptions;
}

/**
 * Custom hook for managing kanban drag and drop functionality
 */
export function useKanbanDragAndDrop({
  pendienteTasks,
  enProgresoTasks,
  completadaTasks,
  setPendienteTasks,
  setEnProgresoTasks,
  setCompletadaTasks,
  columnType,
  options = {},
}: UseKanbanDragAndDropProps) {
  // Determine which tasks to use based on column type
  const getTasks = () => {
    switch (columnType) {
      case 'pendiente':
        return pendienteTasks;
      case 'en progreso':
        return enProgresoTasks;
      case 'completada':
        return completadaTasks;
      default:
        return [];
    }
  };

  // Get the display message for the alert
  const getStatusMessage = (status: TaskStatus): string => {
    switch (status) {
      case 'pendiente':
        return '¡Tarea actualizada a Pendiente!';
      case 'en progreso':
        return '¡Tarea actualizada a En Progreso!';
      case 'completada':
        return '¡Tarea actualizada a Completada!';
      default:
        return '¡Tarea actualizada!';
    }
  };

  // Create the drop handler
  const handleDrop = async (newItems: Task[]) => {
    try {
      // Get IDs of tasks in this column after drop
      const newItemIds = new Set(newItems.map((item) => item.id));

      // Update status for all tasks in this column
      const updatedItems = newItems.map((item) => ({ ...item, status: columnType }));

      // Remove these items from other columns
      const filteredPendiente = pendienteTasks.filter((task) => !newItemIds.has(task.id));
      const filteredEnProgreso = enProgresoTasks.filter((task) => !newItemIds.has(task.id));
      const filteredCompletada = completadaTasks.filter((task) => !newItemIds.has(task.id));

      // Update the columns based on the current column type
      switch (columnType) {
        case 'pendiente':
          setPendienteTasks(updatedItems);
          setEnProgresoTasks(filteredEnProgreso);
          setCompletadaTasks(filteredCompletada);
          break;
        case 'en progreso':
          setPendienteTasks(filteredPendiente);
          setEnProgresoTasks(updatedItems);
          setCompletadaTasks(filteredCompletada);
          break;
        case 'completada':
          setPendienteTasks(filteredPendiente);
          setEnProgresoTasks(filteredEnProgreso);
          setCompletadaTasks(updatedItems);
          break;
      }

      // If onStatusChange is provided, call it with the affected task IDs
      if (options.onStatusChange) {
        await options.onStatusChange(Array.from(newItemIds), columnType);
      }

      // Use the custom alert instead of Sonner
      if (options.onAlert) {
        options.onAlert(getStatusMessage(columnType), 'success');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred during drag and drop');
      console.error('Drag and drop error:', err);

      // Use the custom alert instead of Sonner
      if (options.onAlert) {
        options.onAlert(`Error al actualizar la tarea: ${err.message}`, 'error');
      }

      // Call the error handler if provided
      if (options.onError) {
        options.onError(err);
      }
    }
  };

  // Use the FormKit drag and drop hook with our custom handler
  const [listRef, items] = useFormKitDragAndDrop<HTMLUListElement, Task>(getTasks(), {
    group: 'kanban',
    onDrop: handleDrop,
    droppable: true,
  });

  return {
    listRef,
    items,
  };
}