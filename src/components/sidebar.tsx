"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getNavigationItemsForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navigationItems = getNavigationItemsForRole(user?.role);

  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-5">
      <div className="mb-4 px-2 lg:mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          SchoolRats
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Operations Hub
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          Inventory, supplier &amp; purchase workflows.
        </p>
      </div>

      <Separator className="mb-4" />

      <nav className="flex-1 space-y-1">
        {navigationItems.map(({ label, path, icon: Icon }) => {
          const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-background"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-80 p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-end px-4 pt-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent onClose={onClose} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
