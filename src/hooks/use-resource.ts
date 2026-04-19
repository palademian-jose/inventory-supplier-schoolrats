"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

interface UseResourceOptions {
  endpoint: string;
  limit?: number;
  autoLoad?: boolean;
  /** Transform response data */
  afterLoad?: (data: Record<string, unknown>) => Record<string, unknown>[];
}

interface UseResourceReturn {
  rows: Record<string, unknown>[];
  pagination: Pagination;
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  loadRows: (page?: number, searchOverride?: string) => Promise<void>;
  createRow: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  updateRow: (id: string | number, data: Record<string, unknown>) => Promise<Record<string, unknown>>;
  deleteRow: (id: string | number) => Promise<void>;
}

export function useResource({
  endpoint,
  limit = 10,
  autoLoad = true,
  afterLoad,
}: UseResourceOptions): UseResourceReturn {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRows = useCallback(
    async (page = 1, searchOverride?: string) => {
      setLoading(true);
      try {
        const currentSearch = searchOverride ?? search;
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (currentSearch) params.set("search", currentSearch);

        const res = await fetch(`${endpoint}?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to load data");
        }

        const data = await res.json();
        const nextRows = afterLoad ? afterLoad(data) : data.data || data;
        setRows(Array.isArray(nextRows) ? nextRows : []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, limit, search, afterLoad]
  );

  useEffect(() => {
    if (autoLoad) {
      loadRows(1, "");
    }
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const createRow = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create record");
      }
      return res.json();
    },
    [endpoint]
  );

  const updateRow = useCallback(
    async (id: string | number, data: Record<string, unknown>) => {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update record");
      }
      return res.json();
    },
    [endpoint]
  );

  const deleteRow = useCallback(
    async (id: string | number) => {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete record");
      }
    },
    [endpoint]
  );

  return {
    rows,
    pagination,
    search,
    setSearch,
    loading,
    loadRows,
    createRow,
    updateRow,
    deleteRow,
  };
}
