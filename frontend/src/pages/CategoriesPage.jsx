import ResourcePage from "./ResourcePage";

export default function CategoriesPage() {
  return (
    <ResourcePage
      title="Categories"
      subtitle="Maintain normalized item categories for cleaner reporting."
      endpoint="/master-data/categories"
      searchPlaceholder="Search categories..."
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Category" }
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Category Name", required: true }
      ]}
    />
  );
}
