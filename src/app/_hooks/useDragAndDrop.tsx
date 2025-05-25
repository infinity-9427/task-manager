'use client'

import { useMemo } from 'react';
import { useDragAndDrop as useFormKitDragAndDrop } from '@formkit/drag-and-drop/react';

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

// Options for the hook, including an optional onAlert callback
interface UseKanbanDragAndDropOptions {
  onStatusChange?: (taskIds: string[], newStatus: TaskStatus) => Promise<void> | void;
  onError?: (error: Error) => void;
  onAlert?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

// Props needed for the hook
interface UseKanbanDragAndDropProps {
  pendingTasks?: Task[];
  inProgressTasks?: Task[];
  completedTasks?: Task[];
  setPendingTasks: (tasks: Task[]) => void;
  setInProgressTasks: (tasks: Task[]) => void;
  setCompletedTasks: (tasks: Task[]) => void;
  columnType: TaskStatus;
  options?: UseKanbanDragAndDropOptions;
}

/**
 * Custom hook for managing kanban drag and drop functionality
 */
export function useKanbanDragAndDrop({
  pendingTasks = [],
  inProgressTasks = [],
  completedTasks = [],
  columnType,
  options = {},
}: UseKanbanDragAndDropProps) {
  // Determine which tasks to use based on column type using useMemo
  const currentTasks = useMemo(() => {
    switch (columnType) {
      case TaskStatus.PENDING:
        return pendingTasks;
      case TaskStatus.IN_PROGRESS:
        return inProgressTasks;
      case TaskStatus.COMPLETED:
        return completedTasks;
      default:
        return [];
    }
  }, [pendingTasks, inProgressTasks, completedTasks, columnType]);

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
        options.onAlert(`Error processing drag and drop: ${err.message}`, 'error');
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

// Usage in a component
/*
<ul ref={pendienteColumn.listRef} style={listStyle}>
  {Array.isArray(pendienteTasks) && pendienteTasks.map((task) => 
    task ? renderTask(task, TaskStatus.PENDING) : null
  )}
</ul>

<ul ref={enProgresoColumn.listRef} style={listStyle}>
  {Array.isArray(enProgresoTasks) && enProgresoTasks.map((task) => 
    task ? renderTask(task, TaskStatus.IN_PROGRESS) : null
  )}
</ul>

<ul ref={completadaColumn.listRef} style={listStyle}>
  {Array.isArray(completadaTasks) && completadaTasks.map((task) => 
    task ? renderTask(task, TaskStatus.COMPLETED) : null
  )}
</ul>
*/