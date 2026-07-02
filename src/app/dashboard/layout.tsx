"use client";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

 

  const marginLeft = collapsed ? "ml-20" : "ml-64";

  return (
    <div className="flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${marginLeft}`}
      >
        <Navbar sidebarCollapsed={collapsed} />
        <main className="px-10 py-20">{children}</main>
      </div>
    </div>
  );
}
