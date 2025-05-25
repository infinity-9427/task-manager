"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RiSearchLine,
  RiAddLine,
  RiUser3Line,
  RiMenuLine,
  RiCloseLine,
} from "@remixicon/react";
import CreateTaskForm from "./CreateTaskForm";

interface NavbarProps {
  onCreateTask?: (task: any) => void;
}

const Navbar = ({ onCreateTask }: NavbarProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);

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
              <span className="hidden md:block text-lg font-semibold">
                Task Manager
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div
            className={`hidden md:flex items-center bg-gray-800 rounded-md px-3 py-2 flex-1 mx-4 max-w-xl border ${
              isSearchFocused ? "border-blue-400" : "border-transparent"
            }`}
          >
            <RiSearchLine className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center">
            {/* Add Task Button */}
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 md:px-3 md:py-2 rounded-md transition-colors mr-2 md:mr-4"
            >
              <RiAddLine className="mr-0 md:mr-1" />
              <span className="hidden md:inline">Task</span>
            </button>

            {/* Profile Icon */}
            <button className="p-1.5 rounded-full hover:bg-gray-700 transition-colors">
              <RiUser3Line size={20} />
            </button>

            {/* Mobile Menu Button */}
            <button
              className="ml-3 md:hidden p-1.5 rounded hover:bg-gray-700"
              onClick={toggleMobileMenu}
            >
              <RiMenuLine size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Search - Shown below navbar on mobile */}
        <div className="md:hidden mt-3">
          <div
            className={`flex items-center bg-gray-800 rounded-md px-3 py-2 border ${
              isSearchFocused ? "border-blue-400" : "border-transparent"
            }`}
          >
            <RiSearchLine className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 bg-gray-800 rounded-md p-4 animate-fadeIn">
            <div className="space-y-3">
              <Link
                href="/"
                className="block px-2 py-1 hover:bg-gray-700 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/tasks"
                className="block px-2 py-1 hover:bg-gray-700 rounded-md"
              >
                All Tasks
              </Link>
              <Link
                href="/profile"
                className="block px-2 py-1 hover:bg-gray-700 rounded-md"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="block px-2 py-1 hover:bg-gray-700 rounded-md"
              >
                Settings
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Task Creation Form */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Crear Nueva Tarea</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowTaskForm(false)}
              >
                <RiCloseLine size={24} />
              </button>
            </div>
            <CreateTaskForm onCreate={handleTaskCreated} />
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
