"use client";
import { useTaskContext } from "@/app/context/TaskContext";
import {
  TaskStatus,
  Task,
  formAction,
  Priority,
} from "@/app/shared/types/tasks";
import { useState, useMemo } from "react";
import { useDragAndDrop } from "@/app/_hooks/useDragAndDrop";
import { useFetcher } from "@/app/_hooks/useFetcher";
import CustomTaskForm from "@/components/CustomTaskForm";
import DeleteAlertDialog from "@/components/DeleteAlertDialog";
import TaskFilter from "@/components/TaskFilter";
import TeamChat from "@/components/TeamChat";

export default function TaskBoard() {
  const { tasks, updateTaskStatus, deleteTask } = useTaskContext();
  const [filters, setFilters] = useState({
    statuses: [] as TaskStatus[],
    priorities: [] as (Priority | "NONE")[],
  });
  
  const fetcher = useFetcher<{ success: boolean }>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
  });
  const dragDrop = useDragAndDrop<Task, TaskStatus>({
    onDropItem: async (taskId, newStatus) => {
      try {
        const result = await fetcher.put(`tasks/${taskId}`, {
          status: newStatus,
        });

        if (result !== null && !fetcher.error) {
          updateTaskStatus(taskId, newStatus);
        } else {
          throw new Error("Failed to update task status");
        }
      } catch (error) {
        console.error("Error updating task status:", error);
        throw error;
      }
    },
    loadingDelay: 300,
    onError: (error) => console.error("Error updating task status:", error),
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter by status - if no statuses selected, show all
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
        return false;
      }

      // Filter by priority - if no priorities selected, show all
      if (filters.priorities.length > 0) {
        const taskPriority = task.priority || "NONE";
        if (!filters.priorities.includes(taskPriority)) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  const handleUpdateTask = async (
    updatedTask: Partial<Task> & { id: string }
  ) => {
    try {
      const result = await fetcher.put(`tasks/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
      });

      if (result !== null && !fetcher.error) {
        setEditingTask(null);
        return true;
      }

      throw new Error("Failed to update task");
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  };

  const pendingTasks = filteredTasks.filter(
    (task) => task.status === TaskStatus.PENDING
  );
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  );
  const completedTasks = filteredTasks.filter(
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
      const result = await fetcher.delete(`tasks/${taskId}`);

      if (result !== null || !fetcher.error) {
        deleteTask(taskId);
        setDeletingTask(null);
        return;
      }

      throw new Error("Failed to delete task");
    } catch (error) {
      console.error("Error deleting task:", error);
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

    const priorityColors = {
      [Priority.LOW]: "bg-green-100 text-green-800 border-green-200",
      [Priority.MEDIUM]: "bg-amber-100 text-amber-800 border-amber-200",
      [Priority.HIGH]: "bg-pink-100 text-pink-800 border-pink-200",
      [Priority.URGENT]: "bg-purple-100 text-purple-800 border-purple-200",
    };

    const getStatusLabel = (status: TaskStatus): string => {
      switch (status) {
        case TaskStatus.PENDING:
          return "Pending";
        case TaskStatus.IN_PROGRESS:
          return "In Progress";
        case TaskStatus.COMPLETED:
          return "Completed";
        default:
          return "Unknown";
      }
    };

    const getPriorityLabel = (priority?: Priority): string => {
      if (!priority) return "";

      switch (priority) {
        case Priority.LOW:
          return "Low";
        case Priority.MEDIUM:
          return "Medium";
        case Priority.HIGH:
          return "High";
        case Priority.URGENT:
          return "Urgent";
        default:
          return "";
      }
    };

    return (
      <div
        draggable={!isBeingEdited}
        onDragStart={() => dragDrop.handleDragStart(task.id)}
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
              title="Edit Task"
            >
              <img src="/edit.svg" alt="Edit Task" className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTask(task)}
              className="text-gray-500 hover:text-red-600 hover:bg-gray-100 p-1 rounded"
              title="Delete Task"
            >
              <img src="/delete.svg" alt="Delete Task" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-3">{task.description}</p>

        <div className="flex flex-col gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[task.status]
            } border inline-flex items-center w-fit`}
          >
            {getStatusLabel(task.status)}
          </span>

          {task.priority && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                priorityColors[task.priority]
              } border inline-flex items-center gap-1 w-fit`}
            >
              <img src="/flag.svg" alt="Priority" className="w-3 h-3" />
              {getPriorityLabel(task.priority)}
            </span>
          )}
        </div>
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
          return "No pending tasks";
        case TaskStatus.IN_PROGRESS:
          return "No tasks in progress";
        case TaskStatus.COMPLETED:
          return "No completed tasks";
        default:
          return "No tasks";
      }
    };

    return (
      <div
        className={`${bgColor} rounded-lg shadow-md p-4 w-full border ${borderColor} 
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
              ? "Pending"
              : status === TaskStatus.IN_PROGRESS
              ? "In Progress"
              : "Completed"}
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
      <div className="max-w-[2000px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 inline-flex items-center justify-center">
            Task Manager
          </h1>
          <p className="text-gray-600 mt-2">
            Create, drag, and drop tasks between columns to update their status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <TaskFilter 
              onFilterChange={setFilters} 
              activeFilters={filters} 
            />
          </div>

          {/* Main Content - Task Board */}
          <div className="lg:col-span-7 xl:col-span-8 2xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 h-fit">
              <Column
                title="Pending"
                tasks={pendingTasks}
                status={TaskStatus.PENDING}
                bgColor="bg-amber-50"
                borderColor="border-amber-200"
              />

              <Column
                title="In Progress"
                tasks={inProgressTasks}
                status={TaskStatus.IN_PROGRESS}
                bgColor="bg-blue-50"
                borderColor="border-blue-200"
              />

              <Column
                title="Completed"
                tasks={completedTasks}
                status={TaskStatus.COMPLETED}
                bgColor="bg-emerald-50"
                borderColor="border-emerald-200"
              />
            </div>
          </div>

          {/* Right Sidebar - Team Chat */}
          <div className="lg:col-span-3 xl:col-span-2 2xl:col-span-2">
            <TeamChat 
              currentUserId="current-user-id" 
              currentUserName="You"
            />
          </div>
        </div>
      </div>

      {editingTask && (
        <CustomTaskForm
          action={formAction.EDIT}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onComplete={() => setEditingTask(null)}
        />
      )}

      {deletingTask && (
        <DeleteAlertDialog
          title="Delete Task"
          message="Are you sure you want to delete the task"
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
