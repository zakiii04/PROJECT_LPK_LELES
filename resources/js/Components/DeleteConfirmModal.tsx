'use client';

import { useState } from 'react';

interface DeleteConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  itemName?: string | null;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  open,
  title = 'Hapus Data?',
  message = 'Anda yakin ingin menghapus data ini?',
  itemName,
  confirmLabel = 'Ya, Hapus',
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  if (!open) return null;

  const isLoading = loading !== undefined ? loading : internalLoading;

  const handleConfirm = async () => {
    if (isLoading) return;
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        className="modal-content relative max-w-md p-6 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Loading Progress Line */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 to-red-600 animate-progress-infinite" />
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl shrink-0 transition-transform">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              '⚠'
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {message}
              {itemName && (
                <>
                  {' '}
                  <span className="font-semibold text-slate-800">“{itemName}”</span>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tindakan ini tidak dapat dibatalkan dan data yang terkait akan dihapus dari sistem.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="btn btn-danger btn-sm flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
