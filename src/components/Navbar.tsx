"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomTaskForm from "./CustomTaskForm";
import AuthModal from "./AuthModal";
import { Task } from '@/app/shared/types/tasks';

// Dummy user for testing authentication
const DUMMY_USER = {
  username: "testuser",
  password: "password123"
};

interface NavbarProps {
  onCreateTask?: (task: any) => void;
}

const Navbar = ({ onCreateTask }: NavbarProps) => {
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  // Check authentication state from cookies on component mount
  useEffect(() => {
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='));
    
    const storedUsername = document.cookie
      .split('; ')
      .find(row => row.startsWith('username='))
      ?.split('=')[1];
    
    setIsAuthenticated(!!authToken);
    if (storedUsername) {
      setUsername(decodeURIComponent(storedUsername));
    }
    
    // Check for showAuth parameter in URL (for redirects from middleware)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAuth') === 'true') {
      setShowAuthModal(true);
      // Clean up the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

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
  
  const handleTaskButtonClick = () => {
    if (isAuthenticated) {
      setShowTaskForm(true);
    } else {
      setShowAuthModal(true);
    }
  };
  
  const handleLogin = async (username: string, password: string) => {
    // Check against dummy user
    if (username === DUMMY_USER.username && password === DUMMY_USER.password) {
      // Set cookies for authentication
      document.cookie = `authToken=dummy-token-${Date.now()}; path=/; max-age=${60*60*24*7}`;
      document.cookie = `username=${encodeURIComponent(username)}; path=/; max-age=${60*60*24*7}`;
      
      setIsAuthenticated(true);
      setUsername(username);
      setShowAuthModal(false);
    } else {
      alert("Invalid credentials. Try username: testuser, password: password123");
    }
  };
  
  const handleLogout = () => {
    // Clear auth cookies
    document.cookie = "authToken=; path=/; max-age=0";
    document.cookie = "username=; path=/; max-age=0";
    setIsAuthenticated(false);
    setUsername("");
  };
  
  const handleRegister = (username: string, password: string) => {
    // In a real app, you'd send this to your API
    // For demo, we'll just authenticate the user right away
    document.cookie = `authToken=dummy-token-${Date.now()}; path=/; max-age=${60*60*24*7}`;
    document.cookie = `username=${encodeURIComponent(username)}; path=/; max-age=${60*60*24*7}`;
    
    setIsAuthenticated(true);
    setUsername(username);
    setShowAuthModal(false);
  };

  // First initial for avatar
  const userInitial = username ? username.charAt(0).toUpperCase() : "";

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

          {/* Search Bar */}
          <div
            className={`flex items-center bg-gray-800 rounded-md px-3 py-2 flex-1 mx-2 sm:mx-4 max-w-xl border ${
              isSearchFocused ? "border-blue-400" : "border-transparent"
            }`}
          >
            <input
              type="text"
              placeholder="Buscar tareas..."
              className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full text-sm sm:text-base"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center ml-2 sm:ml-4">
            {/* Add Task Button */}
            <button
              onClick={handleTaskButtonClick}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md transition-colors"
              aria-label="Add new task"
            >
              <span className="text-lg sm:mr-1">+</span>
              <span className="hidden sm:inline">Agregar Tarea</span>
            </button>

            {/* Authentication */}
            {isAuthenticated ? (
              <div className="flex items-center ml-3">
                <div className="flex items-center">
                  <span className="text-sm mr-2 hidden sm:block">
                    Hi, {username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
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
                className="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="Sign In"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
            )}
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