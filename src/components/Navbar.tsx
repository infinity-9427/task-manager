"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomTaskForm from "./CustomTaskForm";
import TaskModal from "./TaskModal";
import SearchBar from "./SearchBar";
import { Task } from '@/app/shared/types/tasks';
import { useTaskContext } from "@/app/context/TaskContext";
import { useAuth } from "@/app/context/AuthContext";
import { notificationService, socketService } from "@/services";
import type { Notification } from "@/types/api";

interface NavbarProps {
  onCreateTask?: (task: any) => void;
}

const Navbar = ({ onCreateTask }: NavbarProps) => {
  const { tasks } = useTaskContext();
  const { isAuthenticated, username, user, logout } = useAuth();
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load notifications when authenticated
    if (isAuthenticated) {
      const loadNotifications = async () => {
        try {
          const notificationsData = await notificationService.getUserNotifications();
          setNotifications(notificationsData.notifications);
          setUnreadCount(notificationsData.notifications.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
          console.error('Failed to load notifications:', error);
          // Don't set notifications to prevent UI issues, just log the error
          // The auth context will handle logout if needed
        }
      };

      loadNotifications();

      // Setup real-time notification listener
      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      };

      socketService.on('notificationReceived', handleNewNotification);

      return () => {
        socketService.off('notificationReceived', handleNewNotification);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

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
  
  const handleLogout = async () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      return;
    }
    
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setShowUserMenu(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowLogoutConfirm(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
                width={40}
                height={40}
                className="mr-3 group-hover:scale-105 transition-transform"
              />
              <span className="hidden sm:block text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                Task Manager
              </span>
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
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-[10px] text-white font-bold leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                )}
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
                  className="mr-1.5 brightness-0 invert sm:inline hidden"
                />
                <span className="hidden sm:inline">Create</span>
                <span className="sm:hidden text-lg font-bold">+</span>
              </button>

              {/* Authentication */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-gray-600 mr-3 hidden sm:block">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : username
                      }
                    </span>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium shadow-sm">
                      {userInitial}
                    </div>
                    <svg 
                      className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium shadow-sm">
                            {userInitial}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.firstName && user?.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : username
                              }
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </button>
                        
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Preferences
                        </button>

                        <hr className="my-1 border-gray-100" />
                        
                        {!showLogoutConfirm ? (
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2"
                          >
                            <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        ) : (
                          <div className="px-4 py-3 bg-gray-50 rounded-lg mx-2">
                            <p className="text-xs text-gray-600 mb-3 font-medium">Are you sure you want to sign out?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isLoggingOut ? (
                                  <>
                                    <svg className="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing out...
                                  </>
                                ) : (
                                  'Yes, sign out'
                                )}
                              </button>
                              <button
                                onClick={handleLogoutCancel}
                                disabled={isLoggingOut}
                                className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 border border-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
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
                </Link>
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