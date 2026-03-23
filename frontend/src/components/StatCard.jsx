const accents = {
  brand: "bg-sky-50 text-sky-700",
  alert: "bg-amber-50 text-amber-700",
  neutral: "bg-slate-100 text-slate-700"
};

export default function StatCard({ title, value, accent = "brand" }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-200 via-slate-200 to-transparent" />
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accents[accent] || accents.brand}`}>
        {title}
      </span>
      <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">Current snapshot from the inventory database.</p>
    </div>
  );
}
