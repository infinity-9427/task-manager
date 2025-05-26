# ✅ Task Manager

<div align="center">
  <img src="./public/logo.webp" alt="Task Manager Logo" width="200" />
  
  <p>
    <strong>A powerful kanban-style task management application built with Next.js</strong>
  </p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="#demo">Demo</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#usage-guide">Usage Guide</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#api-reference">API Reference</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>
</div>

> **🔑 Quick Start**: Log in with username: `user` and password: `123456` to explore the application.

## ✨ Features

- **🗂️ Task Management**: Create, edit, delete, and track tasks through their lifecycle
- **📊 Status Tracking**: Move tasks between "Pendiente" (Pending), "En Progreso" (In Progress), and "Completada" (Completed) states
- **🚨 Priority Levels**: Set task importance with color-coded priority indicators:
  - 🟢 Baja (Low)
  - 🟡 Media (Medium)
  - 🟠 Alta (High)
  - 🔴 Urgente (Urgent)
- **🔄 Drag & Drop Interface**: Intuitively drag tasks between columns to update their status
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **🔐 User Authentication**: Secure login to keep your tasks private
- **🎨 Visual Indicators**: Color-coded labels clearly show task status and priority
- **🌐 Spanish Localization**: Full Spanish language interface
- **🔍 Task Search**: Quickly find tasks with the integrated search bar

## 🎬 Demo

<div align="center">
  <img src="./public/demo.png" alt="Task Manager Demo Screenshot" width="800" />
  <p><em>The Task Manager in action, showing the kanban board with tasks in different states</em></p>
</div>

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-manager.git
   cd task-manager
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://your-api-endpoint
```

## 📚 Usage Guide

### Authentication

The application uses a token-based authentication system with cookies for persistence:

- **Login**: Obtain an authentication token and user details
- **Logout**: Clear auth cookies and update application state

### Task Board

The main interface is a kanban board with three columns:

- **Pendiente**: For new and pending tasks
- **En Progreso**: For tasks currently being worked on
- **Completado**: For finished tasks

Tasks can be moved between columns using drag and drop:

```tsx
// From page.tsx - Drag and drop implementation
const dragDrop = useDragAndDrop<Task, TaskStatus>({
  onDropItem: async (taskId, newStatus) => {
    try {
      const result = await fetcher.put(`tasks/${taskId}`, {
        status: newStatus
      });
      
      if (result !== null && !fetcher.error) {
        updateTaskStatus(taskId, newStatus);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  },
  loadingDelay: 300
});
```

### Creating and Editing Tasks

The task form allows you to:

- Add a title and description
- Select a status
- Set a priority level

```tsx
// From CustomTaskForm.tsx - Task submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation with Zod schema
  const result = taskFormSchema.safeParse(formData);
  if (!result.success) {
    // Handle validation errors
    return;
  }

  const taskData = {
    title: formData.title,
    description: formData.description || "",
    status: formData.status,
    priority: formData.priority
  };

  if (action === formAction.CREATE) {
    const createdTask = await post('tasks', {...taskData, userId: 1});
    if (createdTask) {
      addTask(createdTask);
    }
  } else if (action === formAction.EDIT && task) {
    const updatedTask = await put(`tasks/${task.id}`, taskData);
    if (updatedTask) {
      updateTask(task.id, updatedTask);
    }
  }
};
```

## 🏗️ Architecture

### State Management

Task data is managed through React Context:

```tsx
// From TaskContext.tsx
export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Add new task
  const addTask = (task: Task) => {
    setTasks(prevTasks => [...prevTasks, task]);
  };

  // Update task status
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status } : task
      )
    );
  };
  
  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
}
```

### Custom Hooks

The application uses custom hooks for drag-and-drop functionality:

```tsx
// From useDragAndDrop.tsx
export function useDragAndDrop<TItem = any, TDestination = any>(options) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  
  // Handle drop events to update task status
  const handleDrop = async (destination: TDestination, targetId?: string) => {
    if (draggedItemId) {
      try {
        setIsLoading(prev => ({ ...prev, [draggedItemId]: true }));
        await onDropItem(draggedItemId, destination);
      } finally {
        setIsLoading(prev => ({ ...prev, [draggedItemId]: false }));
        setDraggedItemId(null);
        setDragTargetId(null);
      }
    }
  };
}
```

### API Integration

The application connects to a RESTful API with these endpoints:

- `GET /tasks`: Retrieve all tasks for the current user
- `POST /tasks`: Create a new task
- `PUT /tasks/:id`: Update an existing task
- `DELETE /tasks/:id`: Remove a task

## ⚙️ Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API
- **Form Validation**: Zod schema validation
- **Authentication**: Token-based with cookie storage
- **API Communication**: Custom fetch wrapper with TypeScript types
- **Enhanced UX**: Drag-and-drop interface for task management

## Learn More

To learn more about Next.js, take a look at the following resources:

- Next.js Documentation - learn about Next.js features and API.
- Learn Next.js - an interactive Next.js tutorial.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.