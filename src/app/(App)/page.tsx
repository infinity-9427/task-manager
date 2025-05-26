"use client";
import { useTaskContext } from "@/app/context/TaskContext";
import { TaskStatus, Task, formAction } from "@/app/shared/types/tasks";
import { useState } from "react";
import { useDragAndDrop } from "@/app/_hooks/useDragAndDrop";
import { useFetcher } from "@/app/_hooks/useFetcher";
import CustomTaskForm from "@/components/CustomTaskForm";
import DeleteAlertDialog from "@/components/DeleteAlertDialog";

export default function TaskBoard() {
  const { tasks, updateTaskStatus, deleteTask } = useTaskContext();
  const fetcher = useFetcher<{ success: boolean }>({ baseUrl: process.env.NEXT_PUBLIC_API_URL });
  const dragDrop = useDragAndDrop<Task, TaskStatus>({
    onDropItem: async (taskId, newStatus) => {
      updateTaskStatus(taskId, newStatus);
    },
    loadingDelay: 300,
    onError: (error) => console.error("Error updating task status:", error),
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  
  // Add this function to handle task updates
  const handleUpdateTask = async (updatedTask: Partial<Task> & { id: string }) => {
    try {
      // Call the API endpoint with PUT request
      const result = await fetcher.put(`tasks/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        // Exclude any fields that shouldn't be updated
      });
      
      if (result !== null && !fetcher.error) {
        // Update was successful
        // The TaskContext will handle the state update
        setEditingTask(null);
        return true;
      }
      
      // If we reach here, there was an issue but no error was set
      throw new Error('Failed to update task');
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  };

  const pendingTasks = tasks.filter(
    (task) => task.status === TaskStatus.PENDING
  );
  const inProgressTasks = tasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  );
  const completedTasks = tasks.filter(
    (task) => task.status === TaskStatus.COMPLETED
  );

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteConfirm = async (taskId: string) => {
    try {
      // Call the API endpoint
      const result = await fetcher.delete(`tasks/${taskId}`);
      
      if (result !== null || !fetcher.error) {
        // Only update local state if API call was successful
        deleteTask(taskId);
        setDeletingTask(null);
        return;
      }
      
      // If we reach here, there was an issue but no error was set
      throw new Error('Failed to delete task');
    } catch (error) {
      console.error('Error deleting task:', error);
      // The error state is already handled by the fetcher
      // The DeleteAlertDialog will show the error message
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isBeingEdited = editingTask?.id === task.id;
    const isTaskLoading = dragDrop.isLoading[task.id];

    const statusColors = {
      [TaskStatus.PENDING]: "bg-amber-200 text-amber-900 border-amber-300",
      [TaskStatus.IN_PROGRESS]: "bg-blue-200 text-blue-900 border-blue-300",
      [TaskStatus.COMPLETED]:
        "bg-emerald-200 text-emerald-900 border-emerald-300",
    };

    const getStatusLabel = (status: TaskStatus): string => {
      switch (status) {
        case TaskStatus.PENDING:
          return "Pendiente";
        case TaskStatus.IN_PROGRESS:
          return "En Progreso";
        case TaskStatus.COMPLETED:
          return "Completado";
        default:
          return "Desconocido";
      }
    };

    return (
<div
  draggable={!isBeingEdited}
  onDragStart={() => dragDrop.handleDragStart(task.id)}
  onDragEnd={dragDrop.handleDragEnd}
  className={`bg-white rounded-lg shadow-md p-4 mb-3 relative ${
    isTaskLoading ? "opacity-60" : "hover:shadow-lg"
  } transition-all border border-gray-100 hover:border-gray-200`}
>
        {isTaskLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg mb-2 text-gray-900">
            {task.title}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditTask(task)}
              className="text-gray-500 hover:text-indigo-700 p-1 rounded hover:bg-gray-100"
              title="Editar Tarea"
            >
              <img src="/edit.svg" alt="Editar Tarea" className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTask(task)}
              className="text-gray-500 hover:text-red-600 hover:bg-gray-100 p-1 rounded"
              title="Eiminar Tarea"
            >
              <img src="/delete.svg" alt="Eiminar Tarea" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-3">{task.description}</p>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[task.status]
          } border`}
        >
          {getStatusLabel(task.status)}
        </span>
      </div>
    );
  };

  const Column = ({
    title,
    tasks,
    status,
    bgColor,
    borderColor,
  }: {
    title: string;
    tasks: Task[];
    status: TaskStatus;
    bgColor: string;
    borderColor: string;
  }) => {
    const columnId = `column-${status}`;

    const getEmptyMessage = () => {
      switch (status) {
        case TaskStatus.PENDING:
          return "No hay tareas pendientes";
        case TaskStatus.IN_PROGRESS:
          return "No hay tareas en progreso";
        case TaskStatus.COMPLETED:
          return "No hay tareas completadas";
        default:
          return "No hay tareas";
      }
    };

    return (
      <div
        className={`${bgColor} rounded-lg shadow-md p-4 flex-1 min-w-[300px] border ${borderColor} 
        ${
          dragDrop.isDraggedOver(columnId) ? "ring-2 ring-indigo-400" : ""
        } transition-all`}
        onDragOver={(e) => dragDrop.handleDragOver(e, columnId)}
        onDragLeave={() => dragDrop.handleDragLeave(columnId)}
        onDrop={() => dragDrop.handleDrop(status, columnId)}
      >
        <h2 className="font-bold text-lg mb-4 flex items-center justify-between text-gray-800 border-b pb-2">
          <span className="text-gray-800">
            {status === TaskStatus.PENDING
              ? "Pendiente"
              : status === TaskStatus.IN_PROGRESS
              ? "En Progreso"
              : "Completado"}
          </span>
          <span className="bg-white rounded-full px-3 py-1 text-sm shadow-sm">
            {tasks.length}
          </span>
        </h2>
        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-600 bg-white bg-opacity-60 rounded-lg border border-dashed border-gray-300">
              {getEmptyMessage()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 inline-flex items-center justify-center">
            Tablero de tareas
          </h1>
          <p className="text-gray-600 mt-2">
            Crea, arrastra y suelta las tareas entre columnas para actualizar su
            estado.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 pb-8">
          <Column
            title="Pendiente"
            tasks={pendingTasks}
            status={TaskStatus.PENDING}
            bgColor="bg-amber-50"
            borderColor="border-amber-200"
          />

          <Column
            title="En Progreso"
            tasks={inProgressTasks}
            status={TaskStatus.IN_PROGRESS}
            bgColor="bg-blue-50"
            borderColor="border-blue-200"
          />

          <Column
            title="Completado"
            tasks={completedTasks}
            status={TaskStatus.COMPLETED}
            bgColor="bg-emerald-50"
            borderColor="border-emerald-200"
          />
        </div>
      </div>

      {editingTask && (
        <CustomTaskForm
          action={formAction.EDIT}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          isSubmitting={fetcher.isLoading}
          error={fetcher.error}
        />
      )}

      {deletingTask && (
        <DeleteAlertDialog
          title="Eliminar Tarea"
          message="¿Estás seguro de que deseas eliminar la tarea"
          itemName={deletingTask.title}
          onDelete={async () => await handleDeleteConfirm(deletingTask.id)}
          onCancel={() => setDeletingTask(null)}
          isOpen={!!deletingTask}
          error={fetcher.error}
          isDeleting={fetcher.isLoading}
        />
      )}
    </div>
  );
}
