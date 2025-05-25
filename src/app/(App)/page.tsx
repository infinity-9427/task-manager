'use client'
import React, { useState, useEffect } from "react";
import { useTaskContext } from "../context/TaskContext";
import { TaskStatus, Task } from '@/app/shared/types/tasks';
import { useKanbanDragAndDrop } from "../_hooks/useDragAndDrop";
import CustomAlert from "@/components/CustomAlert";


const KanbanBoard = () => {
  // Debug to see what values we're working with
  console.log('TaskStatus enum values:', Object.values(TaskStatus));
  
  // Ensure we have a valid tasks array even if context isn't ready
  const contextValue = useTaskContext();
  const tasks = Array.isArray(contextValue?.tasks) ? contextValue.tasks : [];
  const setTasks = contextValue?.setTasks || (() => {});
  
  console.log('Tasks from context:', tasks);
  
  // String comparison for enum values with spaces can be tricky
  // Let's make sure we're comparing exactly what we expect
  const pendingTasks = tasks.filter(task => 
    task && task.status === TaskStatus.PENDING
  );
  const inProgressTasks = tasks.filter(task => 
    task && task.status === TaskStatus.IN_PROGRESS
  );
  const completedTasks = tasks.filter(task => 
    task && task.status === TaskStatus.COMPLETED
  );
  
  console.log('Filtered tasks:', {
    pending: pendingTasks,
    inProgress: inProgressTasks,
    completed: completedTasks
  });

  const setpendingTasks = (newTasks: Task[]) => {
    setTasks(prev => [
      ...prev.filter(task => task.status !== TaskStatus.PENDING),
      ...newTasks.map(task => ({ ...task, status: TaskStatus.PENDING as TaskStatus }))
    ]);
  };
  const setinProgressTasks = (newTasks: Task[]) => {
    setTasks(prev => [
      ...prev.filter(task => task.status !== TaskStatus.IN_PROGRESS),
      ...newTasks.map(task => ({ ...task, status: TaskStatus.IN_PROGRESS as TaskStatus }))
    ]);
  };
  const setcompletedTasks = (newTasks: Task[]) => {
    setTasks(prev => [
      ...prev.filter(task => task.status !== TaskStatus.COMPLETED),
      ...newTasks.map(task => ({ ...task, status: TaskStatus.COMPLETED as TaskStatus }))
    ]);
  };

  const [editingTask, setEditingTask] = useState<{ id: string; column: TaskStatus } | null>(null);
  const [editedDescription, setEditedDescription] = useState("");

  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "warning">("success");

  const handleStatusChange = async (taskIds: string[], newStatus: TaskStatus) => {
    try {
      const updatedTasks = tasks.map(task => 
        taskIds.includes(task.id) 
          ? { ...task, status: newStatus } 
          : task
      );
      
      setTasks(updatedTasks);
      
      console.log(`Tasks ${taskIds.join(", ")} updated to ${newStatus}`);
      setAlertMessage(`Tarea${taskIds.length > 1 ? 's' : ''} actualizada${taskIds.length > 1 ? 's' : ''} a ${getStatusDisplayName(newStatus)}`);
      setAlertType("success");
    } catch (error) {
      console.error("Failed to update task status:", error);
      setAlertMessage("Error al actualizar el estado de la tarea");
      setAlertType("error");
      throw error;
    }
  };

  const getStatusDisplayName = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.PENDING: return TaskStatus.PENDING;
      case TaskStatus.IN_PROGRESS: return TaskStatus.IN_PROGRESS;
      case TaskStatus.COMPLETED: return TaskStatus.COMPLETED;
      default: return status;
    }
  };

  const pendienteColumn = useKanbanDragAndDrop({
    pendingTasks,
    inProgressTasks,
    completedTasks,
    setpendingTasks,
    setinProgressTasks,
    setcompletedTasks,
    columnType: TaskStatus.PENDING,
    options: {
      onStatusChange: handleStatusChange,
      onError: (error) => {
        console.error("Pendiente column error:", error);
        setAlertMessage("Error en columna Pendiente: " + error.message);
        setAlertType("error");
      },
      onAlert: (message, type) => {
        setAlertMessage(message);
        setAlertType(type);
      }
    },
  });

  const enProgresoColumn = useKanbanDragAndDrop({
    pendingTasks,
    inProgressTasks,
    completedTasks,
    setpendingTasks,
    setinProgressTasks,
    setcompletedTasks,
    columnType: TaskStatus.IN_PROGRESS,
    options: {
      onStatusChange: handleStatusChange,
      onError: (error) => {
        console.error("En Progreso column error:", error);
        setAlertMessage("Error en columna En Progreso: " + error.message);
        setAlertType("error");
      },
      onAlert: (message, type) => {
        setAlertMessage(message);
        setAlertType(type);
      }
    },
  });

  const completadaColumn = useKanbanDragAndDrop({
    pendingTasks,
    inProgressTasks,
    completedTasks,
    setpendingTasks,
    setinProgressTasks,
    setcompletedTasks,
    columnType: TaskStatus.COMPLETED,
    options: {
      onStatusChange: handleStatusChange,
      onError: (error) => {
        console.error("Completada column error:", error);
        setAlertMessage("Error en columna Completada: " + error.message);
        setAlertType("error");
      },
      onAlert: (message, type) => {
        setAlertMessage(message);
        setAlertType(type);
      }
    },
  });

  const updateTaskDescription = (column: TaskStatus, id: string, newDescription: string) => {
    try {
      const updater = (tasksColumn: Task[]) =>
        tasksColumn.map((task) => (task.id === id ? { ...task, description: newDescription } : task));

      if (column === TaskStatus.PENDING) setpendingTasks(updater(pendingTasks));
      if (column === TaskStatus.IN_PROGRESS) setinProgressTasks(updater(inProgressTasks));
      if (column === TaskStatus.COMPLETED) setcompletedTasks(updater(completedTasks));

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
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#2d3748", lineHeight: "1.4" }}>
            {task.description}
          </p>
        )}
      </li>
    );
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case TaskStatus.PENDING:
        return (
          <span style={{
            backgroundColor: "#fff7ed", 
            color: "#9a3412", 
            border: "1px solid #fdba74",
            padding: "2px 8px", 
            borderRadius: "12px", 
            fontSize: "0.75rem", 
            fontWeight: 600
          }}>
            Pendiente
          </span>
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <span style={{
            backgroundColor: "#eff6ff", 
            color: "#1e40af", 
            border: "1px solid #93c5fd",
            padding: "2px 8px", 
            borderRadius: "12px", 
            fontSize: "0.75rem", 
            fontWeight: 600
          }}>
            En progreso
          </span>
        );
      case TaskStatus.COMPLETED:
        return (
          <span style={{
            backgroundColor: "#ecfdf5", 
            color: "#065f46", 
            border: "1px solid #6ee7b7",
            padding: "2px 8px", 
            borderRadius: "12px", 
            fontSize: "0.75rem", 
            fontWeight: 600
          }}>
            Completada
          </span>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    console.log('Current tasks in context:', tasks);
    console.log('Pendiente tasks:', pendingTasks);
    console.log('En Progreso tasks:', inProgressTasks);
    console.log('Completada tasks:', completedTasks);
  }, [tasks, pendingTasks, inProgressTasks, completedTasks]);


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

      <div className="kanban-board" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "0 1rem" }}>
        <div className="kanban-column" style={columnStyle}>
          <h2 style={headerStyle}>Pendiente</h2>
          <ul ref={pendienteColumn.listRef} style={listStyle}>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => renderTask(task, TaskStatus.PENDING))
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#666', fontStyle: 'italic' }}>
                No pending tasks
              </div>
            )}
          </ul>
        </div>
        
        <div className="kanban-column" style={columnStyle}>
          <h2 style={headerStyle}>En Progreso</h2>
          <ul ref={enProgresoColumn.listRef} style={listStyle}>
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => renderTask(task, TaskStatus.IN_PROGRESS))
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#666', fontStyle: 'italic' }}>
                No tasks in progress
              </div>
            )}
          </ul>
        </div>
        
        <div className="kanban-column" style={columnStyle}>
          <h2 style={headerStyle}>Completada</h2>
          <ul ref={completadaColumn.listRef} style={listStyle}>
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => renderTask(task, TaskStatus.COMPLETED)) 
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#666', fontStyle: 'italic' }}>
                No completed tasks
              </div>
            )}
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