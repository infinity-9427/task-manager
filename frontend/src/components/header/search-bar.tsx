'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { RiSearchLine, RiAddLine, RiCloseLine } from '@remixicon/react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTaskContext } from '@/contexts/task-context'
import { useSearchContext } from '@/contexts/search-context'
import { useTasks } from '@/hooks/use-tasks'
import { SEARCH_CONFIG } from '@/lib/constants'
import SearchAutocomplete from './search-autocomplete'
import { Task } from '@/types'

export default function SearchBar() {
  const { openCreateModal } = useTaskContext()
  const { searchQuery, setSearchQuery } = useSearchContext()
  const { data: allTasks = [] } = useTasks()
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter tasks based on search query - using useMemo to prevent infinite loops
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }

    const query = searchQuery.toLowerCase().trim()
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.priority.toLowerCase().includes(query)
    )
  }, [searchQuery, allTasks])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setIsDropdownVisible(value.trim().length > 0)
  }

  const handleSearchFocus = () => {
    if (searchQuery.trim().length > 0) {
      setIsDropdownVisible(true)
    }
  }

  const handleTaskSelect = (task: Task) => {
    setSearchQuery(task.title)
    setIsDropdownVisible(false)
    inputRef.current?.blur()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setIsDropdownVisible(false)
    inputRef.current?.focus()
  }

  // Limit results for performance
  const limitedTasks = filteredTasks.slice(0, SEARCH_CONFIG.maxResults)

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex-1 max-w-md mx-8">
      <div className="relative flex items-center gap-2" ref={searchRef}>
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            className="pl-10 pr-10 h-10 bg-gray-50 border-transparent focus:bg-white focus:border-purple-300 focus:ring-0 focus:outline-none hover:border-gray-200 hover:bg-gray-100 transition-all duration-200 ease-in-out"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200 ease-in-out z-10"
              aria-label="Clear search"
            >
              <RiCloseLine className="w-3 h-3" />
            </button>
          )}
          <SearchAutocomplete
            tasks={limitedTasks}
            isVisible={isDropdownVisible}
            onTaskSelect={handleTaskSelect}
          />
        </div>
        <Button
          onClick={openCreateModal}
          size="sm"
          className="h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700 transition-colors"
          aria-label="Create new task"
        >
          <RiAddLine className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}