import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  ReceiptText,
  Truck,
  Ruler,
  UserRound,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Array<"admin" | "staff">;
}

export const navigationItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { label: "Users", path: "/users", icon: Users, roles: ["admin"] },
  { label: "Departments", path: "/departments", icon: Building2, roles: ["admin"] },
  { label: "Categories", path: "/categories", icon: FolderTree, roles: ["admin"] },
  { label: "Units", path: "/units", icon: Ruler, roles: ["admin"] },
  { label: "Suppliers", path: "/suppliers", icon: Truck, roles: ["admin"] },
  { label: "Items", path: "/items", icon: Boxes, roles: ["admin"] },
  { label: "Supplier Catalog", path: "/supplier-catalog", icon: PackagePlus, roles: ["admin"] },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart, roles: ["admin", "staff"] },
  { label: "Transactions", path: "/transactions", icon: ReceiptText, roles: ["admin", "staff"] },
  { label: "Stock Issues", path: "/stock-issues", icon: UserRound, roles: ["admin", "staff"] },
];

export function getNavigationItemsForRole(role?: "admin" | "staff") {
  if (!role) return [];
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function canAccessPath(pathname: string, role?: "admin" | "staff") {
  if (!role) return false;

  const item = navigationItems.find((entry) =>
    entry.path === "/" ? pathname === "/" : pathname.startsWith(entry.path)
  );

  return item ? item.roles.includes(role) : true;
}
