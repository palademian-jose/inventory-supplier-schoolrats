const colorMap = {
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-sky-50 text-sky-700",
  Received: "bg-emerald-50 text-emerald-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Partial: "bg-amber-50 text-amber-700",
  PURCHASE_IN: "bg-sky-50 text-sky-700",
  ISSUE_TO_MEMBER: "bg-rose-50 text-rose-700",
  ADJUSTMENT: "bg-violet-50 text-violet-700"
};

export default function StatusBadge({ value }) {
  const label = typeof value === "string" ? value.replaceAll("_", " ") : value;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
        colorMap[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}
