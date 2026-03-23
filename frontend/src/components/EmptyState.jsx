export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="rounded-3xl bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        No Data
      </div>
      <h4 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{title}</h4>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
