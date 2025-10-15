'use client'

import { memo, useRef } from 'react'
import { RiFlagLine, RiTimeLine } from '@remixicon/react'
import { Task } from '@/types'
import { TASK_PRIORITIES } from '@/lib/constants'
import { useSearchContext } from '@/contexts/search-context'

interface SearchAutocompleteProps {
  readonly tasks: Task[]
  readonly isVisible: boolean
  readonly onTaskSelect: (task: Task) => void
}

const SearchAutocomplete = memo<SearchAutocompleteProps>(function SearchAutocomplete({ 
  tasks, 
  isVisible, 
  onTaskSelect 
}) {
  const { searchQuery } = useSearchContext()
  const dropdownRef = useRef<HTMLDivElement>(null)

  if (!isVisible || !searchQuery.trim()) return null

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const highlightMatch = (text: string, query: string): React.JSX.Element => {
    if (!query.trim() || !text) return <span>{text}</span>
    
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedQuery})`, 'gi')
      const parts = text.split(regex)
      
      return (
        <span>
          {parts.map((part, index) => 
            part && regex.test(part) ? (
              <mark key={`${part}-${index}`} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
                {part}
              </mark>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            )
          )}
        </span>
      )
    } catch (error) {
      console.warn('Text highlighting error:', error)
      return <span>{text}</span>
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
    >
      {tasks.length > 0 ? (
        <div className="py-2">
          <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </div>
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onTaskSelect(task)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  task.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-medium truncate ${
                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {highlightMatch(task.title, searchQuery)}
                    </h4>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      TASK_PRIORITIES[task.priority].color
                    }`}>
                      <RiFlagLine className="w-2.5 h-2.5 mr-1" />
                      {TASK_PRIORITIES[task.priority].label}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600 truncate mb-1">
                      {highlightMatch(task.description, searchQuery)}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-gray-500 space-x-2">
                    <span>Created {formatDate(task.createdAt)}</span>
                    {task.dueDate && (
                      <div className="flex items-center space-x-1">
                        <RiTimeLine className="w-3 h-3" />
                        <span>Due {formatDate(task.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-8 text-center">
          <div className="text-gray-400 text-sm">
            <div>No tasks found</div>
          </div>
        </div>
      )}
    </div>
  )
})

export default SearchAutocomplete