export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="card min-h-40 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded-full bg-slate-200" />
        <div className="h-14 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-2xl bg-slate-100" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
