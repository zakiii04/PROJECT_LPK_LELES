import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
  type Pendaftar,
  getStatusLabel,
  getStatusBadgeClass,
} from '@/lib/storage';
import Pagination from '@/Components/Pagination';

interface AdminPendaftarTableProps {
  data: Pendaftar[];
  onViewDetail?: (pendaftar: Pendaftar) => void;
  onDeletePendaftar?: (pendaftarId: string, nama: string) => void;
}

export default function AdminPendaftarTable({ data, onViewDetail, onDeletePendaftar }: AdminPendaftarTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.ceil(data.length / pageSize);
  const validPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedData = data.slice((validPage - 1) * pageSize, validPage * pageSize);

  const handleDetail = (pendaftar: Pendaftar) => {
    if (onViewDetail) {
      onViewDetail(pendaftar);
    } else {
      router.visit(`/admin/peserta/${pendaftar.id}`);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--surface)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Belum Ada Pendaftar</h3>
        <p className="text-sm text-[var(--text-secondary)]">Data pendaftar akan muncul setelah ada yang mendaftar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[var(--card-border)] rounded-xl">
      <table className="data-table">
        <thead>
          <tr>
            <th>No. Pendaftaran</th>
            <th>Nama Peserta</th>
            <th className="hidden md:table-cell">Program Pelatihan</th>
            <th className="hidden sm:table-cell">Tanggal Daftar</th>
            <th className="hidden xl:table-cell">Angkatan</th>
            <th>Status Validasi</th>
            <th className="hidden lg:table-cell">Status Pembayaran</th>
            <th className="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((pendaftar) => {
            return (
              <tr key={pendaftar.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                <td className="whitespace-nowrap">
                  <span className="font-mono text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-2.5 py-0.5 rounded border border-[rgba(79,70,229,0.15)] whitespace-nowrap inline-block">
                    {pendaftar.no_pendaftaran}
                  </span>
                </td>
                <td>
                  <div className="font-bold text-[var(--text-primary)] text-xs">{pendaftar.nama_lengkap}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <span>NIK: {pendaftar.nik}</span>
                    <span>•</span>
                  </div>
                </td>
                <td className="hidden md:table-cell whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--card-border)] flex items-center justify-center flex-shrink-0 text-[var(--primary)] text-[10px]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 12 3 12 0v-5" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      {pendaftar.jenis_pelatihan}
                    </span>
                  </div>
                </td>
                <td className="hidden sm:table-cell whitespace-nowrap">
                  <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                    {pendaftar.tanggal_daftar ? new Date(pendaftar.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </td>
                <td className="hidden xl:table-cell whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {pendaftar.angkatan?.nama_angkatan || (pendaftar.angkatan_id ? 'Sudah ditetapkan' : 'Belum masuk angkatan')}
                  </span>
                </td>
                <td>
                  <span className={getStatusBadgeClass(pendaftar.status)}>{getStatusLabel(pendaftar.status)}</span>
                </td>
                <td className="hidden lg:table-cell">
                  <span
                    className={
                      pendaftar.status === 'diterima'
                        ? pendaftar.status_pembayaran === 'lunas'
                          ? 'badge badge-accepted'
                          : pendaftar.status_pembayaran === 'menunggu_konfirmasi'
                            ? 'badge badge-pending'
                            : pendaftar.status_pembayaran === 'cicilan_sebagian'
                              ? 'badge badge-processing'
                              : 'badge badge-rejected'
                        : 'text-[11px] text-slate-400 font-medium'
                    }
                  >
                    {pendaftar.status === 'diterima'
                      ? pendaftar.status_pembayaran === 'lunas'
                        ? 'Lunas'
                        : pendaftar.status_pembayaran === 'menunggu_konfirmasi'
                          ? 'Verifikasi'
                          : pendaftar.status_pembayaran === 'cicilan_sebagian'
                            ? 'Cicilan'
                            : 'Belum Bayar'
                      : '-'}
                  </span>
                </td>
                <td className="whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleDetail(pendaftar)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-2.5 py-1 rounded transition-colors border border-indigo-100"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Detail & Edit
                    </button>
                    {onDeletePendaftar && (
                      <button
                        onClick={() => onDeletePendaftar(pendaftar.id, pendaftar.nama_lengkap)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 px-2 py-0.5 rounded transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination
        currentPage={validPage}
        totalItems={data.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
