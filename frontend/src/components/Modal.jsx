export default function Modal({ isOpen, title, onClose, children, eyebrow = "Form", maxWidth = "max-w-2xl" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className={`card w-full ${maxWidth} p-6 md:p-7`}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {eyebrow}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
          </div>
          <button className="btn-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
