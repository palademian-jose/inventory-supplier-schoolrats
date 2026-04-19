"use client";

import { ResourcePage } from "@/components/resource-page";

export default function UnitsPage() {
  return (
    <ResourcePage
      title="Units"
      subtitle="Define units of measure for inventory items."
      endpoint="/api/master-data/units"
      searchPlaceholder="Search units..."
      columns={[
        { key: "name", label: "Unit Name" },
        { key: "symbol", label: "Symbol" },
      ]}
      fields={[
        { name: "name", label: "Unit Name", required: true },
        { name: "symbol", label: "Symbol", required: true },
      ]}
    />
  );
}
