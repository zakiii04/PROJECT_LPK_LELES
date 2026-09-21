'use client';

import { useState, useEffect } from 'react';
import { pendaftarApi } from '@/lib/api';
import type { TenggatInfo } from '@/lib/types';
import { formatTanggalID, sisaHariText } from '@/lib/storage';

interface TenggatBannerProps {
  /** ID pendaftar — banner mengambil info tenggat sendiri. */
  pendaftarId?: string | null;
  /** Atau oper info yang sudah ada (tanpa fetch). */
  tenggat?: TenggatInfo | null;
}

/**
 * Banner batas waktu pelunasan: 11 hari dari hari pertama pelatihan.
 * Menandai MENUNGGAK bila lewat batas dan masih ada sisa (tanpa blokir).
 */
export default function TenggatBanner({ pendaftarId, tenggat: tenggatProp }: TenggatBannerProps) {
  const [tenggat, setTenggat] = useState<TenggatInfo | null>(tenggatProp ?? null);
  const [loading, setLoading] = useState(!tenggatProp && !!pendaftarId);

  useEffect(() => {
    if (tenggatProp) {
      setTenggat(tenggatProp);
      setLoading(false);
      return;
    }
    if (!pendaftarId) return;
    let alive = true;
    setLoading(true);
    pendaftarApi
      .getPembayaran(pendaftarId)
      .then((res) => {
        if (!alive) return;
        if (res.success && res.data?.tenggat) setTenggat(res.data.tenggat);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pendaftarId, tenggatProp]);

  if (loading) {
    return (
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 animate-pulse">
        Memuat info batas pembayaran...
      </div>
    );
  }
  if (!tenggat || !tenggat.batas_akhir) return null;

  const sisaText = sisaHariText(tenggat.sisa_hari);
  const menunggak = tenggat.menunggak;

  return (
    <div
      className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
        menunggak
          ? 'bg-rose-50 border-rose-300 text-rose-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
          menunggak ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="font-extrabold text-sm flex items-center gap-2 flex-wrap">
          <span>{menunggak ? 'MENUNGGAK — Lewat Batas Pembayaran' : 'Batas Waktu Pelunasan'}</span>
          {sisaText && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                menunggak
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-amber-200 text-amber-900 border-amber-300'
              }`}
            >
              {sisaText}
            </span>
          )}
        </div>
        <p className={menunggak ? 'text-rose-800' : 'text-amber-800'}>
          Seluruh biaya wajib lunas maksimal{' '}
          <strong>{formatTanggalID(tenggat.batas_akhir)}</strong> (11 hari dari hari pertama
          pelatihan{tenggat.hari_pertama ? `, ${formatTanggalID(tenggat.hari_pertama)}` : ''}).
          {tenggat.sisa_tagihan > 0 && (
            <> Sisa tagihan: <strong>Rp {tenggat.sisa_tagihan.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</strong>.</>
          )}
        </p>
      </div>
    </div>
  );
}
