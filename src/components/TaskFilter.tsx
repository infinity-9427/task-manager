"use client";
import { TaskStatus, Priority } from "@/app/shared/types/tasks";
import { useState } from "react";
import Image from "next/image";

interface FilterOptions {
  statuses: TaskStatus[];
  priorities: (Priority | "NONE")[];
}

interface TaskFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export default function TaskFilter({ onFilterChange, activeFilters }: TaskFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const newStatuses = checked
      ? [...activeFilters.statuses, status]
      : activeFilters.statuses.filter(s => s !== status);
    
    onFilterChange({ ...activeFilters, statuses: newStatuses });
  };

  const handlePriorityChange = (priority: Priority | "NONE", checked: boolean) => {
    const newPriorities = checked
      ? [...activeFilters.priorities, priority]
      : activeFilters.priorities.filter(p => p !== priority);
    
    onFilterChange({ ...activeFilters, priorities: newPriorities });
  };

  const clearAllFilters = () => {
    onFilterChange({ statuses: [], priorities: [] });
  };

  const getActiveFilterCount = () => {
    return activeFilters.statuses.length + activeFilters.priorities.length;
  };

  const isStatusChecked = (status: TaskStatus) => {
    return activeFilters.statuses.includes(status);
  };

  const isPriorityChecked = (priority: Priority | "NONE") => {
    return activeFilters.priorities.includes(priority);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image 
            src="/filter.svg" 
            alt="Filters" 
            width={16} 
            height={16} 
            className="text-gray-500"
          />
          <h3 className="font-medium text-gray-700 text-sm">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-200">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getActiveFilterCount() > 0 && (
            <div className="relative group">
              <button
                onClick={clearAllFilters}
                className="p-1 hover:bg-gray-50 rounded transition-colors"
                title="Clear all filters"
              >
                <Image 
                  src="/filter-off.svg" 
                  alt="Clear filters" 
                  width={14} 
                  height={14} 
                  className="text-gray-400 hover:text-gray-600"
                />
              </button>
   
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-50 rounded transition-colors"
          >
            <svg 
              className={`w-3 h-3 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-5">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
              Task Status
            </label>
            <div className="space-y-2">
              {Object.values(TaskStatus).map((status) => (
                <label key={status} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isStatusChecked(status)}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded transition-all ${
                      isStatusChecked(status) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {isStatusChecked(status) && (
                        <Image 
                          src="/check-icon.svg" 
                          alt="Checked" 
                          width={12} 
                          height={12} 
                          className="text-white"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    {status === TaskStatus.PENDING
                      ? "Pending"
                      : status === TaskStatus.IN_PROGRESS
                      ? "In Progress"
                      : "Completed"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">
              Priority
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPriorityChecked("NONE")}
                    onChange={(e) => handlePriorityChange("NONE", e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border-2 rounded transition-all ${
                    isPriorityChecked("NONE") 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-white border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {isPriorityChecked("NONE") && (
                      <Image 
                        src="/check-icon.svg" 
                        alt="Checked" 
                        width={12} 
                        height={12} 
                        className="text-white"
                      />
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  No Priority
                </span>
              </label>
              {Object.values(Priority).map((priority) => (
                <label key={priority} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPriorityChecked(priority)}
                      onChange={(e) => handlePriorityChange(priority, e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded transition-all ${
                      isPriorityChecked(priority) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {isPriorityChecked(priority) && (
                        <Image 
                          src="/check-icon.svg" 
                          alt="Checked" 
                          width={12} 
                          height={12} 
                          className="text-white"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                    </svg>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {priority === Priority.LOW
                        ? "Low"
                        : priority === Priority.MEDIUM
                        ? "Medium"
                        : priority === Priority.HIGH
                        ? "High"
                        : "Urgent"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
