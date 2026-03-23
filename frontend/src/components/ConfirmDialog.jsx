import Modal from "./Modal";

export default function ConfirmDialog({ isOpen, title, message, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose} eyebrow="Confirmation" maxWidth="max-w-lg">
      <div className="card-muted mb-6 p-4">
        <p className="text-sm leading-6 text-slate-600">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </Modal>
  );
}
