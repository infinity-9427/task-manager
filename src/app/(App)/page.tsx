'use client'
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { RiTimeLine, RiRefreshLine, RiCheckLine } from "@remixicon/react";
import { useKanbanDragAndDrop, Task, TaskStatus } from "../_hooks/useDragAndDrop";
import CustomAlert from "@/components/CustomAlert";

// Define a schema for a task using zod
const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "El título es requerido"),
  description: z.string(),
  assignedUser: z.string(),
  status: z.enum(["pendiente", "en progreso", "completada"]),
});

// Validate an array of tasks using zod
const tasksArraySchema = z.array(taskSchema);

// Initial tasks for each column
const initialPendiente: Task[] = tasksArraySchema.parse([
  { id: "1", title: "Schedule perm", description: "Arrange and schedule the perm task", assignedUser: "Alice", status: "pendiente" },
  { id: "2", title: "Rewind VHS tapes", description: "Organize VHS library", assignedUser: "Bob", status: "pendiente" },
  { id: "3", title: "Make change for the arcade", description: "Collect funds and arrange change", assignedUser: "Charlie", status: "pendiente" },
  { id: "6", title: "Return Nintendo Power Glove", description: "Return the glove to store", assignedUser: "Frank", status: "pendiente" },
]);

const initialEnProgreso: Task[] = tasksArraySchema.parse([
  { id: "7", title: "Pickup new mix-tape from Beth", description: "Collect mix-tape", assignedUser: "Grace", status: "en progreso" },
]);

const initialCompletada: Task[] = tasksArraySchema.parse([
  { id: "4", title: "Get disposable camera developed", description: "Develop camera photos", assignedUser: "Daniel", status: "completada" },
  { id: "5", title: "Learn C++", description: "Complete C++ tutorial", assignedUser: "Eve", status: "completada" },
]);

// Get an icon based on task status
const getStatusIcon = (status: Task["status"]) => {
  switch (status) {
    case "pendiente":
      return <RiTimeLine size={20} color="#f59e0b" />;
    case "en progreso":
      return <RiRefreshLine size={20} color="#3b82f6" />;
    case "completada":
      return <RiCheckLine size={20} color="#10b981" />;
    default:
      return null;
  }
};

