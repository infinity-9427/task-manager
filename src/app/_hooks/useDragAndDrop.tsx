import { useState } from 'react';
import { UseDragAndDropOptions } from '@/app/shared/types/tasks';

export function useDragAndDrop<TItem = any, TDestination = any>(
  options: UseDragAndDropOptions<TItem, TDestination>
) {
  const { 
    onDropItem, 
    loadingDelay = 0,
    onError = (error) => console.error("Error in drag and drop operation:", error)
  } = options;
  
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  
  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    if (targetId) {
      setDragTargetId(targetId);
    }
  };

  const handleDragLeave = (targetId?: string) => {
    if (targetId && dragTargetId === targetId) {
      setDragTargetId(null);
    }
  };

  const handleDrop = async (destination: TDestination, targetId?: string) => {
    if (draggedItemId) {
      try {
        setIsLoading(prev => ({ ...prev, [draggedItemId]: true }));
        
        if (loadingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, loadingDelay));
        }
        
        await onDropItem(draggedItemId, destination);
      } catch (error) {
        onError(error);
      } finally {
        setIsLoading(prev => ({ ...prev, [draggedItemId]: false }));
        setDraggedItemId(null);
        setDragTargetId(null);
      }
    }
  };

  const isDraggedOver = (targetId: string) => dragTargetId === targetId;

  return {
    draggedItemId,
    isLoading,
    isDraggedOver,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}