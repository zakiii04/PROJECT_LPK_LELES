'use client';

import { useMemo } from 'react';
import type { JadwalPelatihan, JenisSesi } from '@/lib/types';

export type JadwalTableVariant = 'peserta' | 'instruktur';

interface JadwalTableProps {
  schedules: JadwalPelatihan[];
  variant: JadwalTableVariant;
  emptyText?: string;
}

const sesiBadge: Record<string, string> = {
  Orientasi: 'bg-purple-100 text-purple-700 border-purple-200',
  Teori: 'bg-blue-100 text-blue-700 border-blue-200',
  Praktik: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Ujian: 'bg-rose-100 text-rose-700 border-rose-200',
};

function badgeFor(jenisSesi?: JenisSesi | null) {
  return sesiBadge[jenisSesi || ''] || 'bg-slate-100 text-slate-700 border-slate-200';
}

/** "2025-10-01" -> "Rabu, 1 Okt 2025". Teks bebas (legacy) ditampilkan apa adanya. */
export function formatHariTanggal(tanggal?: string | null) {
  if (!tanggal) return '-';
  const iso = tanggal.includes('T') ? tanggal.split('T')[0] : tanggal.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return tanggal;
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return tanggal;
  const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
  const tgl = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  return `${hari}, ${tgl}`;
}

export default function JadwalTable({ schedules, variant, emptyText }: JadwalTableProps) {
  const rows = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const t = (a.tanggal || '').localeCompare(b.tanggal || '');
      if (t !== 0) return t;
      return (a.hari_ke || 0) - (b.hari_ke || 0) || (a.jam || '').localeCompare(b.jam || '');
    });
  }, [schedules]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-400 border border-dashed rounded-xl bg-white">
        {emptyText || 'Belum ada jadwal yang dipublikasikan.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            <th className="py-3.5 px-5">Hari, Tanggal & Waktu</th>
            <th className="py-3.5 px-5">Mata Pelatihan</th>
            <th className="py-3.5 px-5">Ruangan</th>
            {variant === 'peserta' && <th className="py-3.5 px-5">Pengajar</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {rows.map((j) => (
            <tr key={j.id} className="hover:bg-slate-50/90 transition-colors">
              <td className="py-3 px-5 whitespace-nowrap">
                <div className="font-bold text-slate-800">{formatHariTanggal(j.tanggal)}</div>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5">{j.jam || '-'}</div>
              </td>
              <td className="py-3 px-5">
                <div className="font-bold text-slate-800">{j.judul}</div>
                <div className="mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeFor(j.jenis_sesi)}`}>
                    {j.jenis_sesi || 'Sesi'}
                    {j.hari_ke ? ` • Hari ke-${j.hari_ke}` : ''}
                  </span>
                </div>
              </td>
              <td className="py-3 px-5 whitespace-nowrap">
                <div className="font-semibold text-slate-700">{j.ruangan || '-'}</div>
                {j.tempat_pelatihan && (
                  <div className="text-[11px] text-slate-500 mt-0.5 max-w-[220px] truncate" title={j.tempat_pelatihan}>
                    {j.tempat_pelatihan}
                  </div>
                )}
              </td>
              {variant === 'peserta' && (
                <td className="py-3 px-5 whitespace-nowrap font-semibold text-slate-700">
                  {j.pengajar || '-'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
