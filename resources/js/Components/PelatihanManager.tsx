'use client';

import { useState, useEffect, useCallback } from 'react';
import { programsApi } from '@/lib/api';
import type { ProgramPelatihan } from '@/lib/types';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';

export default function PelatihanManager() {
  const [programList, setProgramList] = useState<ProgramPelatihan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramPelatihan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [durasi, setDurasi] = useState('3 Bulan');
  const [harga, setHarga] = useState(3500000);

  const loadData = useCallback(async () => {
    try {
      const res = await programsApi.list();
      setProgramList(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setNama('');
    setDeskripsi('');
    setDurasi('3 Bulan');
    setHarga(3500000);
    setShowModal(true);
  };

  const handleOpenEditModal = (p: ProgramPelatihan) => {
    setEditingProgram(p);
    setNama(p.nama);
    setDeskripsi(p.deskripsi);
    setDurasi(p.durasi);
    setHarga(p.harga);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !deskripsi || !durasi || !harga) return;

    try {
      if (editingProgram) {
        await programsApi.update(editingProgram.id, {
          nama,
          deskripsi,
          durasi,
          harga: Number(harga),
          harga_formatted: `Rp ${Number(harga).toLocaleString('id-ID')}`,
        });
      } else {
        await programsApi.create({
          id: '',
          nama,
          deskripsi,
          durasi,
          harga: Number(harga),
          harga_formatted: `Rp ${Number(harga).toLocaleString('id-ID')}`,
        });
      }

      setShowModal(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: string, namaProgram: string) => {
    setDeleteTarget({ id, name: namaProgram });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await programsApi.destroy(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Manajemen Program Pelatihan</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Kelola daftar program keahlian & pelatihan kerja yang dibuka di LPK
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
          Tambah Program Pelatihan
        </button>
      </div>

      {/* Grid Cards Program Pelatihan (Tanpa Gambar / Tanpa Icon Circle) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programList.map((prog) => (
          <div
            key={prog.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-[var(--text-primary)] text-base leading-snug">{prog.nama}</h3>
                <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {prog.durasi}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                {prog.deskripsi}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Biaya Pelatihan</span>
                <span className="font-extrabold text-indigo-700 text-sm">
                  {prog.harga_formatted || `Rp ${prog.harga.toLocaleString('id-ID')}`}
                </span>
              </div>
            </div>

            {/* Actions: Edit & Hapus */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEditModal(prog)}
                className="btn btn-outline btn-sm text-xs flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(prog.id, prog.nama)}
                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form Tambah / Edit Program */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProgram ? 'Edit Program Pelatihan' : 'Tambah Program Pelatihan Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Nama Program Pelatihan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Barista & Coffee Shop / Tata Boga & Pastry"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Deskripsi Program</label>
                <textarea
                  className="form-input min-h-[80px]"
                  placeholder="Penjelasan singkat mengenai materi dan keahlian yang dipelajari..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Durasi Pelatihan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: 2 Bulan / 3 Bulan"
                    value={durasi}
                    onChange={(e) => setDurasi(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Biaya Pelatihan (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="3000000"
                    value={harga}
                    onChange={(e) => setHarga(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingProgram ? 'Simpan Perubahan' : 'Tambah Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Program Pelatihan?"
        message="Anda yakin ingin menghapus program pelatihan"
        itemName={deleteTarget?.name || null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
