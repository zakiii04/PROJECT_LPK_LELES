'use client';

import { useState, useEffect, useCallback } from 'react';
import CertificateView from '@/Components/CertificateView';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import Pagination from '@/Components/Pagination';
import ActionToast, { useActionToast } from '@/Components/ActionToast';
import { pendaftarApi, hasilUjianApi, kehadiranApi, kelulusanApi } from '@/lib/api';
import type { Pendaftar, Kelulusan, HasilUjian, Kehadiran } from '@/lib/types';

export default function GraduationManager() {
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [kelulusanList, setKelulusanList] = useState<Kelulusan[]>([]);
  const [selectedKelulusanForCert, setSelectedKelulusanForCert] = useState<Kelulusan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ pendaftarId: string; name: string } | null>(null);
  const { actionToast, showLoading, showSuccess, showError, hideToast } = useActionToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const [hasilUjianList, setHasilUjianList] = useState<HasilUjian[]>([]);
  const [kehadiranList, setKehadiranList] = useState<Kehadiran[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    const [pRes, kRes, hRes, khRes] = await Promise.all([
      pendaftarApi.list({ status: 'diterima', per_page: 100 }),
      kelulusanApi.list(),
      hasilUjianApi.list(),
      kehadiranApi.list()
    ]);
    setPendaftarList(pRes.data?.data || []);
    setKelulusanList(kRes.data || []);
    setHasilUjianList(hRes.data || []);
    setKehadiranList(khRes.data || []);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIssueKelulusan = async (
    pendaftar: Pendaftar,
    nilaiPretest: number,
    nilaiPosttest: number,
    nilaiKehadiran: number,
    nilaiTugas: number,
    status_kelulusan: 'Lulus' | 'Tidak_Lulus'
  ) => {
    showLoading('add', 'Memproses Kelulusan...', 'Sedang menghitung nilai akhir dan status kelulusan...');
    // Weighted formula: 15% Pretest, 45% Posttest, 20% Kehadiran, 20% Tugas
    const nilai_akhir = Number((
      nilaiPretest * 0.15 + nilaiPosttest * 0.45 + nilaiKehadiran * 0.2 + nilaiTugas * 0.2
    ).toFixed(2));

    try {
      const res = await kelulusanApi.create({
        pendaftar_id: pendaftar.id,
        nilai_pretest: nilaiPretest,
        nilai_posttest: nilaiPosttest,
        nilai_kehadiran: nilaiKehadiran,
        nilai_tugas: nilaiTugas,
        nilai_akhir,
        status_kelulusan,
        tanggal_lulus: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });

      await loadData();
      showSuccess(
        'add',
        status_kelulusan === 'Lulus' ? 'Peserta Dinyatakan Lulus!' : 'Hasil Kelulusan Disimpan',
        status_kelulusan === 'Lulus'
          ? `Nilai akhir ${pendaftar.nama_lengkap}: ${nilai_akhir}. Status akhir otomatis menjadi Lulus.`
          : `Nilai akhir ${pendaftar.nama_lengkap}: ${nilai_akhir}`
      );
      if (status_kelulusan === 'Lulus' && res.data) {
        setSelectedKelulusanForCert(res.data);
      }
    } catch (e: any) {
      showError('Gagal Memproses Kelulusan', e?.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleResetKelulusan = (pendaftarId: string, name: string) => {
    setDeleteTarget({ pendaftarId, name });
  };

  const confirmResetKelulusan = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    showLoading('delete', `Mereset Kelulusan ${deleteTarget.name}...`, 'Sedang menghapus data kelulusan...');

    try {
      const kelulusan = kelulusanList.find((item) => item.pendaftar_id === deleteTarget.pendaftarId);
      if (kelulusan) {
        await kelulusanApi.destroy(kelulusan.id);
      }
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Data Kelulusan Direset!', `Kelulusan untuk "${deletedName}" telah direset.`);
    } catch (e: any) {
      showError('Gagal Mereset Kelulusan', e?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Data Kelulusan?"
        message="Anda yakin ingin menghapus data kelulusan"
        itemName={deleteTarget?.name || null}
        loading={isDeleting}
        onConfirm={confirmResetKelulusan}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      <ActionToast toast={actionToast} onClose={hideToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Manajemen Kelulusan & Sertifikasi Digital</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Kalkulasi nilai akhir berbobot, penetapan status lulus/tidak lulus, dan penerbitan sertifikat digital resmi
          </p>
        </div>
      </div>

      {/* Table Peserta Kelulusan */}
      <div className="overflow-x-auto border border-[var(--card-border)] rounded-xl bg-white">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Pendaftaran</th>
              <th>Nama Peserta</th>
              <th>Program Pelatihan</th>
              <th>Nilai Pretest</th>
              <th>Nilai Posttest</th>
              <th>Nilai Akhir</th>
              <th>Status Kelulusan</th>
              <th>Sertifikat / Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pendaftarList.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-xs text-slate-400">
                  Belum ada data peserta terverifikasi.
                </td>
              </tr>
            ) : (
              pendaftarList.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p: Pendaftar) => {
                const kelulusan = kelulusanList.find((k: Kelulusan) => k.pendaftar_id === p.id);
                const pretest = hasilUjianList
                  .filter((h: HasilUjian) => h.pendaftar_id === p.id && h.tipe === 'pretest')
                  .sort((a, b) => b.nilai - a.nilai)[0];
                const posttest = hasilUjianList
                  .filter((h: HasilUjian) => h.pendaftar_id === p.id && h.tipe === 'posttest')
                  .sort((a, b) => b.nilai - a.nilai)[0];
                const pKehadiran = kehadiranList.filter((k: Kehadiran) => k.pendaftar_id === p.id);
                const hadirCount = pKehadiran.filter((k: Kehadiran) => k.status_kehadiran === 'Hadir').length;
                const nilaiKehadiran = pKehadiran.length > 0 ? Number(((hadirCount / pKehadiran.length) * 100).toFixed(2)) : 0;

                const vPre = pretest?.nilai || 0;
                const vPost = posttest?.nilai || 0;
                const vTugas = kelulusan?.nilai_tugas || 0;
                const vAkhir = Number((vPre * 0.15 + vPost * 0.45 + nilaiKehadiran * 0.2 + vTugas * 0.2).toFixed(2));

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                        {p.no_pendaftaran}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-800 text-xs">{p.nama_lengkap}</div>
                    </td>
                    <td className="text-xs font-semibold text-slate-700">{p.jenis_pelatihan}</td>
                    <td className="font-mono text-xs text-slate-600">{pretest ? `${pretest.nilai}` : '-'}</td>
                    <td className="font-mono text-xs text-slate-600">{posttest ? `${posttest.nilai}` : '-'}</td>
                    <td className="font-mono text-xs font-extrabold text-indigo-600">{kelulusan ? kelulusan.nilai_akhir : vAkhir} / 100</td>
                    <td>
                      <span
                        className={`badge ${
                          kelulusan?.status_kelulusan === 'Lulus'
                            ? 'badge-accepted'
                            : kelulusan?.status_kelulusan === 'Tidak_Lulus'
                            ? 'badge-rejected'
                            : 'badge-pending'
                        }`}
                      >
                        {kelulusan?.status_kelulusan === 'Tidak_Lulus'
                          ? 'Tidak Lulus'
                          : kelulusan?.status_kelulusan === 'Dalam_Proses'
                            ? 'Dalam Proses'
                            : (kelulusan?.status_kelulusan || 'Dalam Proses')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {kelulusan && kelulusan.status_kelulusan !== 'Dalam_Proses' ? (
                        <div className="flex items-center gap-1.5">
                          {kelulusan.status_kelulusan === 'Lulus' && (
                            <button
                              onClick={() => setSelectedKelulusanForCert(kelulusan)}
                              className="btn btn-accent btn-sm text-[11px] flex items-center gap-1"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="7" />
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                              </svg>
                              <span>Lihat Sertifikat</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleResetKelulusan(p.id, p.nama_lengkap)}
                            className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 text-[11px] flex items-center gap-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Reset / Hapus</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleIssueKelulusan(p, vPre, vPost, nilaiKehadiran, vTugas, 'Lulus')}
                            className="btn btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] flex items-center gap-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Tetapkan Lulus</span>
                          </button>
                          <button
                            onClick={() => handleIssueKelulusan(p, vPre, vPost, nilaiKehadiran, vTugas, 'Tidak_Lulus')}
                            className="btn btn-danger btn-sm text-[11px] flex items-center gap-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span>Gagal</span>
                          </button>
                          {kelulusan && (
                            <button
                              onClick={() => handleResetKelulusan(p.id, p.nama_lengkap)}
                              className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 text-[11px] flex items-center gap-1"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Reset / Hapus</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalItems={pendaftarList.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal Preview Sertifikat Digital */}
      {selectedKelulusanForCert && (
        <div className="modal-overlay" onClick={() => setSelectedKelulusanForCert(null)}>
          <div className="modal-content max-w-4xl p-6 bg-slate-900 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <CertificateView kelulusan={selectedKelulusanForCert} onClose={() => setSelectedKelulusanForCert(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
