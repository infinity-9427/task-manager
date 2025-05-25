'use client'
import React, { useState, useEffect } from "react";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { toast } from "sonner";
import { z } from "zod";
// Import icons from Remix Icon
import { RiTimeLine, RiRefreshLine, RiCheckLine } from "@remixicon/react";

// Define a schema for a task using zod
const taskSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "El título es requerido"),
    description: z.string(),
    assignedUser: z.string(),
    status: z.enum(["pendiente", "en progreso", "completada"]),
});
type Task = z.infer<typeof taskSchema>;

// Validate an array of tasks using zod
const tasksArraySchema = z.array(taskSchema);

// Initial tasks for each column based on status
const initialPendiente: Task[] = tasksArraySchema.parse([
    { id: "1", title: "Schedule perm", description: "Arrange and schedule the perm task", assignedUser: "Alice", status:"pendiente" },
    { id: "2", title: "Rewind VHS tapes", description: "Organize VHS library", assignedUser: "Bob", status:"pendiente" },
    { id: "3", title: "Make change for the arcade", description: "Collect funds and arrange change", assignedUser: "Charlie", status:"pendiente" },
    { id: "6", title: "Return Nintendo Power Glove", description: "Return the glove to store", assignedUser: "Frank", status:"pendiente" },
]);

const initialEnProgreso: Task[] = tasksArraySchema.parse([
    { id: "7", title: "Pickup new mix-tape from Beth", description: "Collect mix-tape", assignedUser: "Grace", status:"en progreso" },
]);

const initialCompletada: Task[] = tasksArraySchema.parse([
    { id: "4", title: "Get disposable camera developed", description: "Develop camera photos", assignedUser: "Daniel", status:"completada" },
    { id: "5", title: "Learn C++", description: "Complete C++ tutorial", assignedUser: "Eve", status:"completada" },
]);

// Get an icon based on task status - updated to use Remix icons
const getStatusIcon = (status: Task["status"]) => {
    switch(status) {
        case "pendiente": 
            return <RiTimeLine size={20} color="#f59e0b" />;
        case "en progreso": 
            return <RiRefreshLine size={20} color="#3b82f6" />;
        case "completada": 
            return <RiCheckLine size={20} color="#10b981" />;
        default: return null;
    }
};

