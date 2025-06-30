"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomTaskForm from "./CustomTaskForm";
import AuthModal from "./AuthModal";
import TaskModal from "./TaskModal";
import SearchBar from "./SearchBar";
import { Task } from '@/app/shared/types/tasks';
import { useTaskContext } from "@/app/context/TaskContext";
import { useAuth } from "@/app/context/AuthContext";

interface NavbarProps {
  onCreateTask?: (task: any) => void;
}

const Navbar = ({ onCreateTask }: NavbarProps) => {
  const { tasks } = useTaskContext();
  const { isAuthenticated, username, login, logout } = useAuth();
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Check for showAuth parameter in URL (for redirects from middleware)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAuth') === 'true') {
      setShowAuthModal(true);
      // Clean up the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleTaskCreated = (task: any) => {
    if (onCreateTask) {
      onCreateTask(task);
    }
    // Only close the form if it's an edit operation or explicitly requested
    if (task && task.id && !task.id.toString().startsWith('temp-')) {
      setShowTaskForm(false);
    }
  };
  
  const handleTaskButtonClick = () => {
    // if (isAuthenticated) {
    //   setShowTaskForm(true);
    // } else {
    //   setShowAuthModal(true);
    // }

      setShowTaskForm(true);
  };
  
  const handleLogin = async (username: string, password: string) => {
    // The actual token storage happens in AuthModal
    // We just need to update our local state
    login(username);
    setShowAuthModal(false);
  };
  
  const handleRegister = (username: string, password: string) => {
    // The actual token storage happens in AuthModal
    login(username);
    setShowAuthModal(false);
  };

  // First initial for avatar
  const userInitial = username ? username.charAt(0).toUpperCase() : "";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo.webp"
                alt="Task Manager Logo"
                width={32}
                height={32}
                className="mr-2"
              />
    
            </Link>
            </div>

            {/* Search Bar Component */}
            <div className="flex-1 mx-4 sm:mx-8 max-w-2xl">
              <SearchBar 
                onTaskSelect={setSelectedTaskId}
                className="w-full"
              />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                aria-label="Notifications"
                title="Notifications"
              >
                <Image 
                  src="/bell.svg" 
                  alt="Notifications" 
                  width={20} 
                  height={20} 
                  className="text-gray-600 group-hover:text-gray-800 transition-colors"
                />
                {/* Notification badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white  ">13</span>
                </div>
              </button>

              {/* Add Task Button */}
              <button
                onClick={handleTaskButtonClick}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] shadow-sm text-sm"
                aria-label="Add new task"
              >
                <Image 
                  src="/plus.svg" 
                  alt="Add task" 
                  width={16} 
                  height={16} 
                  className="mr-1.5 brightness-0 invert"
                />
                <span className="hidden sm:inline">Create</span>
                <span className="sm:hidden">+</span>
              </button>

              {/* Authentication */}
              {isAuthenticated ? (
                <div className="flex items-center">
                  <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-600 mr-3 hidden sm:block">
                      {username}
                    </span>
                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium hover:scale-105 transition-transform shadow-sm"
                      aria-label="User Profile"
                      title="Click to logout"
                    >
                      {userInitial}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Sign In"
                >
                  <Image 
                    src="/user.svg" 
                    alt="Sign In" 
                    width={20} 
                    height={20} 
                    className="text-gray-600"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to account for fixed navbar */}
      <div className="h-16"></div>

      {/* Task Creation Form - Only show if authenticated */}
      {showTaskForm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTaskForm(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Create task</h2>
              <button
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowTaskForm(false)}
                aria-label="Close form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CustomTaskForm
              task={currentTask}
              onComplete={handleTaskCreated}
              onClose={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}
      
      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
};

export default Navbar;