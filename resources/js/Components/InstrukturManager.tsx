'use client';

import { useState, useEffect, useCallback } from 'react';
import { instrukturApi } from '@/lib/api';
import type { Instruktur } from '@/lib/types';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import ActionToast, { useActionToast } from '@/Components/ActionToast';

interface InstrukturManagerProps {
  initialInstrukturList?: Instruktur[];
}

export default function InstrukturManager({ initialInstrukturList = [] }: InstrukturManagerProps) {
  const [instrukturList, setInstrukturList] = useState<Instruktur[]>(initialInstrukturList);
  const [showModal, setShowModal] = useState(false);
  const [editingInstruktur, setEditingInstruktur] = useState<Instruktur | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { actionToast, showLoading, showSuccess, showError, hideToast } = useActionToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [keahlian, setKeahlian] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await instrukturApi.list();
      setInstrukturList(res.data || []);
    } catch (err) {
      console.error('Error loading instruktur:', err);
    }
  }, []);

  useEffect(() => {
    if (initialInstrukturList.length > 0) {
      setInstrukturList(initialInstrukturList);
    } else {
      loadData();
    }
  }, [initialInstrukturList]);

  const handleOpenAddModal = () => {
    setEditingInstruktur(null);
    setNama('');
    setNoHp('');
    setEmail('');
    setKeahlian('');
    setStatus('Aktif');
    setUsername('');
    setPassword('');
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Instruktur) => {
    setEditingInstruktur(t);
    setNama(t.nama);
    setNoHp(t.no_hp || '');
    setEmail(t.email || '');
    setKeahlian(t.keahlian || '');
    setStatus(t.status);
    setUsername(t.user?.username || '');
    setPassword('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    // Akun login: username & password harus diisi berpasangan
    if ((username.trim() || password) && !(username.trim() && password)) {
      showError('Akun Belum Lengkap', 'Username dan password harus diisi keduanya untuk membuat akun login.');
      return;
    }
    if (password && password.length < 6) {
      showError('Password Terlalu Pendek', 'Password akun minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const isEdit = Boolean(editingInstruktur);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Memperbarui Instruktur...' : 'Menambahkan Instruktur Baru...',
      'Sedang memproses dan menyimpan ke sistem...'
    );

    try {
      const payload: Record<string, any> = {
        nama: nama.trim(),
        no_hp: noHp.trim() || undefined,
        email: email.trim() || undefined,
        keahlian: keahlian.trim() || undefined,
        status,
      };
      if (username.trim()) payload.username = username.trim();
      if (password) payload.password = password;

      if (editingInstruktur) {
        await instrukturApi.update(editingInstruktur.id, payload);
      } else {
        await instrukturApi.create(payload);
      }

      const savedName = nama.trim();
      const akunDibuat = Boolean(username.trim() && password);
      setShowModal(false);
      await loadData();
      showSuccess(
        isEdit ? 'edit' : 'add',
        isEdit ? 'Instruktur Berhasil Diperbarui!' : 'Instruktur Baru Berhasil Ditambahkan!',
        akunDibuat
          ? `Akun login "${username.trim()}" dibuat — bisa masuk ke dashboard instruktur.`
          : `Instruktur "${savedName}" telah tersimpan dan bisa dipilih pada form jadwal.`
      );
    } catch (err: any) {
      console.error('Error saving instruktur:', err);
      showError('Gagal Menyimpan Instruktur', err?.message || 'Terjadi kesalahan sistem.');
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
    showLoading('delete', `Menghapus ${deleteTarget.name}...`, 'Sedang menghapus instruktur dari sistem...');

    try {
      await instrukturApi.destroy(deleteTarget.id);
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Instruktur Berhasil Dihapus!', `"${deletedName}" telah dihapus.`);
    } catch (err: any) {
      console.error('Error deleting instruktur:', err);
      showError('Gagal Menghapus Instruktur', err?.message || 'Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredList = instrukturList.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.nama.toLowerCase().includes(q) ||
      (t.keahlian || '').toLowerCase().includes(q) ||
      (t.no_hp || '').includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Kelola Instruktur / Pengajar</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Daftar instruktur yang bisa dipilih pada form jadwal & sesi pelatihan (atau diketik manual)
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
          Tambah Instruktur Baru
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="form-input text-xs max-w-xs"
          placeholder="Cari nama / keahlian instruktur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="text-[11px] text-slate-500 font-mono">{filteredList.length} instruktur</span>
      </div>

      {/* Tabel Instruktur */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">#</th>
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nama Instruktur</th>
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Keahlian</th>
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Kontak</th>
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Akun Login</th>
              <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
              <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredList.map((t, idx) => (
              <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-800">{t.nama}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.keahlian || '-'}</td>
                <td className="px-4 py-3">
                  {t.no_hp || t.email ? (
                    <div className="space-y-0.5">
                      {t.no_hp && <div className="font-mono text-slate-700">{t.no_hp}</div>}
                      {t.email && <div className="text-[11px] text-slate-500 break-all">{t.email}</div>}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.user ? (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        {t.user.username}
                      </span>
                      <div className="text-[11px] text-slate-500 break-all">{t.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      Belum punya akun
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'Aktif'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(t)}
                      className="btn btn-outline btn-sm text-[10px] py-1 px-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.nama)}
                      className="btn btn-danger btn-sm text-[10px] py-1 px-2"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredList.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            Belum ada data instruktur. Klik <b>"Tambah Instruktur Baru"</b> untuk menambahkan.
          </div>
        )}
      </div>

      {/* Modal Form Tambah/Edit Instruktur */}
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
                {editingInstruktur ? 'Edit Instruktur' : 'Tambah Instruktur Baru'}
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
                <label className="form-label">Nama Instruktur *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Hj. Siti Rahmah, S.Ds"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">No. HP</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="08xxxxxxxxxx"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Keahlian / Spesialisasi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Menjahit, Pola Busana, Bordir"
                  value={keahlian}
                  onChange={(e) => setKeahlian(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                <div>
                  <div className="text-xs font-bold text-indigo-900">Akun Login Dashboard Instruktur</div>
                  <div className="text-[11px] text-indigo-700">
                    {editingInstruktur?.user
                      ? `Tertaut ke akun "${editingInstruktur.user.username}". Isi password baru untuk mereset, kosongkan bila tidak diubah.`
                      : 'Isi keduanya untuk otomatis membuatkan akun login. Kosongkan bila hanya data master.'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input bg-white"
                      placeholder="misal: instruktur_andi"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      {editingInstruktur?.user ? 'Password Baru' : 'Password'}
                    </label>
                    <input
                      type="password"
                      className="form-input bg-white"
                      placeholder="Min. 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
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
                    ? (editingInstruktur ? 'Memperbarui...' : 'Menyimpan...')
                    : (editingInstruktur ? 'Simpan Perubahan' : 'Tambah Instruktur')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Instruktur?"
        message="Anda yakin ingin menghapus instruktur"
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
