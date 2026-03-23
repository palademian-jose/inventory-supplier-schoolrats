import ResourcePage from "./ResourcePage";

export default function MembersPage() {
  return (
    <ResourcePage
      title="Members"
      subtitle="Manage member records and contact details."
      endpoint="/members"
      searchPlaceholder="Search members..."
      columns={[
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
        { key: "status", label: "Status", type: "status" }
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
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
    />
  );
}
