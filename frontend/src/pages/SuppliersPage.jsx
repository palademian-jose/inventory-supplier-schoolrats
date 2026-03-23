import { useState } from "react";
import toast from "react-hot-toast";
import { fetchResource } from "../api/resources";
import Modal from "../components/Modal";
import DataTable from "../components/DataTable";
import ResourcePage from "./ResourcePage";

export default function SuppliersPage() {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [suppliedItems, setSuppliedItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const viewItems = async (supplier) => {
    try {
      const rows = await fetchResource(`/suppliers/${supplier.id}/items`);
      setSelectedSupplier(supplier);
      setSuppliedItems(rows);
      setIsOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load supplied items");
    }
  };

  return (
    <>
      <ResourcePage
        title="Suppliers"
        subtitle="Track supplier contacts and procurement partners."
        endpoint="/suppliers"
        searchPlaceholder="Search suppliers..."
        columns={[
          { key: "name", label: "Supplier" },
          { key: "contact_person", label: "Contact Person" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "address", label: "Address" }
        ]}
        rowActions={(row) => (
          <button type="button" className="btn-secondary" onClick={() => viewItems(row)}>
            Supplied Items
          </button>
        )}
        fields={[
          { name: "name", label: "Supplier Name", required: true },
          { name: "contact_person", label: "Contact Person" },
          { name: "phone", label: "Phone", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "address", label: "Address", fullWidth: true, type: "textarea" }
        ]}
      />

      <Modal
        isOpen={isOpen}
        title={`Supplied Items${selectedSupplier ? ` - ${selectedSupplier.name}` : ""}`}
        onClose={() => setIsOpen(false)}
      >
        <DataTable
          columns={[
            { key: "item_name", label: "Item" },
            { key: "supplier_price", label: "Supplier Price", render: (row) => `$${Number(row.supplier_price).toFixed(2)}` },
            { key: "lead_time_days", label: "Lead Time (days)" }
          ]}
          rows={suppliedItems}
        />
      </Modal>
    </>
  );
}
