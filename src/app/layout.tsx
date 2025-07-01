import { Metadata } from "next";
import "./global.css";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
