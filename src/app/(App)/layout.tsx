import Navbar from "../../components/Navbar";
import { TaskProvider } from "@/app/context/TaskContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaskProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </TaskProvider>
  );
}