const KanbanBoard = () => {
  // Manage tasks in each column with state
  const [pendienteTasks, setPendienteTasks] = useState<Task[]>(initialPendiente);
  const [enProgresoTasks, setEnProgresoTasks] = useState<Task[]>(initialEnProgreso);
  const [completadaTasks, setCompletadaTasks] = useState<Task[]>(initialCompletada);

  // For inline edit of task description
  const [editingTask, setEditingTask] = useState<{ id: string; column: TaskStatus } | null>(null);
  const [editedDescription, setEditedDescription] = useState("");

  // Track all tasks in a single array for better management
  const [allTasks, setAllTasks] = useState<Task[]>([
    ...initialPendiente,
    ...initialEnProgreso,
    ...initialCompletada
  ]);

  // State for CustomAlert
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("success");

  // Update all tasks whenever individual columns change
  useEffect(() => {
    setAllTasks([...pendienteTasks, ...enProgresoTasks, ...completadaTasks]);
  }, [pendienteTasks, enProgresoTasks, completadaTasks]);

  // Handle status change (API calls, etc.)
  const handleStatusChange = async (taskIds: string[], newStatus: TaskStatus) => {
    try {
      console.log(`Tasks ${taskIds.join(", ")} updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update task status:", error);
      throw error;
    }
  };

  // Create a new task
  const handleCreateTask = (newTask: Task) => {
    setPendienteTasks((prev) => [...prev, newTask]);
  };

  // Use our custom hook for each column
  const pendienteColumn = useKanbanDragAndDrop({
    pendienteTasks,
    enProgresoTasks,
    completadaTasks,
    setPendienteTasks,
    setEnProgresoTasks,
    setCompletadaTasks,
    columnType: "pendiente",
    options: {
      onStatusChange: handleStatusChange,
      onError: (error) => console.error("Pendiente column error:", error),
    },
  });

  const enProgresoColumn = useKanbanDragAndDrop({
    pendienteTasks,
    enProgresoTasks,
    completadaTasks,
    setPendienteTasks,
    setEnProgresoTasks,
    setCompletadaTasks,
    columnType: "en progreso",
    options: {
      onStatusChange: handleStatusChange,
      onError: (error) => console.error("En Progreso column error:", error),
    },
  });

  const completadaColumn = useKanbanDragAndDrop({
    pendienteTasks,
    enProgresoTasks,
    completadaTasks,
    setPendienteTasks,
    setEnProgresoTasks,
    setCompletadaTasks,
    columnType: "completada",
    options: {
      onStatusChange: handleStatusChange,
      onError: (error) => console.error("Completada column error:", error),
    },
  });

  // Update the description for a task in the specified column
  const updateTaskDescription = (column: TaskStatus, id: string, newDescription: string) => {
    try {
      const updater = (tasks: Task[]) =>
        tasks.map((task) => (task.id === id ? { ...task, description: newDescription } : task));

      if (column === "pendiente") setPendienteTasks(updater(pendienteTasks));
      if (column === "en progreso") setEnProgresoTasks(updater(enProgresoTasks));
      if (column === "completada") setCompletadaTasks(updater(completadaTasks));

      setEditingTask(null);
      setAlertMessage("Descripción actualizada");
      setAlertType("success");
    } catch (error) {
      console.error("Failed to update task description:", error);
      setAlertMessage("Error al actualizar la descripción");
      setAlertType("error");
    }
  };

  // Styles
  const columnStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
    minHeight: "300px",
    border: "1px solid #e0e0e0"
  };

  const itemStyle: React.CSSProperties = {
    margin: "0.5rem 0",
    padding: "0.75rem",
    background: "#f5f7fa",
    border: "1px solid #d0d7de",
    borderRadius: "4px",
    cursor: "grab",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  };

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#333",
    marginBottom: "1rem"
  };

  const listStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    minHeight: "100px",
    height: "100%"
  };

  // Render a single task row with dynamic status icon and inline editing
  const renderTask = (task: Task, column: TaskStatus) => {
    const isEditing = editingTask && editingTask.id === task.id && editingTask.column === column;
    const effectiveStatus = column;

    return (
      <li key={task.id} className="kanban-item" style={itemStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{getStatusIcon(effectiveStatus)}</span>
          <h3 style={{ margin: 0, color: "#1a202c", fontWeight: 600 }}>{task.title}</h3>
        </div>
        {isEditing ? (
          <>
            <textarea
              style={{ width: "100%", resize: "vertical", padding: "0.25rem" }}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
            <button
              onClick={() => updateTaskDescription(column, task.id, editedDescription)}
              style={{ padding: "0.25rem 0.5rem" }}
            >
              Guardar
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#2d3748", lineHeight: "1.4" }}>
              {task.description}
            </p>
            <small
              style={{
                display: "block",
                color: "#4a5568",
                fontSize: "0.85rem",
                marginTop: "0.5rem"
              }}
            >
              Asignado a: <span style={{ fontWeight: 500 }}>{task.assignedUser}</span>
            </small>
          </>
        )}
      </li>
    );
  };

  return (
    <div>
      {/* CustomAlert for success/error messages */}
      {alertMessage && (
        <div className="p-4">
          <CustomAlert
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertMessage("")}
          />
        </div>
      )}

      <div
        className="kanban-board"
        style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "0 1rem" }}
      >
        <div className="kanban-column" style={columnStyle}>
          <h2 style={headerStyle}>Pendiente</h2>
          <ul ref={pendienteColumn.listRef} style={listStyle}>
            {pendienteColumn.items.map((task) => renderTask(task, "pendiente"))}
          </ul>
        </div>
        <div className="kanban-column" style={columnStyle}>
          <h2 style={headerStyle}>En Progreso</h2>
          <ul ref={enProgresoColumn.listRef} style={listStyle}>
            {enProgresoColumn.items.map((task) => renderTask(task, "en progreso"))}
          </ul>
        </div>
        <div className="kanban-column" style={columnStyle}>
          <h2 style={headerStyle}>Completada</h2>
          <ul ref={completadaColumn.listRef} style={listStyle}>
            {completadaColumn.items.map((task) => renderTask(task, "completada"))}
          </ul>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .kanban-board {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

const page = () => {
  return (
    <div style={{ maxWidth: "1200px", margin: "3rem auto", fontFamily: "Arial, sans-serif", padding: "0 1rem" }}>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: "2rem" }}>Tasks Board</h1>
      <KanbanBoard />
    </div>
  );
};

export default page;