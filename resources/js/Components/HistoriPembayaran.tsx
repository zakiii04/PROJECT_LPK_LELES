'use client';

import { useState, useEffect, useMemo } from 'react';
import { pembayaranApi } from '@/lib/api';
import type { Pembayaran, Pendaftar, Tagihan } from '@/lib/types';
import PaymentDetailModal from '@/Components/PaymentDetailModal';
import Pagination from '@/Components/Pagination';

type HistoriItem = Pembayaran & {
  tagihan?: Tagihan & { pendaftar?: Pendaftar };
  paymentMethod?: { nama_metode?: string } | null;
};

type StatusFilter = 'semua' | 'menunggu_verifikasi' | 'diterima' | 'ditolak';
type TipeFilter = 'semua' | 'cash' | 'transfer';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  menunggu_verifikasi: 'Menunggu Validasi',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
};

const STATUS_BADGE: Record<string, string> = {
  menunggu_verifikasi: 'bg-amber-100 text-amber-700',
  diterima: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-rose-100 text-rose-700',
};

function fmtRp(n: number) {
  return `Rp ${Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

function fmtTanggal(v?: string | null) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Histori seluruh transaksi pembayaran (terpisah dari manajemen peserta).
 * Ringkasan + filter status/tipe/tanggal/pencarian + detail per transaksi.
 */
export default function HistoriPembayaran() {
  const [semua, setSemua] = useState<HistoriItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [tipeFilter, setTipeFilter] = useState<TipeFilter>('semua');
  const [tglDari, setTglDari] = useState('');
  const [tglSampai, setTglSampai] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<HistoriItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await pembayaranApi.riwayat({ per_page: 1000 });
      const raw = res.data as any;
      const arr: HistoriItem[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setSemua(arr);
    } catch (err) {
      console.error('Gagal memuat histori pembayaran:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, tipeFilter, tglDari, tglSampai]);

  const ringkasan = useMemo(() => {
    const diterima = semua.filter((p) => p.status === 'diterima');
    const menunggu = semua.filter((p) => p.status === 'menunggu_verifikasi');
    const ditolak = semua.filter((p) => p.status === 'ditolak');
    return {
      totalTransaksi: semua.length,
      diterimaNominal: diterima.reduce((s, p) => s + Number(p.nominal || 0), 0),
      diterimaCount: diterima.length,
      menungguNominal: menunggu.reduce((s, p) => s + Number(p.nominal || 0), 0),
      menungguCount: menunggu.length,
      ditolakCount: ditolak.length,
    };
  }, [semua]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return semua.filter((p) => {
      if (statusFilter !== 'semua' && p.status !== statusFilter) return false;
      if (tipeFilter !== 'semua' && p.tipe_pembayaran !== tipeFilter) return false;
      if (tglDari && String(p.tanggal_bayar || '').split('T')[0] < tglDari) return false;
      if (tglSampai && String(p.tanggal_bayar || '').split('T')[0] > tglSampai) return false;
      if (q) {
        const pend = p.tagihan?.pendaftar;
        const hay = `${pend?.nama_lengkap || ''} ${pend?.no_pendaftaran || ''} ${pend?.nik || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [semua, search, statusFilter, tipeFilter, tglDari, tglSampai]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="glass-card-static p-6 animate-fade-in space-y-5">
      <div className="pb-4 border-b border-[var(--card-border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Histori Pembayaran</h2>
        <p className="text-xs text-[var(--text-secondary)]">Seluruh riwayat transaksi pembayaran peserta — diterima, menunggu validasi, maupun ditolak</p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Dana Diterima</div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">{fmtRp(ringkasan.diterimaNominal)}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">{ringkasan.diterimaCount} transaksi</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Menunggu Validasi</div>
          <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">{fmtRp(ringkasan.menungguNominal)}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">{ringkasan.menungguCount} transaksi</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Transaksi</div>
          <div className="text-xl font-extrabold text-slate-800 font-mono mt-1">{ringkasan.totalTransaksi}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{ringkasan.ditolakCount} ditolak</div>
        </div>
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col justify-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Aksi Cepat</div>
          <button onClick={loadData} className="btn btn-outline btn-sm mt-2 text-xs font-bold self-start">
            Muat Ulang Data
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / no. pendaftaran / NIK..."
          className="form-input text-xs flex-1 min-w-52"
        />
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['semua', 'menunggu_verifikasi', 'diterima', 'ditolak'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {s === 'semua' ? 'Semua' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['semua', 'cash', 'transfer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipeFilter(t)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize ${tipeFilter === t ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t === 'semua' ? 'Semua' : t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <input type="date" value={tglDari} onChange={(e) => setTglDari(e.target.value)} className="form-input text-xs w-auto" title="Dari tanggal" />
          <span className="text-xs text-slate-400 shrink-0">s.d.</span>
          <input type="date" value={tglSampai} onChange={(e) => setTglSampai(e.target.value)} className="form-input text-xs w-auto" title="Sampai tanggal" />
        </div>
      </div>

      {/* Tabel */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
          Tidak ada transaksi yang sesuai filter saat ini.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--card-border)]">
                  {['Tanggal', 'Peserta', 'Tipe', 'Metode', 'Nominal', 'Status', 'Aksi'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] ${i === 6 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {paged.map((p) => {
                  const pend = p.tagihan?.pendaftar;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{fmtTanggal(p.tanggal_bayar)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--text-primary)]">{pend?.nama_lengkap || '-'}</div>
                        <div className="text-[10px] font-mono text-[var(--primary)]">{pend?.no_pendaftaran || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-pending text-[10px] capitalize">{p.tipe_pembayaran}</span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {p.tipe_pembayaran === 'transfer'
                          ? (p.paymentMethod?.nama_metode || p.metode_pembayaran || '-')
                          : (p.metode_pembayaran || 'Cash')}
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {p.tipe_pembayaran === 'transfer' ? (p.nama_pengirim || '-') : (p.nama_penerima || '-')}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--text-primary)] font-mono whitespace-nowrap">{fmtRp(Number(p.nominal))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDetail(p)}
                          className="btn btn-outline btn-sm text-[10px] py-1 px-2 whitespace-nowrap"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      {detail && detail.tagihan?.pendaftar && (
        <PaymentDetailModal
          pendaftar={detail.tagihan.pendaftar}
          pembayaran={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
