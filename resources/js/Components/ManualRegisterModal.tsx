'use client';

import { useState, useEffect } from 'react';
import { composeAlamat } from '@/lib/storage';
import { pendaftarApi, programsApi } from '@/lib/api';
import type { ProgramPelatihan } from '@/lib/types';
import AlamatForm, { type AlamatData } from '@/Components/AlamatForm';

interface ManualRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualRegisterModal({ isOpen, onClose, onSuccess }: ManualRegisterModalProps) {
  const [programs, setPrograms] = useState<ProgramPelatihan[]>([]);
  const [jenisPelatihan, setJenisPelatihan] = useState<string>('Menjahit');

  useEffect(() => {
    if (isOpen) {
      programsApi.list().then((res) => {
        const data = res.data || [];
        setPrograms(data);
        if (data.length > 0) {
          setJenisPelatihan(data[0].nama);
        } else {
          setJenisPelatihan('Menjahit');
        }
      });
    }
  }, [isOpen]);

  const [namaLengkap, setNamaLengkap] = useState('');
  const [nik, setNik] = useState('');
  const [tempatLahir, setTempatLahir] = useState('Garut');
  const [tanggalLahir, setTanggalLahir] = useState('2001-01-01');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  
  // Alamat breakdown state
  const [alamatState, setAlamatState] = useState<AlamatData>({
    provinsi: '',
    kabupaten_kota: '',
    kecamatan: '',
    desa_kelurahan: '',
    rt: '',
    rw: '',
    detail_alamat: '',
  });

  const [status, setStatus] = useState<'diterima' | 'menunggu'>('diterima');
  const [statusPembayaran, setStatusPembayaran] = useState<'lunas' | 'belum_bayar' | 'cicilan_sebagian'>('lunas');


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaLengkap.trim() || !nik.trim() || !noHp.trim()) {
      setErrorMsg('Nama Lengkap, NIK, dan Nomor HP wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    const selectedProg = programs.find((p) => p.nama === jenisPelatihan);

    const finalAlamat = composeAlamat(alamatState) || 'Garut';

    try {
      await pendaftarApi.create({
        nama_lengkap: namaLengkap,
        nik: nik,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        alamat: finalAlamat,
        tinggi_badan: '165',
        berat_badan: '60',
        lingkar_pinggang: '75',
        no_hp: noHp,
        email: email || `${nik}@lpk.com`,
        jenis_pelatihan: jenisPelatihan || 'Menjahit',
        program_id: selectedProg?.id,
        motivasi: 'Pendaftaran manual oleh Admin.',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
            <h3 className="font-bold text-base">Pendaftaran Peserta Manual</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg font-bold">✕</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Identitas Peserta */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">1. Data Diri Calon Peserta</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Pratama"
                  className="form-input text-xs"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-xs">NIK (KTP) *</label>
                <input
                  type="text"
                  required
                  placeholder="16 Digit NIK"
                  className="form-input text-xs"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Tempat Lahir</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-xs">Tanggal Lahir</label>
                <input
                  type="date"
                  className="form-input text-xs"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Nomor HP / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="08123456789"
                  className="form-input text-xs"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label text-xs">Email</label>
                <input
                  type="email"
                  placeholder="peserta@gmail.com"
                  className="form-input text-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Form Alamat Lengkap Regional */}
            <div className="pt-2">
              <AlamatForm
                data={alamatState}
                onChange={(field, val) => setAlamatState((prev) => ({ ...prev, [field]: val }))}
              />
            </div>
          </div>

          {/* Section 2: Program Pelatihan & Status */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">2. Pelatihan & Status Pendaftaran</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="form-label text-xs">Program Pelatihan</label>
                <select
                  className="form-input text-xs font-semibold text-indigo-900"
                  value={jenisPelatihan}
                  onChange={(e) => setJenisPelatihan(e.target.value)}
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Status Pendaftaran</label>
                <select
                  className="form-input text-xs"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="diterima">✓ Diterima (Langsung Lolos)</option>
                  <option value="menunggu">⏳ Menunggu Validasi</option>
                </select>
              </div>

              <div>
                <label className="form-label text-xs">Status Pembayaran</label>
                <select
                  className="form-input text-xs"
                  value={statusPembayaran}
                  onChange={(e) => setStatusPembayaran(e.target.value as any)}
                >
                  <option value="lunas">🟢 Lunas</option>
                  <option value="cicilan_sebagian">🟡 Cicilan</option>
                  <option value="belum_bayar">🔴 Belum Bayar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs px-4">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs px-5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Mendaftarkan...' : '+ Simpan & Daftarkan Peserta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
