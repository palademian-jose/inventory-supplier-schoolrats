import ResourcePage from "./ResourcePage";

export default function UnitsPage() {
  return (
    <ResourcePage
      title="Units"
      subtitle="Maintain units of measure used by inventory items."
      endpoint="/master-data/units"
      searchPlaceholder="Search units..."
      columns={[
        { key: "name", label: "Unit" },
        { key: "symbol", label: "Symbol" }
      ]}
      fields={[
        { name: "name", label: "Unit Name", required: true },
        { name: "symbol", label: "Symbol", required: true }
      ]}
    />
  );
}
