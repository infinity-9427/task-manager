import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import QueryProvider from "@/components/query-provider"
import { TaskProvider } from "@/contexts/task-context"
import { SearchProvider } from "@/contexts/search-context"
import { ErrorBoundary } from "@/components/error-boundary"
import Header from "@/components/header"
import TaskModal from "@/components/task-modal"
import { Toaster } from "sonner"
import "../globals.css"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Professional Task Management Platform",
  description: "Enterprise-grade task management solution with advanced data tables, nested task hierarchy, smart filtering, and team collaboration features.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased bg-gray-50`}>
        <ErrorBoundary>
          <QueryProvider>
            <SearchProvider>
              <TaskProvider>
                <div className="min-h-screen">
                  <Header />
                  <main className="relative">
                    {children}
                  </main>
                  <TaskModal />
                  <Toaster 
                    position="top-right"
                    expand={false}
                    richColors
                    closeButton
                  />
                </div>
              </TaskProvider>
            </SearchProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
