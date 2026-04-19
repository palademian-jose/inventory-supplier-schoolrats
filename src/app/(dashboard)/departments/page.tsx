"use client";

import { ResourcePage } from "@/components/resource-page";

export default function DepartmentsPage() {
  return (
    <ResourcePage
      title="Departments"
      subtitle="Maintain departments for user grouping and reporting."
      endpoint="/api/master-data/departments"
      searchPlaceholder="Search departments..."
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Department" },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Department Name", required: true },
      ]}
    />
  );
}
