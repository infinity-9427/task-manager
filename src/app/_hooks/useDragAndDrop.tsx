import { useState } from 'react';

interface UseDragAndDropOptions<TItem, TDestination> {
  // Function to call when an item is dropped
  onDropItem: (itemId: string, destination: TDestination) => Promise<void> | void;
  // Optional loading delay for API calls or animations
  loadingDelay?: number;
  // Optional error handler
  onError?: (error: unknown) => void;
}

export function useDragAndDrop<TItem = any, TDestination = any>(
  options: UseDragAndDropOptions<TItem, TDestination>
) {
  const { 
    onDropItem, 
    loadingDelay = 0,
    onError = (error) => console.error("Error in drag and drop operation:", error)
  } = options;
  
  // State for tracking the dragged item
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  
  // Loading states for visual feedback
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Track which destination is being dragged over for visual feedback
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
        // Set loading state for visual feedback
        setIsLoading(prev => ({ ...prev, [draggedItemId]: true }));
        
        // Optional delay for API simulation
        if (loadingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, loadingDelay));
        }
        
        // Call the provided update function
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

  // Check if a specific target is being dragged over
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