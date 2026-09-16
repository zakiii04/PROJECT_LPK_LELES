'use client';

import { useState, useEffect } from 'react';
import { pembayaranApi, cicilanApi, paymentMethodApi } from '@/lib/api';
import type { Pendaftar, Cicilan, PaymentMethod } from '@/lib/types';

interface PesertaPembayaranModalProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = 'pilih_jenis' | 'bayar_lunas' | 'bayar_cicilan';

export default function PesertaPembayaranModal({
  pendaftar,
  onClose,
  onSuccess,
}: PesertaPembayaranModalProps) {
  const program = pendaftar.program;
  const totalBiaya = program?.harga || pendaftar.biaya_pelatihan || 0;
  const totalFormatted = `Rp ${totalBiaya.toLocaleString('id-ID')}`;

  const getInitialStep = (): ModalStep => {
    if (pendaftar.jenis_pembayaran === 'cicilan') return 'bayar_cicilan';
    if (pendaftar.jenis_pembayaran === 'lunas') return 'bayar_lunas';
    return 'pilih_jenis';
  };

  const [step, setStep] = useState<ModalStep>(getInitialStep());
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [metode, setMetode] = useState('');
  const [tipePembayaran, setTipePembayaran] = useState<'cash' | 'transfer'>('transfer');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [namaPengirim, setNamaPengirim] = useState('');
  const [jenisPengirim, setJenisPengirim] = useState('');
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [jumlahTermin, setJumlahTermin] = useState<2 | 3>(3);
  const [selectedTermin, setSelectedTermin] = useState<number>(1);
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

  // Cicilan data & calculations
  const cicilanList: Cicilan[] = pendaftar.cicilan || [];
  const totalDibayar = cicilanList
    .filter((c) => c.status === 'lunas')
    .reduce((acc, c) => acc + (c.jumlah || 0), 0);
  const sisaPembayaran = Math.max(0, totalBiaya - totalDibayar);
  const progressPersen = totalBiaya > 0 ? Math.round((totalDibayar / totalBiaya) * 100) : 0;
  const payableTermin = cicilanList.find(
    (c) => c.termin === selectedTermin && (c.status === 'belum_bayar' || c.status === 'ditolak')
  );

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

  const handlePilihLunas = async () => {
    setStep('bayar_lunas');
  };

  const handlePilihCicilan = async () => {
    setStep('bayar_cicilan');
  };

  const handleSubmitLunas = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      formData.append('nominal', String(totalBiaya));
      formData.append('nama_penerima', namaPenerima);
      formData.append('nama_pengirim', namaPengirim);
      formData.append('jenis_pengirim', jenisPengirim);
      formData.append('payment_method_id', tipePembayaran === 'transfer' ? metode : '');
      formData.append('jenis_pembayaran', 'lunas');

      await pembayaranApi.uploadBukti(pendaftar.id, formData);
      onSuccess();
    } catch (err: any) {
      setError('Gagal mengirim bukti pembayaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCicilan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const targetCicilan = cicilanList.find((c) => c.termin === selectedTermin);
      if (targetCicilan) {
        const formData = new FormData();
        if (buktiFile) formData.append('bukti_pembayaran', buktiFile);
        formData.append('metode_pembayaran', metode);
        formData.append('tipe_pembayaran', tipePembayaran);
        formData.append('nominal', String(targetCicilan.jumlah));
        formData.append('nama_penerima', namaPenerima);
        formData.append('nama_pengirim', namaPengirim);
        formData.append('jenis_pengirim', jenisPengirim);
        formData.append('payment_method_id', tipePembayaran === 'transfer' ? metode : '');
        await pembayaranApi.uploadBukti(pendaftar.id, formData);
      }
      onSuccess();
    } catch (err: any) {
      setError('Gagal mengirim bukti cicilan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCicilanStatusIcon = (status: Cicilan['status']) => {
    switch (status) {
      case 'lunas': return '✓';
      case 'menunggu_konfirmasi': return '⏳';
      case 'ditolak': return '✕';
      default: return '○';
    }
  };

  const getCicilanStatusColor = (status: Cicilan['status']) => {
    switch (status) {
      case 'lunas': return 'bg-emerald-500 text-white border-emerald-500';
      case 'menunggu_konfirmasi': return 'bg-amber-400 text-white border-amber-400';
      case 'ditolak': return 'bg-red-500 text-white border-red-500';
      default: return 'bg-white text-slate-400 border-slate-300';
    }
  };

  const getCicilanStatusLabel = (status: Cicilan['status']) => {
    switch (status) {
      case 'lunas': return 'Diverifikasi';
      case 'menunggu_konfirmasi': return 'Menunggu Verifikasi';
      case 'ditolak': return 'Ditolak';
      default: return 'Belum Dibayar';
    }
  };

  const metodePembayaranOptions = paymentMethods.map((method) => ({
    id: method.id,
    name: method.nama_metode,
    account: method.rekening || method.deskripsi || 'Metode pembayaran aktif',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  }));

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 md:p-8 animate-scale-in max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {step === 'pilih_jenis' ? 'Pilih Metode Pembayaran' : 'Pembayaran Pelatihan'}
            </h2>
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

        {/* STEP 1: PILIH JENIS PEMBAYARAN */}
        {step === 'pilih_jenis' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[var(--primary-bg)] border border-[rgba(26,54,93,0.12)] flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Total Biaya Pelatihan</div>
                <div className="text-2xl font-extrabold text-[var(--primary)]">{totalFormatted}</div>
              </div>
              <span className="badge badge-pending">Menunggu Pembayaran</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handlePilihLunas}
                className="p-5 rounded-xl border-2 border-[var(--card-border)] bg-white hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg mb-3 group-hover:bg-emerald-200 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">Bayar Lunas</h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  Bayar penuh seluruh biaya pelatihan dalam satu kali pembayaran.
                </p>
                <div className="text-sm font-extrabold text-emerald-600">{totalFormatted}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Pembayaran sekali penuh</div>
              </button>

              <button
                onClick={handlePilihCicilan}
                className="p-5 rounded-xl border-2 border-[var(--card-border)] bg-white hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg mb-3 group-hover:bg-indigo-200 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">Cicilan 3x</h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  Bayar biaya pelatihan secara bertahap dalam 3 kali angsuran.
                </p>
                <div className="text-sm font-extrabold text-indigo-600">
                  3x Rp {Math.ceil(totalBiaya / 3).toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Jatuh tempo setiap 30 hari</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2A: BAYAR LUNAS */}
        {step === 'bayar_lunas' && (
          <>
            <div className="p-4 rounded-xl bg-[var(--primary-bg)] border border-[rgba(26,54,93,0.12)] mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Total Biaya Pelatihan</div>
                <div className="text-2xl font-extrabold text-[var(--primary)]">{totalFormatted}</div>
              </div>
              <span className="badge badge-pending">Pembayaran Lunas</span>
            </div>

            <form onSubmit={handleSubmitLunas} className="space-y-5">
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
                    
                    <input className="form-input" placeholder="Asal bank" value={jenisPengirim} onChange={(e) => setJenisPengirim(e.target.value)} />
                  </div>
                )}
              </div>

              {tipePembayaran === 'transfer' && (
              <div>
                <label className="form-label mb-2">Pilih Rekening Tujuan</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {metodePembayaranOptions.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setMetode(m.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        metode === m.id
                          ? 'border-[var(--primary)] bg-[var(--primary-bg)] shadow-sm'
                          : 'border-[var(--card-border)] bg-white hover:border-[var(--input-border)]'
                      }`}
                    >
                      <div className="text-lg mb-1">{m.icon}</div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{m.name}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">{m.account}</div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {tipePembayaran === 'transfer' && <div>
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
              </div>}

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
          </>
        )}

        {/* STEP 2B: CICILAN 3x */}
        {step === 'bayar_cicilan' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200/50">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">Total Biaya</div>
                  <div className="text-xl font-extrabold text-[var(--primary)]">{totalFormatted}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--text-secondary)]">Sudah Dibayar</div>
                  <div className="text-xl font-extrabold text-emerald-600">
                    Rp {totalDibayar.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden border border-indigo-100">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPersen}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-semibold">
                <span className="text-indigo-600">{progressPersen}% Terbayar</span>
                <span className="text-[var(--text-tertiary)]">
                  Sisa: Rp {sisaPembayaran.toLocaleString('id-ID')}
                </span>
              </div>
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

            <div className="space-y-0">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Timeline Pembayaran Cicilan
              </div>
              {cicilanList.map((c, idx) => {
                const isPayable = (c.status === 'belum_bayar' || c.status === 'ditolak');
                const isSelected = selectedTermin === c.termin && isPayable;

                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${getCicilanStatusColor(c.status)}`}>
                        {getCicilanStatusIcon(c.status)}
                      </div>
                      {idx < cicilanList.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-[24px] ${c.status === 'lunas' ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                      )}
                    </div>

                    <div className={`flex-1 pb-4 ${idx < cicilanList.length - 1 ? 'border-b border-transparent' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          Cicilan {c.termin}
                        </h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          c.status === 'lunas' ? 'bg-emerald-100 text-emerald-700'
                          : c.status === 'menunggu_konfirmasi' ? 'bg-amber-100 text-amber-700'
                          : c.status === 'ditolak' ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                          {getCicilanStatusLabel(c.status)}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                        <div>Nominal: <span className="font-bold text-[var(--text-primary)]">Rp {c.jumlah.toLocaleString('id-ID')}</span></div>
                        <div>Jatuh tempo: {new Date(c.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        {c.tanggal_bayar && (
                          <div className="text-[10px]">Dibayar: {new Date(c.tanggal_bayar).toLocaleString('id-ID')}</div>
                        )}
                        {c.catatan_admin && (
                          <div className="mt-1 p-2 rounded bg-red-50 text-red-700 text-[10px] border border-red-200">
                            <span className="font-bold">Catatan Admin:</span> {c.catatan_admin}
                          </div>
                        )}
                      </div>

                      {isPayable && (
                        <button
                          onClick={() => { setSelectedTermin(c.termin as 1 | 2 | 3); setBuktiPreview(null); setError(''); }}
                          className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {c.status === 'ditolak' ? 'Upload Ulang Bukti' : 'Bayar Cicilan Ini'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {payableTermin && (
              <form onSubmit={handleSubmitCicilan} className="space-y-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Upload Bukti Cicilan {selectedTermin} — Rp {payableTermin.jumlah.toLocaleString('id-ID')}
                  </h4>
                </div>

                <div className="space-y-2">
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

                {tipePembayaran === 'transfer' && <div>
                  <label className="form-label mb-2">Rekening Tujuan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {metodePembayaranOptions.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setMetode(m.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-center ${
                          metode === m.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-[var(--card-border)] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="text-base mb-0.5">{m.icon}</div>
                        <div className="font-bold text-[10px] text-[var(--text-primary)]">{m.name}</div>
                      </div>
                    ))}
                  </div>
                </div>}

                {tipePembayaran === 'transfer' && <div>
                  <label className="form-label">Bukti Transfer <span className="required">*</span></label>
                  <div className="mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--input-border)] rounded-xl bg-white text-center cursor-pointer hover:bg-slate-50 transition-colors relative">
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
                          className="max-h-32 mx-auto rounded-lg shadow-sm border border-[var(--card-border)]"
                        />
                        <p className="text-[10px] text-indigo-600 font-semibold">Ganti file</p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">Upload bukti transfer</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">Maks. 5 MB</p>
                      </div>
                    )}
                  </div>
                </div>}

                {error && (
                  <div className="p-3 rounded-lg bg-[var(--danger-bg)] text-xs text-[var(--danger)]">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--card-border)]">
                  <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                    Tutup
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Mengirim...' : `Kirim Bukti Cicilan ${selectedTermin}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
