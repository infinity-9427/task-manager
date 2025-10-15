'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface SearchContextType {
  readonly searchQuery: string
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | null>(null)

interface SearchProviderProps {
  readonly children: ReactNode
  readonly initialQuery?: string
}

export function SearchProvider({ children, initialQuery = '' }: SearchProviderProps) {
  const [searchQuery, setSearchQueryState] = useState(initialQuery)

  const setSearchQuery = useCallback((query: string) => {
    if (typeof query === 'string') {
      setSearchQueryState(query)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQueryState('')
  }, [])

  const contextValue: SearchContextType = {
    searchQuery,
    setSearchQuery,
    clearSearch,
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext(): SearchContextType {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider')
  }
  return context
}