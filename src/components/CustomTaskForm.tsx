"use client";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import {
  TaskStatus,
  Task,
  TaskFormProps,
  formAction,
  IColorSchema,
} from "@/app/shared/types/tasks";
import { useTaskContext } from "../app/context/TaskContext";
import clsx from "clsx";

const taskFormSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  status: z
    .enum([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED])
    .default(TaskStatus.PENDING),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export default function TaskForm({
  action = formAction.CREATE,
  task,
  onComplete,
  onClose,
}: TaskFormProps) {
  const { addTask, updateTask } = useTaskContext();

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: TaskStatus.PENDING,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (action === "edit" && task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
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

  const handleSubmit = (e: React.FormEvent) => {
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
    };

    if (action === formAction.CREATE) {
      addTask(taskData);
      console.log("Added new task to context:", taskData);

      if (onComplete) {
        const tempTask: Task = {
          ...taskData,
          id: "temp-" + Date.now().toString(),
        };
        onComplete(tempTask);
      }

      // Close form immediately for create action
      if (onClose) {
        onClose();
      }
      
      // Reset form data in case form isn't closed
      setFormData({
        title: "",
        description: "",
        status: TaskStatus.PENDING,
      });
      
    } else if (action === formAction.EDIT && task) {
      // Update existing task
      updateTask(task.id, taskData);
      console.log("Updated task in context:", { id: task.id, ...taskData });

      if (onComplete) {
        onComplete({
          ...taskData,
          id: task.id,
        });
      }
      
      // Close modal immediately for edit action
      if (onClose) {
        onClose();
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
                    className={clsx(
                      "py-2 px-5 rounded-md font-medium text-sm md:text-base transition-colors shadow-sm",
                      scheme.button
                    )}
                  >
                    Actualizar Tarea
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

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className={clsx(
                  "py-2 px-5 text-white rounded-md font-medium text-sm md:text-base transition-colors shadow-sm",
                  scheme.button
                )}
              >
                Crear Tarea
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
