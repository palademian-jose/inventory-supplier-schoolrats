import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createResource,
  deleteResource,
  fetchResource,
  updateResource
} from "../api/resources";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import Modal from "../components/Modal";

const buildInitialForm = (fields, initialValues = {}) =>
  fields.reduce(
    (accumulator, field) => ({
      ...accumulator,
      [field.name]: initialValues[field.name] ?? field.defaultValue ?? ""
    }),
    {}
  );

export default function ResourcePage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder,
  extraActions,
  rowActions,
  transformForm,
  afterLoad,
  readOnly = false
}) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(buildInitialForm(fields));
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};

    fields.forEach((field) => {
      const value = form[field.name];

      if (field.required && String(value ?? "").trim() === "") {
        nextErrors[field.name] = `${field.label} is required`;
        return;
      }

      if (field.type === "email" && value && !/^\S+@\S+\.\S+$/.test(String(value))) {
        nextErrors[field.name] = `Enter a valid ${field.label.toLowerCase()}`;
      }

      if (field.type === "number" && value !== "" && field.min !== undefined && Number(value) < field.min) {
        nextErrors[field.name] = `${field.label} must be at least ${field.min}`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const loadRows = async (page = pagination.page, currentSearch = search) => {
    setLoading(true);
    try {
      const data = await fetchResource(endpoint, { page, limit: 10, search: currentSearch });
      const nextRows = afterLoad ? afterLoad(data) : data.data || data;
      setRows(nextRows);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows(1, "");
  }, [endpoint]);

  const openCreate = () => {
    setSelectedRow(null);
    setForm(buildInitialForm(fields));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelectedRow(row);
    setForm(buildInitialForm(fields, row));
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    try {
      const payload = transformForm ? transformForm(form) : form;

      if (selectedRow) {
        await updateResource(endpoint, selectedRow.id, payload);
        toast.success(`${title.slice(0, -1)} updated`);
      } else {
        await createResource(endpoint, payload);
        toast.success(`${title.slice(0, -1)} created`);
      }

      setModalOpen(false);
      setForm(buildInitialForm(fields));
      setErrors({});
      loadRows();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save record");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteResource(endpoint, deleteTarget.id);
      toast.success("Record deleted");
      setDeleteTarget(null);
      loadRows();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  if (loading && !rows.length) {
    return <LoadingState label={`Loading ${title.toLowerCase()}...`} />;
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Management Module
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,18rem)_auto_auto]">
            <input
              className="input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={() => loadRows(1, search)}>
              Search
            </button>
            {!readOnly && (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Add New
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="card-muted px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Visible Records
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{rows.length}</p>
          </div>
          <div className="card-muted px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Current Page
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{pagination.page}</p>
          </div>
          <div className="card-muted px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Total Records
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {pagination.total || rows.length}
            </p>
          </div>
        </div>
      </div>

      {extraActions && extraActions({ refresh: loadRows, rows })}

      <DataTable
        columns={columns}
        rows={rows}
        pagination={pagination.total ? pagination : null}
        onPageChange={(page) => loadRows(page)}
        emptyState={{
          title: `No ${title.toLowerCase()} yet`,
          description: `Start by creating a new ${title.slice(0, -1).toLowerCase()} or adjust the search to broaden your results.`,
          action: !readOnly ? (
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add New
            </button>
          ) : null
        }}
        actions={
          readOnly
            ? null
            : (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  {rowActions ? rowActions(row) : null}
                  <button type="button" className="btn-secondary" onClick={() => openEdit(row)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger" onClick={() => setDeleteTarget(row)}>
                    Delete
                  </button>
                </div>
              )
        }
      />

      <Modal
        isOpen={modalOpen}
        title={selectedRow ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
        onClose={() => setModalOpen(false)}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} className={field.fullWidth ? "md:col-span-2" : ""}>
              <label className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
              {field.type === "select" ? (
                <select
                  className={`select ${errors[field.name] ? "input-error" : ""}`}
                  value={form[field.name]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  className={`input min-h-24 ${errors[field.name] ? "input-error" : ""}`}
                  value={form[field.name]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                />
              ) : (
                <input
                  className={`input ${errors[field.name] ? "input-error" : ""}`}
                  type={field.type || "text"}
                  min={field.min}
                  value={form[field.name]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                />
              )}
              {errors[field.name] ? <p className="field-error">{errors[field.name]}</p> : null}
            </div>
          ))}
          <div className="flex justify-end gap-3 md:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Record"
        message={`Delete ${deleteTarget?.name || deleteTarget?.order_number || "this record"}?`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
