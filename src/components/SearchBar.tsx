"use client";
import { useState, useEffect, useRef } from "react";
import { Task,TaskStatus } from '@/app/shared/types/tasks';
import { useTaskContext } from "@/app/context/TaskContext";

interface SearchBarProps {
  onTaskSelect?: (taskId: string) => void;
  className?: string;
}

const SearchBar = ({ onTaskSelect, className = '' }: SearchBarProps) => {
  const { tasks } = useTaskContext();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Update search results when search query or tasks change
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery === '') {
      setSearchResults([]);
      return;
    }

    const filteredTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(trimmedQuery.toLowerCase())
      // Removing description search as requested
    );

    setSearchResults(filteredTasks);
  }, [searchQuery, tasks]);

  useEffect(() => {
    // Add click event listener to close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery.trim() !== '') {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    // Don't hide suggestions on blur since we want to allow clicking on them
    // The clickOutside handler will take care of hiding them when appropriate
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim() !== '');
  };

  const handleSuggestionClick = (task: Task) => {
    setSearchQuery(task.title);
    setShowSuggestions(false);
    if (onTaskSelect) {
      onTaskSelect(task.id);
    }
  };

  return (
    <div
      ref={searchRef}
      className={`relative ${className}`}
    >
      <div
        className={`flex items-center bg-gray-800 rounded-md px-3 py-1 border ${
          isSearchFocused ? "border-blue-400" : "border-transparent"
        }`}
      >
        <input
          type="text"
          placeholder="Search tasks..."
          className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full text-sm sm:text-base"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-gray-400 hover:text-white ml-2"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Search Suggestions with "No Results" state */}
      {showSuggestions && searchQuery.trim() !== '' && (
        <div className="absolute mt-1 w-full bg-gray-800 rounded-md shadow-lg border border-gray-700 overflow-hidden animate-fadeIn z-10">
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((task) => (
                <li
                  key={task.id}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
                  onClick={() => handleSuggestionClick(task)}
                >
                  <div className="font-medium">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-400 truncate">{task.description}</div>
                  )}
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded-full ${
                      task.status === TaskStatus.PENDING ? 'bg-yellow-800 text-yellow-200' :
                      task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-800 text-blue-200' : 
                      'bg-green-800 text-green-200'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-center text-gray-400">
              No tasks found for: "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SearchBar;