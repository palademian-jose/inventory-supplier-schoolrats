"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useResource } from "@/hooks/use-resource";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "select" | "textarea";
  required?: boolean;
  requiredOnCreate?: boolean;
  requiredOnEdit?: boolean;
  fullWidth?: boolean;
  defaultValue?: string | number;
  options?: { value: string; label: string }[];
  min?: number;
  step?: string;
  placeholder?: string;
}

interface ResourcePageProps {
  title: string;
  subtitle: string;
  endpoint: string;
  columns: Column[];
  fields: FieldConfig[];
  searchPlaceholder?: string;
  rowActions?: (row: Record<string, unknown>) => React.ReactNode;
  extraActions?: (context: {
    refresh: (page?: number) => Promise<void>;
    rows: Record<string, unknown>[];
  }) => React.ReactNode;
  transformForm?: (form: Record<string, unknown>) => Record<string, unknown>;
  afterLoad?: (data: Record<string, unknown>) => Record<string, unknown>[];
  readOnly?: boolean;
}

function buildInitialForm(
  fields: FieldConfig[],
  initialValues: Record<string, unknown> = {}
): Record<string, unknown> {
  return fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: initialValues[field.name] ?? field.defaultValue ?? "",
    }),
    {} as Record<string, unknown>
  );
}

export function ResourcePage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder = "Search...",
  rowActions,
  extraActions,
  transformForm,
  afterLoad,
  readOnly = false,
}: ResourcePageProps) {
  const { rows, pagination, search, setSearch, loading, loadRows, createRow, updateRow, deleteRow } =
    useResource({ endpoint, afterLoad });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(buildInitialForm(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = form[field.name];
      const isRequired =
        field.required ||
        (!selectedRow && field.requiredOnCreate) ||
        (selectedRow && field.requiredOnEdit);

      if (isRequired && String(value ?? "").trim() === "") {
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

  const openCreate = () => {
    setSelectedRow(null);
    setForm(buildInitialForm(fields));
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setForm(buildInitialForm(fields, row));
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const payload = transformForm ? transformForm(form) : form;
      if (selectedRow) {
        await updateRow(selectedRow.id as number, payload);
        toast.success(`${title.slice(0, -1)} updated`);
      } else {
        await createRow(payload);
        toast.success(`${title.slice(0, -1)} created`);
      }
      setModalOpen(false);
      setForm(buildInitialForm(fields));
      setErrors({});
      loadRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRow(deleteTarget.id as number);
      toast.success("Record deleted");
      setDeleteTarget(null);
      loadRows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRows(1, search);
  };

  if (loading && !rows.length) {
    return <LoadingState label={`Loading ${title.toLowerCase()}...`} />;
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <PageHeader
            eyebrow="Management Module"
            title={title}
            description={subtitle}
            actions={
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="secondary">Search</Button>
                {!readOnly && (
                  <Button onClick={openCreate}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add New
                  </Button>
                )}
              </form>
            }
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visible Records
              </p>
              <p className="mt-1.5 text-xl font-semibold">{rows.length}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Page
              </p>
              <p className="mt-1.5 text-xl font-semibold">{pagination.page}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Records
              </p>
              <p className="mt-1.5 text-xl font-semibold">{pagination.total || rows.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {extraActions && extraActions({ refresh: loadRows, rows })}

      {/* Data table */}
      <DataTable
        columns={columns}
        rows={rows}
        pagination={pagination.total ? pagination : null}
        onPageChange={(page) => loadRows(page)}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        emptyDescription={`Start by creating a new ${title.slice(0, -1).toLowerCase()} or adjust the search.`}
        emptyAction={
          !readOnly ? (
            <Button onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add New
            </Button>
          ) : undefined
        }
        actions={
          readOnly
            ? undefined
            : (row) => (
                <div className="flex flex-wrap justify-end gap-2">
                  {rowActions?.(row)}
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
                    Delete
                  </Button>
                </div>
              )
        }
      />

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRow ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.name} className={field.fullWidth ? "md:col-span-2" : ""}>
                <Label className="mb-1.5">{field.label}</Label>
                {field.type === "select" ? (
                  <Select
                    value={String(form[field.name] ?? "")}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, [field.name]: val }))}
                  >
                    <SelectTrigger className={errors[field.name] ? "border-destructive" : ""}>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    className={errors[field.name] ? "border-destructive" : ""}
                    value={String(form[field.name] ?? "")}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  />
                ) : (
                  <Input
                    className={errors[field.name] ? "border-destructive" : ""}
                    type={field.type || "text"}
                    min={field.min}
                    step={field.step}
                    placeholder={field.placeholder}
                    value={String(form[field.name] ?? "")}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  />
                )}
                {errors[field.name] && (
                  <p className="mt-1 text-xs text-destructive">{errors[field.name]}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-3 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {(deleteTarget?.name as string) || (deleteTarget?.order_number as string) || "this record"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
