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
  Building2
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Users", path: "/users", icon: Users },
  { label: "Departments", path: "/departments", icon: Building2 },
  { label: "Categories", path: "/categories", icon: FolderTree },
  { label: "Units", path: "/units", icon: Ruler },
  { label: "Suppliers", path: "/suppliers", icon: Truck },
  { label: "Items", path: "/items", icon: Boxes },
  { label: "Supplier Catalog", path: "/supplier-catalog", icon: PackagePlus },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart },
  { label: "Transactions", path: "/transactions", icon: ReceiptText },
  { label: "Stock Issues", path: "/stock-issues", icon: UserRound }
];
