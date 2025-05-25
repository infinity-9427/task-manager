'use client'

import { useMemo } from 'react';
import { useDragAndDrop as useFormKitDragAndDrop } from '@formkit/drag-and-drop/react';

export type TaskStatus = 'pendiente' | 'en progreso' | 'completada';

export interface Task {
  id: string;
  title: string;
  description: string;
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
  columnType,
  options = {},
}: UseKanbanDragAndDropProps) {
  // Determine which tasks to use based on column type using useMemo
  const currentTasks = useMemo(() => {
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
  }, [pendienteTasks, enProgresoTasks, completadaTasks, columnType]);


  const handleDrop = async (newItems: Task[]) => {
    try {
      const taskIdsInNewList = newItems.map((item) => item.id);

      if (options.onStatusChange) {
        await options.onStatusChange(taskIdsInNewList, columnType);
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred during drag and drop');
      console.error('Drag and drop error:', err);

      if (options.onAlert) {
        options.onAlert(`Error al procesar el arrastre: ${err.message}`, 'error');
      }

      if (options.onError) {
        options.onError(err);
      }
    }
  };

  // Use the FormKit drag and drop hook with our custom handler
  const [listRef, items] = useFormKitDragAndDrop<HTMLUListElement, Task>(currentTasks, {
    group: 'kanban',
    onDrop: handleDrop,
    droppable: true,
  });

  return {
    listRef,
    items,
  };
}