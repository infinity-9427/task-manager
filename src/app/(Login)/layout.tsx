"use client";
import Image from "next/image";
import Link from "next/link";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center group">
            <div className="relative">
              <Image
                src="/logo.webp"
                alt="Task Manager Logo"
                width={64}
                height={64}
                className="group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-200"></div>
            </div>
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 select-none">
            Task Manager
          </h1>
          <p className="mt-2 text-gray-600 select-none">
            Streamline your workflow and boost productivity
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 select-none">
          © 2025 Task Manager. All rights reserved.
        </div>
      </div>
    </div>
  );
}
