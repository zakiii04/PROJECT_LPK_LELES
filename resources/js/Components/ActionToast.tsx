'use client';

import { useState, useEffect, useRef } from 'react';

export type ActionToastType = 'add' | 'edit' | 'delete' | 'info';
export type ActionToastStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ActionToastState {
  show: boolean;
  status: ActionToastStatus;
  actionType: ActionToastType;
  title: string;
  message?: string;
}

interface ActionToastProps {
  toast: ActionToastState;
  onClose: () => void;
}

export function ActionToast({ toast, onClose }: ActionToastProps) {
  const [isPaused, setIsPaused] = useState(false);

  if (!toast.show) return null;

  const { status, actionType, title, message } = toast;

  // Determine styling based on actionType & status
  let iconBg = 'bg-indigo-50 border-indigo-200 text-indigo-600';
  let badgeColor = 'text-indigo-700 bg-indigo-50/80 border-indigo-200';
  let badgeLabel = 'SISTEM';
  let barGradient = 'from-indigo-500 via-blue-500 to-indigo-600';

  if (actionType === 'delete') {
    iconBg = status === 'error' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-rose-50 border-rose-200 text-rose-600';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    badgeLabel = 'HAPUS DATA';
    barGradient = 'from-rose-500 via-red-500 to-rose-600';
  } else if (actionType === 'add') {
    iconBg = 'bg-emerald-50 border-emerald-200 text-emerald-600';
    badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    badgeLabel = 'TAMBAH DATA';
    barGradient = 'from-emerald-500 via-teal-500 to-emerald-600';
  } else if (actionType === 'edit') {
    iconBg = 'bg-blue-50 border-blue-200 text-blue-600';
    badgeColor = 'text-blue-700 bg-blue-50 border-blue-200';
    badgeLabel = 'PERBARUI DATA';
    barGradient = 'from-blue-500 via-indigo-500 to-blue-600';
  }

  if (status === 'error') {
    iconBg = 'bg-red-50 border-red-200 text-red-600';
    badgeColor = 'text-red-700 bg-red-50 border-red-200';
    badgeLabel = 'GAGAL';
    barGradient = 'from-red-500 to-red-600';
  }

  return (
    <div
      className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-toast-in pointer-events-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl shadow-slate-900/10 rounded-2xl p-4 transition-all duration-300 hover:shadow-slate-900/15">
        <div className="flex items-start gap-3.5">
          {/* Animated Icon Avatar */}
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 ${iconBg}`}
          >
            {status === 'loading' ? (
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              </div>
            ) : status === 'success' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-scale-in"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : status === 'error' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${badgeColor}`}>
                {badgeLabel}
              </span>
              {status === 'loading' && (
                <span className="text-[11px] text-slate-400 font-medium animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                  Memproses
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
              {title}
            </h4>

            {message && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                {message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors shrink-0"
            aria-label="Tutup notifikasi"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
          {status === 'loading' ? (
            <div className={`h-full w-full bg-gradient-to-r ${barGradient} animate-progress-infinite`} />
          ) : status === 'success' ? (
            <div
              className={`h-full bg-gradient-to-r ${barGradient} ${isPaused ? '' : 'animate-toast-countdown'}`}
              style={{ animationDuration: '3.5s' }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage Action Toast state and triggers
 */
export function useActionToast() {
  const [actionToast, setActionToast] = useState<ActionToastState>({
    show: false,
    status: 'idle',
    actionType: 'info',
    title: '',
    message: '',
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showLoading = (actionType: ActionToastType, title?: string, message?: string) => {
    clearTimer();
    const defaultTitle =
      actionType === 'delete'
        ? 'Menghapus Data...'
        : actionType === 'add'
        ? 'Menyimpan Data Baru...'
        : actionType === 'edit'
        ? 'Memperbarui Data...'
        : 'Memproses Permintaan...';

    const defaultMsg = message || 'Mohon tunggu sebentar, sistem sedang memproses...';

    setActionToast({
      show: true,
      status: 'loading',
      actionType,
      title: title || defaultTitle,
      message: defaultMsg,
    });
  };

  const showSuccess = (actionType: ActionToastType, title?: string, message?: string, duration = 3500) => {
    clearTimer();
    const defaultTitle =
      actionType === 'delete'
        ? 'Data Berhasil Dihapus!'
        : actionType === 'add'
        ? 'Data Berhasil Ditambahkan!'
        : actionType === 'edit'
        ? 'Perubahan Berhasil Disimpan!'
        : 'Aksi Berhasil Diselesaikan!';

    const defaultMsg = message || 'Daftar data telah diperbarui secara otomatis.';

    setActionToast({
      show: true,
      status: 'success',
      actionType,
      title: title || defaultTitle,
      message: defaultMsg,
    });

    timerRef.current = setTimeout(() => {
      setActionToast((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  const showError = (title?: string, message?: string, duration = 4500) => {
    clearTimer();
    setActionToast({
      show: true,
      status: 'error',
      actionType: 'info',
      title: title || 'Gagal Memproses Aksi',
      message: message || 'Terjadi kesalahan sistem. Silakan coba kembali.',
    });

    timerRef.current = setTimeout(() => {
      setActionToast((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  const hideToast = () => {
    clearTimer();
    setActionToast((prev) => ({ ...prev, show: false }));
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    actionToast,
    showLoading,
    showSuccess,
    showError,
    hideToast,
    setActionToast,
  };
}

export default ActionToast;
