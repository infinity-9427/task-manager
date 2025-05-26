"use client";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import {
  TaskStatus,
  Task,
  TaskFormProps,
  formAction,
  IColorSchema,
  Priority, // Add this import if not already in types
} from "@/app/shared/types/tasks";
import { useTaskContext } from "../app/context/TaskContext";
import clsx from "clsx";
import { useFetcher } from "@/app/_hooks/useFetcher";

const taskFormSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  status: z
    .enum([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED])
    .default(TaskStatus.PENDING),
  priority: z
    .enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])
    .optional(),
});

// Update form data type
type TaskFormData = z.infer<typeof taskFormSchema>;

export default function TaskForm({
  action = formAction.CREATE,
  task,
  onComplete,
  onClose,
}: TaskFormProps) {
  const { addTask, updateTask } = useTaskContext();
  
  // Simplified useFetcher usage
  const { post, put, data, error, isLoading } = useFetcher<Task>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL
  });

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: TaskStatus.PENDING,
    // No default priority - truly optional
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update useEffect for edit mode
  useEffect(() => {
    if (action === "edit" && task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
      });
    }
  }, [action, task]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
  };

  const handlePriorityChange = (newPriority: Priority) => {
    setFormData((prev) => ({ ...prev, priority: newPriority }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = taskFormSchema.safeParse(formData);

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0] as string;
        formattedErrors[path] = error.message;
      });
      setErrors(formattedErrors);
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description || "",
      status: formData.status as TaskStatus,
      priority: formData.priority, 
      userId: 1
    };

    if (action === formAction.CREATE) {
      // Simple POST - no try/catch needed
      const createdTask = await post('tasks', taskData);
      
      if (createdTask) {
        addTask(createdTask);
        
        if (onComplete) {
          onComplete(createdTask);
        }
        
        if (onClose) {
          onClose();
        }
        
        // Reset form data
        setFormData({
          title: "",
          description: "",
          status: TaskStatus.PENDING,
        });
      }
    } else if (action === formAction.EDIT && task) {
      // Simple PUT - no try/catch needed
      const updatedTask = await put(`tasks/${task.id}`, taskData);
      
      if (updatedTask) {
        updateTask(task.id, updatedTask);
        
        if (onComplete) {
          onComplete(updatedTask);
        }
        
        if (onClose) {
          onClose();
        }
      }
    }

    setErrors({});
  };

   const colorSchemeHelper = (action: string): IColorSchema => {
    return action === formAction.CREATE
      ? {
          primary: "teal-600",
          hover: "teal-700",
          focus: "teal-300",
          button: "bg-sky-700 hover:bg-sky-600 text-white",
          titleColor: "text-teal-700 dark:text-teal-300",
        }
      : {
          primary: "indigo-600",
          hover: "indigo-700",
          focus: "indigo-300",
          button: "bg-indigo-600 hover:bg-indigo-700 text-white",
          titleColor: "text-indigo-700 dark:text-indigo-300",
        };
  };

  const getStatusColors = (status: TaskStatus, isSelected: boolean) => {
    if (isSelected) {
      switch (status) {
        case TaskStatus.PENDING:
          return "bg-violet-500 text-white border border-violet-500";
        case TaskStatus.IN_PROGRESS:
          return "bg-cyan-500 text-white border border-cyan-500";
        case TaskStatus.COMPLETED:
          return "bg-emerald-600 text-white border border-emerald-400";

        default:
          return "bg-zinc-600 text-white border border-zinc-600";
      }
    } else {
      switch (status) {
        case TaskStatus.PENDING:
          return "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-300";
        case TaskStatus.IN_PROGRESS:
          return "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-300";
        case TaskStatus.COMPLETED:
          return "bg-emerald-100 text-lime-700 hover:bg-lime-100 border border-lime-300";
        default:
          return "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-300";
      }
    }
  };

  // Updated priority button colors based on priority level
  const getPriorityColors = (priority: Priority) => {
    if (formData.priority === priority) {
      switch (priority) {
        case Priority.LOW:
          return "bg-blue-500 text-white shadow-md";
        case Priority.MEDIUM:
          return "bg-yellow-500 text-white shadow-md";
        case Priority.HIGH:
          return "bg-orange-500 text-white shadow-md";
        case Priority.URGENT:
          return "bg-red-600 text-white shadow-md";
        default:
          return "bg-gray-600 text-white shadow-md";
      }
    } else {
      switch (priority) {
        case Priority.LOW:
          return "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300";
        case Priority.MEDIUM:
          return "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300";
        case Priority.HIGH:
          return "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-300";
        case Priority.URGENT:
          return "bg-red-50 text-red-700 hover:bg-red-100 border border-red-300";
        default:
          return "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300";
      }
    }
  };

  const scheme = colorSchemeHelper(action);

  const isEditModal = action === formAction.EDIT && onClose;

  return (
    <>
      {isEditModal ? (
        // Modal overlay for edit mode
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center">
              <h2 className={`text-xl font-bold ${scheme.titleColor}`}>
                Editar Tarea
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Remove alert display for edit mode */}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-2 font-semibold text-gray-800 text-sm md:text-base"
                  >
                    Título
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Escribe el título de la tarea"
                    className={clsx(
                      "w-full p-3 border rounded-md text-gray-800 text-sm md:text-base transition-colors focus:outline-none",
                      errors.title ? "border-red-600" : "border-gray-400",
                      "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600"
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs md:text-sm text-red-600 font-medium">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 font-semibold text-gray-800 text-sm md:text-base"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe la tarea en detalle"
                    className={clsx(
                      "w-full p-3 border border-gray-400 rounded-md text-gray-800 text-sm md:text-base transition-colors focus:outline-none resize-y",
                      "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600"
                    )}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs md:text-sm text-red-600 font-medium">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-800 text-sm md:text-base">
                    Estado de la Tarea
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        TaskStatus.PENDING,
                        TaskStatus.IN_PROGRESS,
                        TaskStatus.COMPLETED,
                      ] as TaskStatus[]
                    ).map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => handleStatusChange(statusOption)}
                        className={clsx(
                          "px-3 py-1.5 rounded-md text-sm md:text-base font-medium transition-all duration-150 ease-in-out focus:outline-none",
                          getStatusColors(
                            statusOption,
                            formData.status === statusOption
                          ),
                          "focus:ring-indigo-500" 
                        )}
                      >
                        {statusOption === TaskStatus.PENDING
                          ? "Pendiente"
                          : statusOption === TaskStatus.IN_PROGRESS
                          ? "En progreso"
                          : "Completada"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-800 text-sm md:text-base">
                    Prioridad
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        Priority.LOW,
                        Priority.MEDIUM,
                        Priority.HIGH,
                        Priority.URGENT,
                      ] as Priority[]
                    ).map((priorityOption) => (
                      <button
                        key={priorityOption}
                        type="button"
                        onClick={() => handlePriorityChange(priorityOption)}
                        className={clsx(
                          "px-3 py-1.5 rounded-md text-sm md:text-base font-medium transition-all duration-150 ease-in-out focus:outline-none",
                          getPriorityColors(priorityOption),
                          "focus:ring-2 focus:ring-opacity-50"
                        )}
                      >
                        {priorityOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium text-sm md:text-base transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={clsx(
                      "py-2 px-5 rounded-md font-medium text-sm md:text-base transition-colors shadow-sm",
                      isLoading ? "opacity-70 cursor-not-allowed" : "",
                      scheme.button
                    )}
                  >
                    {isLoading 
                      ? "Procesando..." 
                      : action === formAction.CREATE ? "Crear Tarea" : "Actualizar Tarea"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="block mb-2 font-semibold text-gray-800 text-sm md:text-base"
              >
                Título
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Escribe el título de la tarea"
                className={clsx(
                  "w-full p-3 border rounded-md text-gray-800 text-sm md:text-base transition-colors focus:outline-none",
                  errors.title ? "border-red-600" : "border-gray-400",
                  "focus:ring-2 focus:ring-teal-200 focus:border-teal-600"
                )}
              />
              {errors.title && (
                <p className="mt-1 text-xs md:text-sm text-red-600 font-medium">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block mb-2 font-semibold text-gray-800 text-sm md:text-base"
              >
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe la tarea en detalle"
                className={clsx(
                  "w-full p-3 border border-gray-400 rounded-md text-gray-800 text-sm md:text-base transition-colors focus:outline-none resize-y",
                  "focus:ring-2 focus:ring-teal-200 focus:border-teal-600"
                )}
              />
              {errors.description && (
                <p className="mt-1 text-xs md:text-sm text-red-600 font-medium">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-800 text-sm md:text-base">
                Estado de la Tarea
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    TaskStatus.PENDING,
                    TaskStatus.IN_PROGRESS,
                    TaskStatus.COMPLETED,
                  ] as TaskStatus[]
                ).map((statusOption) => (
                  <button
                    key={statusOption}
                    type="button"
                    onClick={() => handleStatusChange(statusOption)}
                    className={clsx(
                      "px-3 py-1.5 rounded-md text-sm md:text-base font-medium transition-all duration-150 ease-in-out focus:outline-none ",
                      getStatusColors(
                        statusOption,
                        formData.status === statusOption
                      ),
                      "focus:ring-teal-500"
                    )}
                  >
                    {statusOption === TaskStatus.PENDING
                      ? "Pendiente"
                      : statusOption === TaskStatus.IN_PROGRESS
                      ? "En progreso"
                      : "Completada"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-800 text-sm md:text-base">
                Prioridad
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    Priority.LOW,
                    Priority.MEDIUM,
                    Priority.HIGH,
                    Priority.URGENT,
                  ] as Priority[]
                ).map((priorityOption) => (
                  <button
                    key={priorityOption}
                    type="button"
                    onClick={() => handlePriorityChange(priorityOption)}
                    className={clsx(
                      "px-3 py-1.5 rounded-md text-sm md:text-base font-medium transition-all duration-150 ease-in-out focus:outline-none",
                      getPriorityColors(priorityOption),
                      "focus:ring-teal-500"
                    )}
                  >
                    {priorityOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "py-2 px-5 text-white rounded-md font-medium text-sm md:text-base transition-colors shadow-sm",
                  isLoading ? "opacity-70 cursor-not-allowed" : "",
                  scheme.button
                )}
              >
                {isLoading 
                  ? "Procesando..." 
                  : action === formAction.CREATE ? "Crear Tarea" : "Actualizar Tarea"}
              </button>
            </div>
          </form>

          {/* Show API errors */}
          {error && (
            <p className="mt-2 text-sm text-red-600">
              Error: {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
