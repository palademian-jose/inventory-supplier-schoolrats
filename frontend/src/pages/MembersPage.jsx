import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ResourcePage from "./ResourcePage";
import { fetchResource } from "../api/resources";

export default function RecipientsPage() {
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
      title="Recipients"
      subtitle="Manage the people or departments that receive issued stock."
      endpoint="/recipients"
      searchPlaceholder="Search recipients..."
      columns={[
        { key: "name", label: "Name" },
        { key: "department_name", label: "Department", render: (row) => row.department_name || "-" },
        { key: "recipient_type", label: "Type", render: (row) => row.recipient_type || "-" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status", type: "status" }
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
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
          name: "recipient_type",
          label: "Recipient Type",
          type: "select",
          required: true,
          defaultValue: "person",
          options: [
            { value: "person", label: "Person" },
            { value: "department", label: "Department" },
            { value: "organization", label: "Organization" }
          ]
        },
        { name: "phone", label: "Phone", required: true },
        { name: "email", label: "Email", type: "email", required: true },
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
        department_id: form.department_id ? Number(form.department_id) : null
      })}
    />
  );
}
