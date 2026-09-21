'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { pembayaranApi, paymentMethodApi, pendaftarApi } from '@/lib/api';
import type { Pendaftar, PaymentMethod } from '@/lib/types';

interface ManualPaymentModalProps {
  pendaftarList?: Pendaftar[];
  initialPendaftarId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Form pembayaran MANUAL oleh admin: nama peserta bisa diketik/dicari,
 * nominal bebas (maks. sisa tagihan), opsi cash/transfer + metode.
 * Tercatat langsung sebagai DITERIMA (sisa tagihan langsung berkurang).
 */
export default function ManualPaymentModal({
  pendaftarList: propList,
  initialPendaftarId,
  onClose,
  onSuccess,
}: ManualPaymentModalProps) {
  const [daftar, setDaftar] = useState<Pendaftar[]>(propList || []);
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<Pendaftar | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [tipePembayaran, setTipePembayaran] = useState<'cash' | 'transfer'>('cash');
  const [metode, setMetode] = useState('');
  const [nominal, setNominal] = useState('');
  const [tanggalBayar, setTanggalBayar] = useState(() => new Date().toISOString().split('T')[0]);
  const [namaPenerima, setNamaPenerima] = useState('');
  const [namaPengirim, setNamaPengirim] = useState('');
  const [jenisPengirim, setJenisPengirim] = useState('');
  const [catatan, setCatatan] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar peserta bila tidak dioper dari dashboard.
  useEffect(() => {
    if (propList && propList.length > 0) return;
    pendaftarApi.list({ per_page: 1000 }).then((res) => {
      const raw = res.data as any;
      const arr: Pendaftar[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setDaftar(arr);
    }).catch(() => {});
  }, [propList]);

  useEffect(() => {
    setDaftar(propList || []);
  }, [propList]);

  // Preselect bila dibuka dari konteks peserta tertentu.
  useEffect(() => {
    if (initialPendaftarId && daftar.length > 0 && !selected) {
      const found = daftar.find((p) => p.id === initialPendaftarId);
      if (found) {
        setSelected(found);
        setQuery('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPendaftarId, daftar]);

  useEffect(() => {
    paymentMethodApi.list().then((res) => {
      const active = (res.data || []).filter((m) => m.is_active);
      setPaymentMethods(active);
      if (active.length > 0) setMetode(active[0].id);
    }).catch(() => {});
  }, []);

  // Tutup dropdown saat klik di luar.
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const hasilCari = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return daftar.slice(0, 8);
    return daftar.filter((p) =>
      p.nama_lengkap.toLowerCase().includes(q) ||
      (p.no_pendaftaran || '').toLowerCase().includes(q) ||
      (p.nik || '').includes(q)
    ).slice(0, 8);
  }, [daftar, query]);

  const program = selected?.program;
  const totalBiaya = Number(program?.harga || selected?.biaya_pelatihan || 0);
  const sisaTagihan = Math.max(0, Number(selected?.tagihan?.nominal ?? totalBiaya));

  const pilihPeserta = (p: Pendaftar) => {
    setSelected(p);
    setQuery('');
    setDropdownOpen(false);
    setError('');
    const sisa = Math.max(0, Number(p.tagihan?.nominal ?? (p.program?.harga || p.biaya_pelatihan || 0)));
    setNominal(sisa > 0 ? String(Math.round(sisa)) : '');
  };

  const batalPilih = () => {
    setSelected(null);
    setNominal('');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBuktiFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBuktiPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selected) {
      setError('Pilih dulu peserta yang membayar (ketik nama / no. pendaftaran).');
      return;
    }
    const nominalNum = Number(String(nominal).replace(/[^0-9]/g, ''));
    if (!nominalNum || nominalNum < 1) {
      setError('Nominal pembayaran wajib diisi (minimal Rp 1).');
      return;
    }
    if (nominalNum > sisaTagihan) {
      setError(`Nominal melebihi sisa tagihan Rp ${sisaTagihan.toLocaleString('id-ID')}.`);
      return;
    }
    if (tipePembayaran === 'cash' && !namaPenerima.trim()) {
      setError('Nama penerima wajib diisi untuk pembayaran cash.');
      return;
    }
    if (tipePembayaran === 'transfer' && (!namaPengirim.trim() || !jenisPengirim.trim())) {
      setError('Nama pengirim dan jenis pengirim wajib diisi untuk transfer.');
      return;
    }
    if (tipePembayaran === 'transfer' && paymentMethods.length > 0 && !metode) {
      setError('Pilih rekening tujuan untuk pembayaran transfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('nominal', String(nominalNum));
      fd.append('tipe_pembayaran', tipePembayaran);
      fd.append('nama_penerima', namaPenerima);
      fd.append('nama_pengirim', namaPengirim);
      fd.append('jenis_pengirim', jenisPengirim);
      fd.append('payment_method_id', tipePembayaran === 'transfer' ? metode : '');
      fd.append('tanggal_bayar', tanggalBayar);
      fd.append('catatan_admin', catatan);
      if (buktiFile) fd.append('bukti_pembayaran', buktiFile);

      const res = await pembayaranApi.catatManual(selected.id, fd);
      if (!res.success) {
        setError(res.error || 'Gagal mencatat pembayaran manual.');
        return;
      }
      onSuccess();
    } catch {
      setError('Gagal mencatat pembayaran manual. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => { if (!isSubmitting) onClose(); }}>
      <div className="modal-content p-6 md:p-8 animate-scale-in max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Catat Pembayaran Manual</h2>
            <p className="text-xs text-[var(--text-secondary)]">Langsung tercatat diterima & mengurangi sisa tagihan</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--surface)] transition-colors" aria-label="Tutup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 1. Nama peserta: ketik / cari */}
        <div className="mb-5" ref={searchRef}>
          <label className="form-label" htmlFor="manual-nama">
            Nama Peserta <span className="required">*</span>
          </label>
          {selected ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/60">
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 truncate">{selected.nama_lengkap}</div>
                <div className="text-[11px] font-mono text-indigo-700">{selected.no_pendaftaran}</div>
              </div>
              <button type="button" onClick={batalPilih} className="text-xs font-bold text-slate-500 hover:text-rose-600 shrink-0 px-2 py-1">
                Ganti
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                id="manual-nama"
                type="text"
                className="form-input"
                placeholder="Ketik nama, no. pendaftaran, atau NIK..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (hasilCari.length > 0) pilihPeserta(hasilCari[0]);
                  }
                  if (e.key === 'Escape') setDropdownOpen(false);
                }}
                autoComplete="off"
              />
              {dropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                  {hasilCari.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">Tidak ditemukan. Coba kata kunci lain.</div>
                  ) : (
                    hasilCari.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pilihPeserta(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="font-bold text-xs text-slate-900">{p.nama_lengkap}</div>
                        <div className="text-[10px] font-mono text-slate-500">{p.no_pendaftaran} • {p.program?.nama || p.jenis_pelatihan}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="mt-3 p-4 rounded-xl bg-[var(--primary-bg)] border border-[rgba(26,54,93,0.12)] flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Sisa Tagihan</div>
                <div className="text-2xl font-extrabold text-[var(--primary)]">Rp {sisaTagihan.toLocaleString('id-ID')}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Total biaya: Rp {totalBiaya.toLocaleString('id-ID')}</div>
              </div>
              <span className={`badge ${sisaTagihan <= 0 ? 'badge-accepted' : 'badge-pending'}`}>
                {sisaTagihan <= 0 ? 'Lunas' : 'Belum Lunas'}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 2. Nominal */}
          <div>
            <label className="form-label" htmlFor="manual-nominal">
              Nominal Dibayar (Rp) <span className="required">*</span>
            </label>
            <input
              id="manual-nominal"
              type="text"
              inputMode="numeric"
              className="form-input font-bold"
              placeholder={selected ? `Maks. Rp ${sisaTagihan.toLocaleString('id-ID')}` : 'Pilih peserta dulu'}
              value={nominal}
              onChange={(e) => setNominal(e.target.value.replace(/[^0-9]/g, ''))}
              disabled={!selected}
            />
          </div>

          {/* 3. Opsi pembayaran */}
          <div className="space-y-3">
            <label className="form-label">Opsi Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'transfer'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setTipePembayaran(type)} className={`px-3 py-2 rounded-lg border text-xs font-bold capitalize ${tipePembayaran === type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                  {type === 'cash' ? 'Cash / Tunai' : 'Transfer'}
                </button>
              ))}
            </div>
            {tipePembayaran === 'cash' ? (
              <input className="form-input" placeholder="Nama penerima (mis. nama admin) *" value={namaPenerima} onChange={(e) => setNamaPenerima(e.target.value)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className="form-input" placeholder="Nama pengirim *" value={namaPengirim} onChange={(e) => setNamaPengirim(e.target.value)} />
                <input className="form-input" placeholder="Bank / e-wallet pengirim *" value={jenisPengirim} onChange={(e) => setJenisPengirim(e.target.value)} />
              </div>
            )}
          </div>

          {tipePembayaran === 'transfer' && paymentMethods.length > 0 && (
            <div>
              <label className="form-label mb-2">Rekening Tujuan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentMethods.map((m) => (
                  <button type="button" key={m.id} onClick={() => setMetode(m.id)} className={`p-3 rounded-xl border text-left ${metode === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                    <div className="font-bold text-xs">{m.nama_metode}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{m.rekening || m.deskripsi || ''}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label" htmlFor="manual-tanggal">Tanggal Bayar</label>
              <input id="manual-tanggal" type="date" className="form-input" value={tanggalBayar} onChange={(e) => setTanggalBayar(e.target.value)} />
            </div>
            <div>
              <label className="form-label" htmlFor="manual-bukti">Bukti (opsional)</label>
              <input id="manual-bukti" type="file" accept="image/*" onChange={handleFileChange} className="form-input text-xs pt-2" />
            </div>
          </div>
          {buktiPreview && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={buktiPreview} alt="Bukti pembayaran" className="max-h-40 rounded-lg border border-[var(--card-border)] object-contain" />
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="manual-catatan">Catatan Admin (opsional)</label>
            <textarea id="manual-catatan" className="form-input" rows={2} placeholder="cth. Bayar DP di kantor..." value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger-bg)] text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm" disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
