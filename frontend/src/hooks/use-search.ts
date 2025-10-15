'use client'

import { useMemo } from 'react'
import { Task } from '@/types'
import { SEARCH_CONFIG } from '@/lib/constants'

interface UseTaskSearchResult {
  filteredTasks: Task[]
  hasResults: boolean
  isSearching: boolean
  searchQuery: string
  resultCount: number
}

export function useTaskSearch(
  tasks: Task[] = [], 
  searchQuery: string = ''
): UseTaskSearchResult {
  const filteredTasks = useMemo(() => {
    // Return all tasks if query is too short
    if (searchQuery.trim().length < SEARCH_CONFIG.minQueryLength) {
      return tasks
    }

    const query = searchQuery.toLowerCase().trim()
    
    try {
      return tasks.filter(task => {
        // Safe string operations with null checks
        const titleMatch = task.title?.toLowerCase().includes(query) ?? false
        const descriptionMatch = task.description?.toLowerCase().includes(query) ?? false
        const priorityMatch = task.priority?.toLowerCase().includes(query) ?? false
        
        return titleMatch || descriptionMatch || priorityMatch
      })
    } catch (error) {
      console.warn('Search filtering error:', error)
      return tasks // Fallback to showing all tasks
    }
  }, [tasks, searchQuery])

  const isSearching = searchQuery.trim().length >= SEARCH_CONFIG.minQueryLength

  return {
    filteredTasks,
    hasResults: filteredTasks.length > 0,
    isSearching,
    searchQuery,
    resultCount: filteredTasks.length,
  }
}