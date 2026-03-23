import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { navigationItems } from "../config/navigation";

export default function Topbar({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const title = navigationItems.find((item) => item.path === pathname)?.label || "Dashboard";
  const today = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 md:px-6 lg:px-8 lg:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="btn-secondary px-3 lg:hidden"
              onClick={onOpenSidebar}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {today}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Clean inventory operations with focused, role-based workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm shadow-sm sm:block">
              <p className="font-semibold text-slate-900">{user?.fullName}</p>
              <p className="capitalize text-slate-500">{user?.role}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
