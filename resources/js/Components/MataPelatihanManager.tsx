'use client';
import { useState, useEffect, useCallback } from 'react';
import type { MataPelajaran, Angkatan, Program } from '@/lib/types';
import { mataPelajaranApi } from '@/lib/api';
import Pagination from '@/Components/Pagination';

interface MataPelatihanManagerProps {
  angkatanList: Angkatan[];
  programList: Program[];
}

export default function MataPelatihanManager({ programList }: MataPelatihanManagerProps) {
  const [mataPelajaranPage, setMataPelajaranPage] = useState(1);
  const pageSize = 10;

  const [mpList, setMpList] = useState<MataPelajaran[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [showMpModal, setShowMpModal] = useState(false);
  const [editingMp, setEditingMp] = useState<MataPelajaran | null>(null);
  const [mpKode, setMpKode] = useState('');
  const [mpNama, setMpNama] = useState('');
  const [mpDeskripsi, setMpDeskripsi] = useState('');
  const [mpProgramId, setMpProgramId] = useState('');
  const [mpUrutan, setMpUrutan] = useState(0);
  const [filterMpProgram, setFilterMpProgram] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);

  const loadMp = useCallback(async () => {
    setMpLoading(true);
    const res = await mataPelajaranApi.list(filterMpProgram ? { program_id: filterMpProgram } : undefined);
    if (res.success && res.data) setMpList(res.data);
    setMpLoading(false);
  }, [filterMpProgram]);

  useEffect(() => { loadMp(); }, [loadMp]);

  function openAddMp() {
    setEditingMp(null);
    setMpKode('');
    setMpNama('');
    setMpDeskripsi('');
    setMpProgramId('');
    setMpUrutan(mpList.length + 1);
    setShowMpModal(true);
  }

  function openEditMp(mp: MataPelajaran) {
    setEditingMp(mp);
    setMpKode(mp.kode);
    setMpNama(mp.nama);
    setMpDeskripsi(mp.deskripsi || '');
    setMpProgramId(mp.program_id || '');
    setMpUrutan(mp.urutan);
    setShowMpModal(true);
  }

  async function handleSaveMp(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = { 
        kode: mpKode, 
        nama: mpNama, 
        deskripsi: mpDeskripsi || undefined, 
        program_id: mpProgramId || undefined, 
        urutan: mpUrutan 
      };
      
      if (editingMp) {
        await mataPelajaranApi.update(editingMp.id, payload);
      } else {
        await mataPelajaranApi.create(payload);
      }
      
      setShowMpModal(false);
      await loadMp();
    } catch (error) {
      console.error('Error saving mata pelatihan:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDeleteMp(mp: MataPelajaran) {
    setDeleteConfirm({ id: mp.id, name: mp.nama });
  }

  function cancelDelete() {
    setDeleteConfirm(null);
  }

  async function handleDeleteMp() {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await mataPelajaranApi.destroy(deleteConfirm.id);
      await loadMp();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting mata pelatihan:', error);
      alert('Terjadi kesalahan saat menghapus data');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Konten Utama */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-extrabold text-[var(--text-primary)] text-lg">Daftar Mata Pelatihan</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Kelola modul / mata pelatihan yang diajarkan pada setiap program pelatihan</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="form-input text-xs py-1.5 px-3 w-auto"
              value={filterMpProgram}
              onChange={(e) => setFilterMpProgram(e.target.value)}
            >
              <option value="">Semua Program</option>
              {programList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            <button onClick={openAddMp} className="btn btn-primary btn-sm flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah
            </button>
          </div>
        </div>

        {mpLoading ? (
          <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">Memuat...</div>
        ) : mpList.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-tertiary)]">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
            <p className="font-semibold">Belum ada mata pelatihan</p>
            <p className="text-xs mt-1">Tambahkan mata pelatihan untuk digunakan dalam program pelatihan</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--card-border)]">
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">#</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Kode</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Nama Mata Pelatihan</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Program</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Deskripsi</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Urutan</th>
                  <th className="text-center px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {mpList.slice((mataPelajaranPage - 1) * pageSize, mataPelajaranPage * pageSize).map((mp, idx) => {
                  const prog = programList.find((p) => p.id === mp.program_id);
                  return (
                    <tr key={mp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-[var(--text-tertiary)]">{(mataPelajaranPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{mp.kode}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{mp.nama}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {prog ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">{prog.nama}</span>
                        ) : (
                          <span className="text-[var(--text-tertiary)] italic">Semua Program</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px] truncate">{mp.deskripsi || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-[var(--text-tertiary)]">{mp.urutan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => openEditMp(mp)} 
                            className="btn btn-outline btn-sm text-[10px] py-1 px-2 flex items-center gap-1"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => confirmDeleteMp(mp)} 
                            className="btn btn-danger btn-sm text-[10px] py-1 px-2 flex items-center gap-1"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6"/>
                              <path d="M14 11v6"/>
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination currentPage={mataPelajaranPage} totalItems={mpList.length} pageSize={pageSize} onPageChange={setMataPelajaranPage} />
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {showMpModal && (
        <div className="modal-overlay" onClick={() => setShowMpModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] text-base">
                {editingMp ? 'Edit Mata Pelatihan' : 'Tambah Mata Pelatihan'}
              </h3>
              <button onClick={() => setShowMpModal(false)} className="text-[var(--text-tertiary)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleSaveMp} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Kode *</label>
                  <input 
                    type="text" 
                    className="form-input text-xs font-mono uppercase" 
                    placeholder="mis: MTK01" 
                    maxLength={20} 
                    value={mpKode} 
                    onChange={(e) => setMpKode(e.target.value.toUpperCase())} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">Urutan</label>
                  <input 
                    type="number" 
                    className="form-input text-xs" 
                    min={0} 
                    value={mpUrutan} 
                    onChange={(e) => setMpUrutan(Number(e.target.value))} 
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Nama Mata Pelatihan *</label>
                <input 
                  type="text" 
                  className="form-input text-xs" 
                  placeholder="mis: Teknik Menjahit Dasar" 
                  value={mpNama} 
                  onChange={(e) => setMpNama(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="form-label">Program Pelatihan</label>
                <select 
                  className="form-input text-xs" 
                  value={mpProgramId} 
                  onChange={(e) => setMpProgramId(e.target.value)}
                >
                  <option value="">Berlaku untuk Semua Program</option>
                  {programList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Deskripsi</label>
                <textarea 
                  className="form-input text-xs min-h-[60px]" 
                  placeholder="Deskripsi singkat mata pelatihan..." 
                  value={mpDeskripsi} 
                  onChange={(e) => setMpDeskripsi(e.target.value)} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowMpModal(false)} 
                  className="btn btn-outline btn-sm"
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  disabled={isSaving}
                >
                  {isSaving && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--card-border)]">
              <h3 className="font-bold text-[var(--text-primary)] text-base">Konfirmasi Hapus</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-primary)] font-semibold">Hapus Mata Pelatihan?</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Anda akan menghapus: <span className="font-bold text-red-600">{deleteConfirm.name}</span></p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Mata pelatihan yang dihapus tidak dapat dikembalikan. Semua data terkait mata pelatihan ini akan ikut terhapus.
              </p>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={cancelDelete}
                  className="btn btn-outline btn-sm"
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteMp}
                  className="btn btn-danger btn-sm flex items-center gap-1.5"
                  disabled={isDeleting}
                >
                  {isDeleting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}