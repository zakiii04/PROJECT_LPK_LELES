'use client';

interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  itemName?: string | null;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  open,
  title = 'Hapus Data?',
  message = 'Anda yakin ingin menghapus data ini?',
  itemName,
  confirmLabel = 'Ya, Hapus',
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl shrink-0">
            ⚠
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {message}
              {itemName && (
                <>
                  {' '}
                  <span className="font-semibold text-slate-800">{itemName}</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tindakan ini tidak dapat dibatalkan dan data yang terkait akan dihapus dari sistem.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="btn btn-outline btn-sm">
            Batal
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-danger btn-sm">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
