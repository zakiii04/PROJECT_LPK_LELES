'use client';

import { useState, useEffect, useCallback } from 'react';
import { tempatApi } from '@/lib/api';
import type { TempatPelatihan } from '@/lib/types';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import ActionToast, { useActionToast } from '@/Components/ActionToast';

interface TempatManagerProps {
  initialTempatList?: TempatPelatihan[];
}

export default function TempatManager({ initialTempatList = [] }: TempatManagerProps) {
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>(initialTempatList);
  const [showModal, setShowModal] = useState(false);
  const [editingTempat, setEditingTempat] = useState<TempatPelatihan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { actionToast, showLoading, showSuccess, showError, hideToast } = useActionToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [namaTempat, setNamaTempat] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [kapasitas, setKapasitas] = useState(30);
  const [fasilitas, setFasilitas] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  const loadData = useCallback(async () => {
    try {
      const res = await tempatApi.list();
      setTempatList(res.data || []);
    } catch (err) {
      console.error('Error loading tempat pelatihan:', err);
    }
  }, []);

  useEffect(() => {
    if (initialTempatList.length > 0) {
      setTempatList(initialTempatList);
    } else {
      loadData();
    }
  }, [initialTempatList]);

  const handleOpenAddModal = () => {
    setEditingTempat(null);
    setNamaTempat('');
    setAlamatLengkap('');
    setKapasitas(30);
    setFasilitas('');
    setStatus('Aktif');
    setShowModal(true);
  };

  const handleOpenEditModal = (t: TempatPelatihan) => {
    setEditingTempat(t);
    setNamaTempat(t.nama_tempat);
    setAlamatLengkap(t.alamat_lengkap);
    setKapasitas(t.kapasitas);
    setFasilitas(t.fasilitas || '');
    setStatus(t.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTempat || !alamatLengkap) return;

    setIsSubmitting(true);
    const isEdit = Boolean(editingTempat);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Memperbarui Tempat Pelatihan...' : 'Menambahkan Tempat Baru...',
      'Sedang memproses dan menyimpan ke sistem...'
    );

    try {
      const payload = {
        nama_tempat: namaTempat,
        alamat_lengkap: alamatLengkap,
        kapasitas: Number(kapasitas),
        fasilitas,
        status,
      };

      if (editingTempat) {
        await tempatApi.update(editingTempat.id, payload);
      } else {
        await tempatApi.create(payload);
      }

      const savedName = namaTempat;
      setShowModal(false);
      await loadData();
      showSuccess(
        isEdit ? 'edit' : 'add',
        isEdit ? 'Tempat Pelatihan Berhasil Diperbarui!' : 'Tempat Pelatihan Baru Berhasil Ditambahkan!',
        `Lokasi "${savedName}" telah tersimpan.`
      );
    } catch (err: any) {
      console.error('Error saving tempat pelatihan:', err);
      showError('Gagal Menyimpan Tempat', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, nama: string) => {
    setDeleteTarget({ id, name: nama });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    showLoading('delete', `Menghapus ${deleteTarget.name}...`, 'Sedang menghapus lokasi dari sistem...');

    try {
      await tempatApi.destroy(deleteTarget.id);
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Tempat Pelatihan Berhasil Dihapus!', `"${deletedName}" telah dihapus.`);
    } catch (err: any) {
      console.error('Error deleting tempat pelatihan:', err);
      showError('Gagal Menghapus Tempat', err?.message || 'Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Kelola Tempat & Lokasi Pelatihan</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Atur daftar gedung, workshop, dan lokasi tempat pelaksanaan pelatihan kerja LPK
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto font-bold"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Tempat Baru
        </button>
      </div>

      {/* Cards List Tempat Pelatihan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tempatList.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug">{t.nama_tempat}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    t.status === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="font-semibold text-slate-400 shrink-0">Alamat:</span>
                  <span className="leading-relaxed">{t.alamat_lengkap}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="font-semibold text-slate-400 shrink-0">Kapasitas:</span>
                  <span className="font-bold text-slate-800">{t.kapasitas} Peserta</span>
                </div>
                {t.fasilitas && (
                  <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-400 shrink-0">Fasilitas:</span>
                    <span className="text-[11px] leading-relaxed text-slate-500">{t.fasilitas}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEditModal(t)}
                className="btn btn-outline btn-sm text-xs flex items-center gap-1"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(t.id, t.nama_tempat)}
                className="btn btn-danger btn-sm text-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        {tempatList.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl bg-white">
            Belum ada tempat pelatihan. Klik <b>"Tambah Tempat Baru"</b> untuk menambahkan lokasi.
          </div>
        )}
      </div>

      {/* Modal Form Tambah/Edit Tempat */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { if (!isSubmitting) setShowModal(false); }}>
          <div className="modal-content relative max-w-lg p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isSubmitting && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
              </div>
            )}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingTempat ? 'Edit Tempat Pelatihan' : 'Tambah Tempat Pelatihan Baru'}
              </h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-black disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Nama Tempat / Gedung</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Gedung LPK Leles Utama / Workshop Menjahit"
                  value={namaTempat}
                  onChange={(e) => setNamaTempat(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Alamat Lengkap</label>
                <textarea
                  className="form-input min-h-[70px]"
                  placeholder="Alamat jalan, RT/RW, desa/kelurahan, kecamatan..."
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Kapasitas Peserta</label>
                  <input
                    type="number"
                    className="form-input"
                    value={kapasitas}
                    onChange={(e) => setKapasitas(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Status Tempat</label>
                  <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Fasilitas Tempat</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Mesin Jahit High-Speed, AC, Wifi, Manekin"
                  value={fasilitas}
                  onChange={(e) => setFasilitas(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isSubmitting
                    ? (editingTempat ? 'Memperbarui...' : 'Menyimpan...')
                    : (editingTempat ? 'Simpan Perubahan' : 'Tambah Tempat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Tempat Pelatihan?"
        message="Anda yakin ingin menghapus lokasi tempat pelatihan"
        itemName={deleteTarget?.name || null}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      <ActionToast toast={actionToast} onClose={hideToast} />
    </div>
  );
}
