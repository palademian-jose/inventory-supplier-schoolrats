"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useAuth } from "@/context/auth-context";
import { canAccessPath } from "@/lib/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    if (!canAccessPath(pathname, user.role)) {
      router.replace("/");
    }
  }, [isLoading, pathname, router, user]);

  if (!isLoading && user && !canAccessPath(pathname, user.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 pb-6 pt-4 md:px-6 lg:px-8 lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
