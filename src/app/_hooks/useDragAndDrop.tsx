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
      // Get IDs of tasks that are now in this column after the drop
      const taskIdsInNewList = newItems.map((item) => item.id);

      // If onStatusChange is provided, call it.
      // This function (handleStatusChange in page.tsx) is responsible for:
      // 1. Updating the global `tasks` context with the new status for these tasks.
      // 2. Setting appropriate alert messages.
      // The useEffect in page.tsx will then update the local column states
      // (pendienteTasks, enProgresoTasks, completadaTasks) based on the global context.
      if (options.onStatusChange) {
        await options.onStatusChange(taskIdsInNewList, columnType);
      }

      // The success alert is now handled by `handleStatusChange` in page.tsx.
      // We can remove the redundant success alert call from here.
      // if (options.onAlert) {
      //   options.onAlert(getStatusMessage(columnType), 'success');
      // }

    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred during drag and drop');
      console.error('Drag and drop error:', err);

      // Alert for errors during the drop operation itself.
      if (options.onAlert) {
        options.onAlert(`Error al procesar el arrastre: ${err.message}`, 'error');
      }

      // Call the generic error handler if provided
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