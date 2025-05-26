"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomTaskForm from "./CustomTaskForm";
import { Task } from '@/app/shared/types/tasks';

interface NavbarProps {
  onCreateTask?: (task: any) => void;
}

const Navbar = ({ onCreateTask }: NavbarProps) => {
  const [showForm, setShowForm] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleSearchFocus = () => setIsSearchFocused(true);
  const handleSearchBlur = () => setIsSearchFocused(false);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);

  const handleTaskCreated = (task: any) => {
    if (onCreateTask) {
      onCreateTask(task);
    }
    setShowTaskForm(false);
  };

  return (
    <>
      <nav className="bg-gray-900 text-white py-3 px-4 md:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.webp"
                alt="Task Manager Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <span className="hidden sm:block text-lg font-semibold">
                Task Manager
              </span>
            </Link>
          </div>

          {/* Search Bar - Now visible on all devices, but smaller on mobile */}
          <div
            className={`flex items-center bg-gray-800 rounded-md px-3 py-2 flex-1 mx-2 sm:mx-4 max-w-xl border ${
              isSearchFocused ? "border-blue-400" : "border-transparent"
            }`}
          >
            <input
              type="text"
              placeholder="Buscar Tareas..."
              className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full text-sm sm:text-base"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center ml-2 sm:ml-4">
            {/* Improved Add Task Button with better responsiveness */}
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md transition-colors"
              aria-label="Add new task"
            >
              <span className="text-lg sm:mr-1">+</span>
              <span className="hidden sm:inline">Task</span>
            </button>

            {/* Profile Icon */}
            <button
              className="p-1.5 rounded-full hover:bg-gray-700 transition-colors ml-3"
              aria-label="User profile"
            >
              <span className="text-lg">&#128100;</span> {/* User icon */}
            </button>
          </div>
        </div>
      </nav>

      {/* Task Creation Form */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowTaskForm(false)}
                aria-label="Close form"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <CustomTaskForm
              task={currentTask}
              onComplete={handleTaskCreated}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;
