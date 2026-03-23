import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems } from "../config/navigation";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col border-r border-white/70 bg-white/95 px-4 pb-4 pt-5 shadow-2xl backdrop-blur-xl transition-transform duration-200 lg:static lg:z-auto lg:w-80 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-slate-200/80 lg:bg-white/70 lg:px-5 lg:py-5 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-start justify-between px-2 lg:mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-600">
              SchoolRats
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Operations Hub
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Inventory, supplier, and purchase workflows in one focused workspace.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary px-3 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="card-muted mb-4 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">
            Academic inventory and supplier prototype
          </p>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navigationItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-white">
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