const KanbanBoard = () => {
    // Manage tasks in each column with state
    const [pendienteTasks, setPendienteTasks] = useState<Task[]>(initialPendiente);
    const [enProgresoTasks, setEnProgresoTasks] = useState<Task[]>(initialEnProgreso);
    const [completadaTasks, setCompletadaTasks] = useState<Task[]>(initialCompletada);
    // For inline edit of task description
    const [editingTask, setEditingTask] = useState<{ id: string, column: "pendiente" | "en progreso" | "completada" } | null>(null);
    const [editedDescription, setEditedDescription] = useState("");
    
    // Track all tasks in a single array for better management
    const [allTasks, setAllTasks] = useState<Task[]>([
        ...initialPendiente,
        ...initialEnProgreso,
        ...initialCompletada
    ]);
    
    // Update all tasks whenever individual columns change
    useEffect(() => {
        setAllTasks([...pendienteTasks, ...enProgresoTasks, ...completadaTasks]);
    }, [pendienteTasks, enProgresoTasks, completadaTasks]);

    const [pendienteListRef, pendienteItems] = useDragAndDrop<HTMLUListElement, Task>(pendienteTasks, { 
        group: "kanban",
        onDrop: (newItems) => { 
            // Get IDs of tasks in this column after drop
            const newItemIds = new Set(newItems.map(item => item.id));
            
            // Update status for all tasks in this column
            const updatedItems = newItems.map(item => ({...item, status: "pendiente" as const}));
            
            // Remove these items from other columns
            const filteredEnProgreso = enProgresoTasks.filter(task => !newItemIds.has(task.id));
            const filteredCompletada = completadaTasks.filter(task => !newItemIds.has(task.id));
            
            // Update all columns
            setPendienteTasks(updatedItems);
            setEnProgresoTasks(filteredEnProgreso);
            setCompletadaTasks(filteredCompletada);
            
            toast.success("¡Tarea actualizada a Pendiente!"); 
        } 
    });
    
    const [enProgresoListRef, enProgresoItems] = useDragAndDrop<HTMLUListElement, Task>(enProgresoTasks, { 
        group: "kanban",
        onDrop: (newItems) => { 
            console.log("Drop in En Progreso:", newItems); // Debug log
            
            // Get IDs of tasks in this column after drop
            const newItemIds = new Set(newItems.map(item => item.id));
            
            // Update status for all tasks in this column
            const updatedItems = newItems.map(item => ({...item, status: "en progreso" as const}));
            
            // Remove these items from other columns (being extra careful with state)
            const filteredPendiente = pendienteTasks.filter(task => !newItemIds.has(task.id));
            const filteredCompletada = completadaTasks.filter(task => !newItemIds.has(task.id));
            
            // Batch update all columns
            setPendienteTasks(filteredPendiente);
            setEnProgresoTasks(updatedItems);
            setCompletadaTasks(filteredCompletada);
            
            toast.success("¡Tarea actualizada a En Progreso!"); 
        },
        // Add explicit drop configuration
        droppable: true
    });
    
    const [completadaListRef, completadaItems] = useDragAndDrop<HTMLUListElement, Task>(completadaTasks, { 
        group: "kanban",
        onDrop: (newItems) => { 
            // Get IDs of tasks in this column after drop
            const newItemIds = new Set(newItems.map(item => item.id));
            
            // Update status for all tasks in this column
            const updatedItems = newItems.map(item => ({...item, status: "completada" as const}));
            
            // Remove these items from other columns
            const filteredPendiente = pendienteTasks.filter(task => !newItemIds.has(task.id));
            const filteredEnProgreso = enProgresoTasks.filter(task => !newItemIds.has(task.id));
            
            // Update all columns
            setPendienteTasks(filteredPendiente);
            setEnProgresoTasks(filteredEnProgreso);
            setCompletadaTasks(updatedItems);
            
            toast.success("¡Tarea actualizada a Completada!"); 
        }
    });

    // Update description for a task in the specified column
    const updateTaskDescription = (column: string, id: string, newDescription: string) => {
        const updater = (tasks: Task[]) => tasks.map(task => task.id === id ? { ...task, description: newDescription } : task);
        if(column === "pendiente") setPendienteTasks(updater(pendienteTasks));
        if(column === "en progreso") setEnProgresoTasks(updater(enProgresoTasks));
        if(column === "completada") setCompletadaTasks(updater(completadaTasks));
        setEditingTask(null);
        toast.success("Descripción actualizada");
    };

    // Styles for columns and tasks with an improved color palette
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
    const renderTask = (task: Task, column: "pendiente" | "en progreso" | "completada") => {
        const isEditing = editingTask && editingTask.id === task.id && editingTask.column === column;
        
        // Ensure the icon matches the column, not just the task's stored status
        const effectiveStatus = column;
        
        return (
            <li key={task.id} className="kanban-item" style={itemStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>{getStatusIcon(effectiveStatus)}</span>
                    <h3 style={{ margin: 0 }}>{task.title}</h3>
                </div>
                {isEditing ? (
                    <>
                        <textarea
                            style={{ width: "100%", resize: "vertical", padding: "0.25rem" }}
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                        />
                        <button onClick={() => updateTaskDescription(column, task.id, editedDescription)} style={{ padding: "0.25rem 0.5rem" }}>Guardar</button>
                    </>
                ) : (
                    <>
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>{task.description}</p>
                        <small style={{ display: "block", color: "#666" }}>
                            Asignado a: {task.assignedUser}
                        </small>
                    </>
                )}
            </li>
        );
    };

    return (
        <div>
            {/* Create Task Form */}
            <div style={{ maxWidth: "600px", margin: "1rem auto", background: "#fff", padding: "1rem", borderRadius: "8px", boxShadow:"0 4px 8px rgba(0,0,0,0.05)", border: "1px solid #e0e0e0" }}>
                <h2 style={{ textAlign: "center", marginBottom: "1rem", color: "#333" }}>Crear Nueva Tarea</h2>
                <TaskForm 
                    onCreate={(newTask) => {
                        setPendienteTasks(prev => [...prev, newTask]);
                        toast.success("¡Tarea creada!");
                    }}
                />
            </div>

            {/* Kanban Board */}
            <div className="kanban-board" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "0 1rem" }}>
                <div className="kanban-column" style={columnStyle}>
                    <h2 style={headerStyle}>Pendiente</h2>
                    <ul ref={pendienteListRef} style={listStyle}>
                        {/* FIXED: Use the items returned by the hook */}
                        {pendienteItems.map(task => renderTask(task, "pendiente"))}
                    </ul>
                </div>
                <div className="kanban-column" style={columnStyle}>
                    <h2 style={headerStyle}>En Progreso</h2>
                    <ul 
                        ref={enProgresoListRef} 
                        style={listStyle}
                    >
                        {enProgresoItems.map(task => renderTask(task, "en progreso"))}
                    </ul>
                </div>
                <div className="kanban-column" style={columnStyle}>
                    <h2 style={headerStyle}>Completada</h2>
                    <ul ref={completadaListRef} style={listStyle}>
                        {/* FIXED: Use the items returned by the hook */}
                        {completadaItems.map(task => renderTask(task, "completada"))}
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

// Component for creating a new task
const TaskForm = ({ onCreate }: { onCreate: (task: Task) => void }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignedUser, setAssignedUser] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title.trim()){
            toast.error("El título es requerido");
            return;
        }
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            description,
            assignedUser,
            status: "pendiente"
        };
        onCreate(newTask);
        setTitle("");
        setDescription("");
        setAssignedUser("");
    };

    return (
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <input 
                type="text" 
                placeholder="Título"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ padding:"0.5rem", borderRadius:"4px", border:"1px solid #ccc" }} 
            />
            <textarea 
                placeholder="Descripción"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ padding:"0.5rem", borderRadius:"4px", border:"1px solid #ccc", resize:"vertical" }} 
            />
            <input 
                type="text" 
                placeholder="Asignado a"
                value={assignedUser}
                onChange={e => setAssignedUser(e.target.value)}
                style={{ padding:"0.5rem", borderRadius:"4px", border:"1px solid #ccc" }} 
            />
            <button type="submit" style={{ padding:"0.5rem", border:"none", borderRadius:"4px", background:"#4a90e2", color:"#fff", cursor:"pointer" }}>Crear Tarea</button>
        </form>
    );
};

const page = () => {
    return (
        <div style={{ maxWidth: "1200px", margin: "2rem auto", fontFamily: "Arial, sans-serif", padding: "0 1rem" }}>
            <h1 style={{ textAlign: "center", color: "#222", marginBottom:"2rem" }}>Tablero Kanban de Gestión de Tareas</h1>
            <KanbanBoard />
        </div>
    );
};

export default page;