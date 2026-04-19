"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ResourcePage } from "@/components/resource-page";

export default function UsersPage() {
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/master-data/departments");
        if (res.ok) setDepartments(await res.json());
      } catch {
        toast.error("Failed to load departments");
      }
    };
    load();
  }, []);

  return (
    <ResourcePage
      title="Users"
      subtitle="Manage system users, departments, roles, and issue recipients."
      endpoint="/api/users"
      searchPlaceholder="Search users..."
      columns={[
        { key: "full_name", label: "Name" },
        { key: "username", label: "Username" },
        { key: "department_name", label: "Department", render: (row) => (row.department_name as string) || "-" },
        { key: "role", label: "Role", render: (row) => (row.role as string) || "-" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status", type: "status" },
      ]}
      fields={[
        { name: "full_name", label: "Name", required: true },
        { name: "username", label: "Username", required: true },
        { name: "password", label: "Password", type: "password", requiredOnCreate: true },
        {
          name: "department_id",
          label: "Department",
          type: "select",
          options: departments.map((d) => ({ value: String(d.id), label: d.name })),
        },
        {
          name: "role",
          label: "Role",
          type: "select",
          required: true,
          defaultValue: "staff",
          options: [
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admin" },
          ],
        },
        { name: "phone", label: "Phone", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "address", label: "Address", fullWidth: true, type: "textarea" },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ],
        },
      ]}
      transformForm={(form) => ({
        ...form,
        password: form.password || undefined,
        department_id: form.department_id ? Number(form.department_id) : null,
      })}
    />
  );
}
