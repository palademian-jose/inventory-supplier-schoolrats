import {
  Boxes,
  CreditCard,
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  ReceiptText,
  Truck,
  UserRound,
  Users
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Members", path: "/members", icon: Users },
  { label: "Suppliers", path: "/suppliers", icon: Truck },
  { label: "Items", path: "/items", icon: Boxes },
  { label: "Supplier Items", path: "/supplier-items", icon: PackagePlus },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Transactions", path: "/transactions", icon: ReceiptText },
  { label: "Issue Items", path: "/issue-items", icon: UserRound }
];
