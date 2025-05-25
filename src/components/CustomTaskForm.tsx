"use client";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import CustomAlert from "./CustomAlert";
import {
  TaskStatus,
  Task,
  TaskFormProps,
  formAction,
} from "@/app/shared/types/tasks";
import { useTaskContext } from "../app/context/TaskContext";
import { colorSchemeHelper, getStatusColors } from "@/utils/customFormColors";
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
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">(
    "success"
  );

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
      // Add new task
      addTask(taskData);
      console.log("Added new task to context:", taskData);

      if (onComplete) {
        const tempTask: Task = {
          ...taskData,
          id: "temp-" + Date.now().toString(),
        };
        onComplete(tempTask);
      }

      setAlertMessage("¡Tarea creada exitosamente!");
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

      setAlertMessage("¡Tarea actualizada exitosamente!");
    }

    setAlertType("success");
    setErrors({});

    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 1500);
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

  return (
    <>
      <div className="max-w-xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
        <h2 className={`text-xl font-bold mb-4 ${scheme.titleColor}`}>
          {action === "create" ? "Crear Nueva Tarea" : "Editar Tarea"}
        </h2>

        {alertMessage && (
          <div className="mb-4">
            <CustomAlert
              message={alertMessage}
              type={alertType}
              onClose={() => setAlertMessage("")}
            />
          </div>
        )}

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
                action === "create"
                  ? "focus:ring-2 focus:ring-teal-200 focus:border-teal-600"
                  : "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600"
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
                action === "create"
                  ? "focus:ring-2 focus:ring-teal-200 focus:border-teal-600"
                  : "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-600"
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
                    action === "create"
                      ? "focus:ring-teal-500"
                      : "focus:ring-indigo-500" // Consistent focus ring with action color
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
              {action === formAction.CREATE
                ? "Crear Tarea"
                : "Actualizar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
