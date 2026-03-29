import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ResourcePage from "./ResourcePage";
import { fetchResource } from "../api/resources";

export default function UsersPage() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const rows = await fetchResource("/master-data/departments");
        setDepartments(rows);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load departments");
      }
    };

    loadMasterData();
  }, []);

  return (
    <ResourcePage
      title="Users"
      subtitle="Manage system users, departments, roles, and issue recipients."
      endpoint="/users"
      searchPlaceholder="Search users..."
      columns={[
        { key: "full_name", label: "Name" },
        { key: "username", label: "Username" },
        { key: "department_name", label: "Department", render: (row) => row.department_name || "-" },
        { key: "role", label: "Role", render: (row) => row.role || "-" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status", type: "status" }
      ]}
      fields={[
        { name: "full_name", label: "Name", required: true },
        { name: "username", label: "Username", required: true },
        { name: "password", label: "Password", requiredOnCreate: true },
        {
          name: "department_id",
          label: "Department",
          type: "select",
          options: departments.map((department) => ({
            value: String(department.id),
            label: department.name
          }))
        },
        {
          name: "role",
          label: "Role",
          type: "select",
          required: true,
          defaultValue: "staff",
          options: [
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admin" }
          ]
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
            { value: "Inactive", label: "Inactive" }
          ]
        }
      ]}
      transformForm={(form) => ({
        ...form,
        password: form.password || undefined,
        department_id: form.department_id ? Number(form.department_id) : null
      })}
    />
  );
}
