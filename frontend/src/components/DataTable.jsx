import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  rows,
  actions,
  pagination,
  onPageChange,
  emptyState
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="table-head border-b border-slate-200">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4 text-left">
                  {column.label}
                </th>
              ))}
              {actions && <th className="px-4 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90 bg-white/80">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column.key} className="table-cell">
                      {column.type === "status" ? (
                        <StatusBadge value={row[column.key]} />
                      ) : column.render ? (
                        column.render(row)
                      ) : (
                        row[column.key]
                      )}
                    </td>
                  ))}
                  {actions && (
                    <td className="table-cell">
                      <div className="flex justify-end gap-2">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-0 py-0">
                  <EmptyState
                    title={emptyState?.title || "No records found"}
                    description={
                      emptyState?.description ||
                      "There is nothing to show here yet. Add a record or adjust your filters."
                    }
                    action={emptyState?.action}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            Page {pagination.page} of {Math.max(Math.ceil(pagination.total / pagination.limit), 1)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
