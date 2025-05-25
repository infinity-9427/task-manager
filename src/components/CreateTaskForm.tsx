'use client'
import { z } from 'zod';
import React, { useState } from 'react';
import CustomAlert from './CustomAlert';
import { Task, TaskStatus } from '../app/_hooks/useDragAndDrop';

const taskFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  status: z.enum(['pendiente', 'en progreso', 'completada']).default('pendiente'),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface CreateTaskFormProps {
  onCreate: (task: Task) => void;
}

export default function CreateTaskForm({ onCreate }: CreateTaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'pendiente',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');

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

    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description || '',
      status: formData.status as TaskStatus,
    };

    onCreate(newTask);
    setAlertMessage('¡Tarea creada exitosamente!');
    setAlertType('success');
    setFormData({ title: '', description: '', status: 'pendiente' });
    setErrors({});
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      {alertMessage && (
        <div className="mb-4">
          <CustomAlert
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertMessage('')}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block mb-2 font-semibold text-gray-700 text-sm md:text-base"
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
            className={`w-full p-3 border ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } rounded-md text-sm md:text-base transition-colors focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200`}
          />
          {errors.title && <p className="mt-1 text-xs md:text-sm text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block mb-2 font-semibold text-gray-700 text-sm md:text-base"
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
            className="w-full p-3 border border-gray-300 rounded-md text-sm md:text-base transition-colors focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-y"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700 text-sm md:text-base">
            Estado de la Tarea
          </label>
          <div className="flex space-x-2">
            {(['pendiente', 'en progreso', 'completada'] as TaskStatus[]).map((statusOption) => (
              <button
                key={statusOption}
                type="button"
                onClick={() => handleStatusChange(statusOption)}
                className={`px-3 py-2 rounded-md text-sm md:text-base transition-colors ${
                  formData.status === statusOption
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="py-2 px-4 text-white bg-teal-600 hover:bg-teal-700 rounded-md font-medium text-sm md:text-base transition-colors"
          >
            Crear Tarea
          </button>
        </div>
      </form>
    </div>
  );
}