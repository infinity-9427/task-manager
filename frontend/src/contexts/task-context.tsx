'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface TaskContextType {
  readonly isCreateModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
}

const TaskContext = createContext<TaskContextType | null>(null)

interface TaskProviderProps {
  readonly children: ReactNode
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true)
  }, [])

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const contextValue: TaskContextType = {
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
  }

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return context
}