'use client';

import { useCallback, useEffect, useState } from 'react';
import { paymentMethodApi } from '@/lib/api';
import type { CreatePaymentMethodPayload, PaymentMethod, PaymentMethodType } from '@/lib/types';

const methodTypeLabels: Record<PaymentMethodType, string> = {
  bank: 'Bank Transfer',
  ewallet: 'E-Wallet',
  qris: 'QRIS',
  lainnya: 'Lainnya',
};

export default function PaymentMethodManager() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const [namaMetode, setNamaMetode] = useState('');
  const [rekening, setRekening] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [jenis, setJenis] = useState<PaymentMethodType>('bank');
  const [isActive, setIsActive] = useState(true);
  const [urutan, setUrutan] = useState(1);

  const loadData = useCallback(async () => {
    try {
      const res = await paymentMethodApi.list();
      const sorted = [...(res.data || [])].sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
      setMethods(sorted);
    } catch (err) {
      console.error('Error loading payment methods:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingMethod(null);
    setNamaMetode('');
    setRekening('');
    setDeskripsi('');
    setJenis('bank');
    setIsActive(true);
    setUrutan(methods.length + 1);
    setShowModal(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setNamaMetode(method.nama_metode);
    setRekening(method.rekening || '');
    setDeskripsi(method.deskripsi || '');
    setJenis(method.jenis);
    setIsActive(method.is_active);
    setUrutan(method.urutan || 1);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMetode.trim()) return;

    const payload: CreatePaymentMethodPayload = {
      nama_metode: namaMetode.trim(),
      rekening: rekening.trim() || undefined,
      deskripsi: deskripsi.trim() || undefined,
      jenis,
      is_active: isActive,
      urutan: Number(urutan),
    };

    try {
      if (editingMethod) {
        await paymentMethodApi.update(editingMethod.id, payload);
      } else {
        await paymentMethodApi.create(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving payment method:', err);
      alert('Gagal menyimpan metode pembayaran. Mohon cek kembali inputan Anda.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setPendingDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      await paymentMethodApi.destroy(pendingDelete.id);
      setPendingDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Gagal menghapus metode pembayaran.');
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await paymentMethodApi.update(method.id, { is_active: !method.is_active });
      await loadData();
    } catch (err) {
      console.error('Error toggling payment method status:', err);
      alert('Gagal mengubah status metode pembayaran.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Kelola Metode Pembayaran</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Atur opsi pembayaran yang tersedia untuk peserta saat melakukan pendaftaran atau upload bukti transfer.
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto font-bold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Metode Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {methods.map((method) => (
          <div key={method.id} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {method.nama_metode.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug">{method.nama_metode}</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{methodTypeLabels[method.jenis]}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${method.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {method.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                {method.rekening && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-400 shrink-0">Rekening:</span>
                    <span className="text-[11px] leading-relaxed">{method.rekening}</span>
                  </div>
                )}
                {method.deskripsi && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-400 shrink-0">Keterangan:</span>
                    <span className="text-[11px] leading-relaxed">{method.deskripsi}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-400 shrink-0">Urutan:</span>
                  <span className="font-bold text-slate-700">{method.urutan || 1}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onClick={() => handleToggleActive(method)} className="btn btn-outline btn-sm text-xs">
                {method.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button type="button" onClick={() => openEditModal(method)} className="btn btn-outline btn-sm text-xs">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(method.id, method.nama_metode)} className="btn btn-danger btn-sm text-xs">
                Hapus
              </button>
            </div>
          </div>
        ))}

        {methods.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl bg-white">
            Belum ada metode pembayaran. Klik <b>"Tambah Metode Baru"</b> untuk menambahkan opsi pembayaran.
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Nama Metode</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Bank BCA, QRIS, Dana"
                  value={namaMetode}
                  onChange={(e) => setNamaMetode(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Jenis</label>
                  <select className="form-input" value={jenis} onChange={(e) => setJenis(e.target.value as PaymentMethodType)}>
                    <option value="bank">Bank Transfer</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="qris">QRIS</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Urutan Tampil</label>
                  <input type="number" min={1} className="form-input" value={urutan} onChange={(e) => setUrutan(Number(e.target.value) || 1)} />
                </div>
              </div>

              <div>
                <label className="form-label">Nomor Rekening / A.N / QR</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 1234567890 a.n. LPK Leles"
                  value={rekening}
                  onChange={(e) => setRekening(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Keterangan</label>
                <textarea
                  className="form-input min-h-[80px]"
                  placeholder="Deskripsi tambahan tentang metode pembayaran"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="font-semibold text-slate-700">Status aktif</div>
                  <div className="text-[10px] text-slate-500">Metode dapat dipilih peserta saat pembayaran</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  aria-label="Toggle active"
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingMethod ? 'Simpan Perubahan' : 'Tambah Metode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="modal-overlay" onClick={() => setPendingDelete(null)}>
          <div className="modal-content max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl shrink-0">
                ⚠
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800">Hapus Metode Pembayaran?</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Anda yakin ingin menghapus <span className="font-semibold text-slate-800">{pendingDelete.name}</span>?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tindakan ini tidak bisa dibatalkan dan opsi pembayaran tersebut akan hilang dari daftar peserta.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setPendingDelete(null)} className="btn btn-outline btn-sm">
                Batal
              </button>
              <button type="button" onClick={confirmDelete} className="btn btn-danger btn-sm">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
