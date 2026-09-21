'use client';

import { useState, useEffect } from 'react';
import { pembayaranApi, paymentMethodApi } from '@/lib/api';
import type { Pendaftar, PaymentMethod } from '@/lib/types';
import TenggatBanner from '@/Components/TenggatBanner';

interface PesertaPembayaranModalProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Form pembayaran peserta: nominal bebas sesuai yang mau dibayar
 * (maksimal sisa tagihan) + bukti. Tanpa skema cicilan termin.
 */
export default function PesertaPembayaranModal({
  pendaftar,
  onClose,
  onSuccess,
}: PesertaPembayaranModalProps) {
  const program = pendaftar.program;
  const totalBiaya = program?.harga || pendaftar.biaya_pelatihan || 0;
  const sisaTagihan = Math.max(0, Number(pendaftar.tagihan?.nominal ?? totalBiaya));

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [metode, setMetode] = useState('');
  const [tipePembayaran, setTipePembayaran] = useState<'cash' | 'transfer'>('transfer');
  const [nominal, setNominal] = useState<string>(sisaTagihan > 0 ? String(Math.round(sisaTagihan)) : '');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [namaPengirim, setNamaPengirim] = useState('');
  const [jenisPengirim, setJenisPengirim] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetTransactionFields = () => {
    setBuktiFile(null);
    setBuktiPreview(null);
    setNamaPenerima('');
    setNamaPengirim('');
    setJenisPengirim('');
    setError('');
  };

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const res = await paymentMethodApi.list();
        const activeMethods = (res.data || []).filter((method) => method.is_active);
        setPaymentMethods(activeMethods);
        if (activeMethods.length > 0) {
          setMetode(activeMethods[0].id);
        }
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      }
    };

    loadPaymentMethods();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBuktiFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuktiPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const metodePembayaranOptions = paymentMethods.map((method) => ({
    id: method.id,
    name: method.nama_metode,
    account: method.rekening || method.deskripsi || 'Metode pembayaran aktif',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
    if (tipePembayaran === 'transfer' && (!namaPengirim.trim() || !jenisPengirim.trim() || !buktiFile)) {
      setError('Nama pengirim, jenis pengirim, dan bukti transfer wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (buktiFile) {
        formData.append('bukti_pembayaran', buktiFile);
      }
      formData.append('metode_pembayaran', metode);
      formData.append('tipe_pembayaran', tipePembayaran);
      formData.append('nominal', String(nominalNum));
      formData.append('nama_penerima', namaPenerima);
      formData.append('nama_pengirim', namaPengirim);
      formData.append('jenis_pengirim', jenisPengirim);
      formData.append('payment_method_id', tipePembayaran === 'transfer' ? metode : '');

      await pembayaranApi.uploadBukti(pendaftar.id, formData);
      onSuccess();
    } catch (err: any) {
      setError('Gagal mengirim bukti pembayaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const riwayat = (pendaftar.tagihan?.pembayarans || []).slice().reverse();

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 md:p-8 animate-scale-in max-w-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Pembayaran Pelatihan</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {program?.nama || pendaftar.jenis_pelatihan} • {pendaftar.no_pendaftaran}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--surface)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <TenggatBanner pendaftarId={pendaftar.id} />

          <div className="p-4 rounded-xl bg-[var(--primary-bg)] border border-[rgba(26,54,93,0.12)] flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Sisa Tagihan</div>
              <div className="text-2xl font-extrabold text-[var(--primary)]">Rp {sisaTagihan.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Total biaya: Rp {totalBiaya.toLocaleString('id-ID')}</div>
            </div>
            <span className="badge badge-pending">Belum Lunas</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label" htmlFor="nominal_bayar">
                Nominal yang Mau Dibayar (Rp) <span className="required">*</span>
              </label>
              <input
                id="nominal_bayar"
                type="text"
                inputMode="numeric"
                className="form-input font-bold"
                placeholder={`Maks. Rp ${sisaTagihan.toLocaleString('id-ID')}`}
                value={nominal}
                onChange={(e) => setNominal(e.target.value.replace(/[^0-9]/g, ''))}
              />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                Boleh dibayar sebagian dulu; sisa tagihan otomatis berkurang setelah divalidasi admin.
              </p>
            </div>

            <div className="space-y-3">
              <label className="form-label">Tipe Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'transfer'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => { setTipePembayaran(type); resetTransactionFields(); }} className={`px-3 py-2 rounded-lg border text-xs font-bold capitalize ${tipePembayaran === type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                    {type}
                  </button>
                ))}
              </div>
              {tipePembayaran === 'cash' ? (
                <input className="form-input" placeholder="Nama penerima pembayaran" value={namaPenerima} onChange={(e) => setNamaPenerima(e.target.value)} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="form-input" placeholder="Nama pengirim" value={namaPengirim} onChange={(e) => setNamaPengirim(e.target.value)} />
                  <input className="form-input" placeholder="Jenis pengirim (Pribadi/Instansi)" value={jenisPengirim} onChange={(e) => setJenisPengirim(e.target.value)} />
                </div>
              )}
            </div>

            {tipePembayaran === 'transfer' && (
              <div>
                <label className="form-label mb-2">Pilih Rekening Tujuan</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {metodePembayaranOptions.map((m) => (
                    <button type="button" key={m.id} onClick={() => setMetode(m.id)} className={`p-3 rounded-xl border text-left ${metode === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                      <div className="font-bold text-xs">{m.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{m.account}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tipePembayaran === 'transfer' && (
              <div>
                <label className="form-label">Unggah Bukti Transfer <span className="required">*</span></label>
                <div className="mt-1 flex flex-col items-center justify-center p-5 border-2 border-dashed border-[var(--input-border)] rounded-xl bg-[var(--surface)] text-center cursor-pointer hover:bg-[var(--card-bg)] transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {buktiPreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buktiPreview}
                        alt="Bukti Transfer"
                        className="max-h-40 mx-auto rounded-lg shadow-sm border border-[var(--card-border)]"
                      />
                      <p className="text-xs text-[var(--accent)] font-semibold">Ganti file bukti transfer</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-10 h-10 mx-auto text-[var(--text-tertiary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Klik untuk upload foto / screenshot bukti transfer</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">PNG, JPG, JPEG (Maks. 5 MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger-bg)] text-xs text-[var(--danger)]">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
              <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                Batal
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
              </button>
            </div>
          </form>

          {riwayat.length > 0 && (
            <div className="space-y-2 border-t border-[var(--card-border)] pt-4">
              <div className="text-xs font-bold text-[var(--text-primary)]">Riwayat Pembayaran</div>
              {riwayat.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-lg bg-slate-50">
                  <span>
                    <span className="font-semibold capitalize">{payment.tipe_pembayaran}</span>
                    {' • Rp '}{Number(payment.nominal).toLocaleString('id-ID')}
                    <span className="block text-[10px] text-slate-400">
                      {payment.tanggal_bayar ? new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </span>
                  <span className={payment.status === 'diterima' ? 'text-emerald-600 font-bold' : payment.status === 'ditolak' ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                    {payment.status === 'diterima' ? 'Diterima' : payment.status === 'ditolak' ? 'Ditolak' : 'Menunggu Validasi'}
                  </span>
                </div>
              ))}
              {riwayat.some((r) => r.status === 'ditolak' && r.catatan_admin) && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700">
                  <span className="font-bold">Catatan Admin:</span>{' '}
                  {riwayat.filter((r) => r.status === 'ditolak' && r.catatan_admin).map((r) => r.catatan_admin).join(' • ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
