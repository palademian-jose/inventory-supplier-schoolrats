"use client";

import { ResourcePage } from "@/components/resource-page";

export default function CategoriesPage() {
  return (
    <ResourcePage
      title="Categories"
      subtitle="Maintain item categories for classification and reporting."
      endpoint="/api/master-data/categories"
      searchPlaceholder="Search categories..."
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Category" },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Category Name", required: true },
      ]}
    />
  );
}
