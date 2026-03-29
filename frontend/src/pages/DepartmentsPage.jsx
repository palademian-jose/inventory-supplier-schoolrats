import ResourcePage from "./ResourcePage";

export default function DepartmentsPage() {
  return (
    <ResourcePage
      title="Departments"
      subtitle="Maintain departments for user grouping and reporting."
      endpoint="/master-data/departments"
      searchPlaceholder="Search departments..."
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Department" }
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Department Name", required: true }
      ]}
    />
  );
}
