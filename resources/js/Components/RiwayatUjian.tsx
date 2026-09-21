'use client';

import { useEffect, useState } from 'react';
import { hasilUjianApi } from '@/lib/api';
import type { HasilUjian, Pendaftar, TipeUjian } from '@/lib/types';

interface RiwayatUjianPanelProps {
  pendaftarId: string;
  pendaftarNama?: string;
}

// Panel histori pengerjaan pretest/posttest + croschek jawaban per soal.
// Dipakai di dashboard Admin & Instruktur.
export function RiwayatUjianPanel({ pendaftarId, pendaftarNama }: RiwayatUjianPanelProps) {
  const [tipe, setTipe] = useState<TipeUjian>('pretest');
  const [list, setList] = useState<HasilUjian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, HasilUjian>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError('');
      setExpandedId(null);
      try {
        const res = await hasilUjianApi.byPendaftar(pendaftarId);
        if (!cancelled) {
          if (res.success && res.data) {
            setList(res.data);
          } else {
            setError(res.error || 'Gagal memuat histori ujian.');
          }
        }
      } catch {
        if (!cancelled) setError('Gagal menghubungi server.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    if (pendaftarId) load();
    return () => {
      cancelled = true;
    };
  }, [pendaftarId]);

  const toggleExpand = async (attempt: HasilUjian) => {
    if (expandedId === attempt.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(attempt.id);
    if (detailCache[attempt.id] || (attempt.detail && attempt.detail.length > 0)) return;
    setDetailLoadingId(attempt.id);
    try {
      const res = await hasilUjianApi.show(attempt.id);
      if (res.success && res.data) {
        setDetailCache((prev) => ({ ...prev, [attempt.id]: res.data! }));
      }
    } finally {
      setDetailLoadingId(null);
    }
  };

  const filtered = list
    .filter((h) => h.tipe === tipe)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  // Nomor percobaan kronologis (terlama = #1)
  const chronological = [...filtered].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
  );
  const attemptNo = (id: string) => chronological.findIndex((h) => h.id === id) + 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {pendaftarNama && (
        <p className="text-xs text-slate-500">
          Histori pengerjaan milik <span className="font-bold text-slate-800">{pendaftarNama}</span>
        </p>
      )}

      {/* Tab tipe ujian */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start w-fit">
        {(['pretest', 'posttest'] as const).map((t) => {
          const count = list.filter((h) => h.tipe === t).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTipe(t);
                setExpandedId(null);
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                tipe === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t} ({count}/3)
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
          Belum ada percobaan <span className="font-bold uppercase">{tipe}</span> untuk peserta ini.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => {
            const isOpen = expandedId === h.id;
            const full: HasilUjian = detailCache[h.id] || h;
            const detail = full.detail || [];
            return (
              <div key={h.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(h)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        h.nilai >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {h.nilai}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Percobaan ke-{attemptNo(h.id)}{' '}
                        <span className="font-normal text-slate-400">• {formatTanggal(h.tanggal)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Benar {h.benar} • Salah {h.salah} • {h.total_soal} soal
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm shrink-0">{isOpen ? '▾' : '▸'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                    {detailLoadingId === h.id ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    ) : detail.length === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        Rincian jawaban per soal tidak tersimpan untuk percobaan ini (pengerjaan lama sebelum
                        fitur croschek aktif). Nilai agregat di atas tetap valid.
                      </div>
                    ) : (
                      detail.map((d, idx) => (
                        <SoalCroschek key={`${d.soal_id}-${idx}`} nomor={idx + 1} item={d} />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SoalCroschek({
  nomor,
  item,
}: {
  nomor: number;
  item: NonNullable<HasilUjian['detail']>[number];
}) {
  const opsi = Array.isArray(item.opsi) ? item.opsi : [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-900 leading-relaxed">
          <span className="font-mono text-indigo-600 mr-1.5">{nomor}.</span>
          {item.pertanyaan}
        </h4>
        <span
          className={`shrink-0 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
            item.benar
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {item.benar ? '✓ Benar' : '✕ Salah'}
        </span>
      </div>

      {item.gambar_soal && (
        <img
          src={item.gambar_soal}
          alt={`Gambar soal ${nomor}`}
          className="max-h-40 max-w-full rounded-lg border border-slate-200 object-contain bg-slate-50 p-1"
        />
      )}

      <div className="space-y-1.5">
        {opsi.map((teks, oIdx) => {
          const isKunci = item.jawaban_benar !== null && oIdx === item.jawaban_benar;
          const isJawabanPeserta = oIdx === item.jawaban_peserta;
          const char = String.fromCharCode(65 + oIdx);
          let cls = 'bg-white border-slate-200 text-slate-700';
          if (isKunci && isJawabanPeserta) cls = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
          else if (isKunci) cls = 'bg-emerald-50/60 border-emerald-300 text-emerald-900';
          else if (isJawabanPeserta) cls = 'bg-rose-50 border-rose-400 text-rose-950';
          return (
            <div key={oIdx} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs ${cls}`}>
              <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                {char}
              </span>
              <span className="flex-1 leading-relaxed">{teks}</span>
              {isKunci && (
                <span className="shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Jawaban Benar
                </span>
              )}
              {isJawabanPeserta && !isKunci && (
                <span className="shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  Jawaban peserta
                </span>
              )}
              {isJawabanPeserta && isKunci && (
                <span className="shrink-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Jawaban peserta ✓
                </span>
              )}
            </div>
          );
        })}
        {item.jawaban_peserta === -1 && (
          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-500 italic">
            Peserta tidak menjawab soal ini.
          </div>
        )}
        {item.jawaban_benar === null && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Soal asli sudah dihapus dari bank soal — kunci jawaban tidak dapat ditampilkan, memakai snapshot
            saat ujian dikerjakan.
          </div>
        )}
      </div>
    </div>
  );
}

function formatTanggal(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface RiwayatUjianModalProps {
  pendaftar: Pendaftar;
  onClose: () => void;
}

export default function RiwayatUjianModal({ pendaftar, onClose }: RiwayatUjianModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Histori Pengerjaan Ujian</h3>
            <p className="text-xs text-slate-500">
              {pendaftar.nama_lengkap} • {pendaftar.no_pendaftaran}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer"
            aria-label="Tutup"
          >
            X
          </button>
        </div>

        <RiwayatUjianPanel pendaftarId={pendaftar.id} />

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
