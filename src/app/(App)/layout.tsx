import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import "../global.css";
import { TaskProvider } from "@/app/context/TaskContext";
import { AuthProvider } from "@/app/context/AuthContext";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Manage your tasks efficiently",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
  openGraph: {
    title: "Task Manager",
    description: "Manage your tasks efficiently",
    images: [
      {
        url: "/logo.webp",
        width: 800,
        height: 600,
        alt: "Task Manager Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Task Manager",
    description: "Manage your tasks efficiently",
    images: ["/logo.webp"],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <AuthProvider>
          <TaskProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </TaskProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
