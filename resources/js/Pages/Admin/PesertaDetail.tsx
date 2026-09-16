'use client';

import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import VerifikasiPesertaModal, { LIST_BERKAS_PERSYARATAN } from '@/Components/VerifikasiPesertaModal';
import { getStatusLabel, getStatusBadgeClass, composeAlamat, parseAlamat } from '@/lib/storage';
import { pendaftarApi, angkatanApi, programsApi, pembayaranApi } from '@/lib/api';
import type { Pendaftar, Angkatan, ProgramPelatihan, PendaftarStatus, StatusPembayaran } from '@/lib/types';
import AlamatForm, { type AlamatData } from '@/Components/AlamatForm';

interface PesertaDetailPageProps {
  id: string;
  initialPendaftar?: Pendaftar | null;
  initialAngkatanList?: Angkatan[];
  initialProgramList?: ProgramPelatihan[];
}

export default function PesertaDetailPage({ id, initialPendaftar, initialAngkatanList, initialProgramList }: PesertaDetailPageProps) {
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(initialPendaftar || null);
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>(initialAngkatanList || []);
  const [programList, setProgramList] = useState<ProgramPelatihan[]>(initialProgramList || []);
  const [loading, setLoading] = useState(!initialPendaftar);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVerifikasiModal, setShowVerifikasiModal] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form edit state
  const [formData, setFormData] = useState<{
    nama_lengkap: string;
    nik: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    alamat: string;
    tinggi_badan: string;
    berat_badan: string;
    lingkar_pinggang: string;
    riwayat_penyakit: string;
    no_hp: string;
    email: string;
    jenjang_pendidikan: string;
    asal_sekolah: string;
    tahun_lulus: string;
    jenis_pelatihan: string;
    program_id: string;
    angkatan_id: string;
    status: PendaftarStatus;
    status_pembayaran: StatusPembayaran;
  }>({
    nama_lengkap: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    tinggi_badan: '',
    berat_badan: '',
    lingkar_pinggang: '',
    riwayat_penyakit: '',
    no_hp: '',
    email: '',
    jenjang_pendidikan: '',
    asal_sekolah: '',
    tahun_lulus: '',
    jenis_pelatihan: '',
    program_id: '',
    angkatan_id: '',
    status: 'menunggu',
    status_pembayaran: 'belum_bayar',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes, progRes] = await Promise.all([
        pendaftarApi.show(id),
        angkatanApi.list(),
        programsApi.list(),
      ]);

      if (pRes.success && pRes.data) {
        const p = pRes.data;
        setPendaftar(p);
        setAlamatState({
          ...parseAlamat(p.alamat),
          provinsi: p.provinsi || parseAlamat(p.alamat).provinsi || '',
          kabupaten_kota: p.kabupaten_kota || parseAlamat(p.alamat).kabupaten_kota || '',
          kecamatan: p.kecamatan || parseAlamat(p.alamat).kecamatan || '',
          desa_kelurahan: p.desa_kelurahan || parseAlamat(p.alamat).desa_kelurahan || '',
        });
        setFormData({
          nama_lengkap: p.nama_lengkap || '',
          nik: p.nik || '',
          tempat_lahir: p.tempat_lahir || '',
          tanggal_lahir: p.tanggal_lahir ? p.tanggal_lahir.split('T')[0] : '',
          alamat: p.alamat || '',
          tinggi_badan: p.tinggi_badan || '',
          berat_badan: p.berat_badan || '',
          lingkar_pinggang: p.lingkar_pinggang || '',
          riwayat_penyakit: p.riwayat_penyakit || '',
          no_hp: p.no_hp || '',
          email: p.email || '',
          jenjang_pendidikan: p.jenjang_pendidikan || '',
          asal_sekolah: p.asal_sekolah || '',
          tahun_lulus: p.tahun_lulus ? String(p.tahun_lulus) : '',
          jenis_pelatihan: p.jenis_pelatihan || p.program?.nama || '',
          program_id: p.program_id || p.program?.id || '',
          angkatan_id: p.angkatan_id || '',
          status: p.status || 'menunggu',
          status_pembayaran: p.status_pembayaran || 'belum_bayar',
        });
      }
      if (aRes.success && aRes.data) {
        setAngkatanList(aRes.data);
      }
      if (progRes.success && progRes.data) {
        setProgramList(progRes.data);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal memuat data peserta.' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (initialPendaftar) {
      setPendaftar(initialPendaftar);
      setAlamatState({
        ...parseAlamat(initialPendaftar.alamat),
        provinsi: initialPendaftar.provinsi || parseAlamat(initialPendaftar.alamat).provinsi || '',
        kabupaten_kota: initialPendaftar.kabupaten_kota || parseAlamat(initialPendaftar.alamat).kabupaten_kota || '',
        kecamatan: initialPendaftar.kecamatan || parseAlamat(initialPendaftar.alamat).kecamatan || '',
        desa_kelurahan: initialPendaftar.desa_kelurahan || parseAlamat(initialPendaftar.alamat).desa_kelurahan || '',
      });
      setFormData({
        nama_lengkap: initialPendaftar.nama_lengkap || '',
        nik: initialPendaftar.nik || '',
        tempat_lahir: initialPendaftar.tempat_lahir || '',
        tanggal_lahir: initialPendaftar.tanggal_lahir || '',
        alamat: initialPendaftar.alamat || '',
        tinggi_badan: String(initialPendaftar.tinggi_badan || ''),
        berat_badan: String(initialPendaftar.berat_badan || ''),
        lingkar_pinggang: String(initialPendaftar.lingkar_pinggang || ''),
        riwayat_penyakit: initialPendaftar.riwayat_penyakit || '',
        no_hp: initialPendaftar.no_hp || '',
        email: initialPendaftar.email || '',
        jenjang_pendidikan: initialPendaftar.jenjang_pendidikan || '',
        asal_sekolah: initialPendaftar.asal_sekolah || '',
        tahun_lulus: initialPendaftar.tahun_lulus ? String(initialPendaftar.tahun_lulus) : '',
        jenis_pelatihan: initialPendaftar.jenis_pelatihan || '',
        program_id: initialPendaftar.program_id || '',
        angkatan_id: initialPendaftar.angkatan_id || '',
        status: initialPendaftar.status || 'menunggu',
        status_pembayaran: initialPendaftar.status_pembayaran || 'belum_bayar',
      });
      setLoading(false);
    } else {
      loadData();
    }
  }, [initialPendaftar, loadData]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Alamat state for structured editing
  const [alamatState, setAlamatState] = useState<AlamatData>({
    provinsi: '',
    kabupaten_kota: '',
    kecamatan: '',
    desa_kelurahan: '',
    rt: '',
    rw: '',
    detail_alamat: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalAlamat = composeAlamat(alamatState) || formData.alamat;

      // 1. Update data pendaftar (data diri, fisik, kontak)
      const res = await pendaftarApi.update(id, {
        nama_lengkap: formData.nama_lengkap,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        alamat: finalAlamat,
        provinsi: alamatState.provinsi,
        kabupaten_kota: alamatState.kabupaten_kota,
        kecamatan: alamatState.kecamatan,
        desa_kelurahan: alamatState.desa_kelurahan,
        tinggi_badan: formData.tinggi_badan,
        berat_badan: formData.berat_badan,
        lingkar_pinggang: formData.lingkar_pinggang,
        riwayat_penyakit: formData.riwayat_penyakit,
        no_hp: formData.no_hp,
        email: formData.email,
        jenjang_pendidikan: formData.jenjang_pendidikan || undefined,
        asal_sekolah: formData.asal_sekolah || undefined,
        tahun_lulus: formData.tahun_lulus ? Number(formData.tahun_lulus) : undefined,
        jenis_pelatihan: formData.jenis_pelatihan,
        program_id: formData.program_id || undefined,
      });

      if (!res.success) {
        showToast('error', res.error || 'Gagal memperbarui data.');
        return;
      }

      // Perubahan status dan angkatan hanya dijalankan setelah data utama berhasil disimpan.
      // Dengan demikian peserta berstatus "menunggu" tetap dapat diedit tanpa verifikasi.
      if (pendaftar && pendaftar.status !== formData.status) {
        await pendaftarApi.updateStatus(id, formData.status);
      }
      if (pendaftar && pendaftar.angkatan_id !== formData.angkatan_id && formData.angkatan_id) {
        await pendaftarApi.alokasiAngkatan(id, formData.angkatan_id);
      }

      showToast('success', 'Data peserta berhasil diperbarui!');
      setIsEditing(false);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Apakah Anda yakin ingin menolak pendaftaran peserta ini?')) return;
    try {
      await pendaftarApi.updateStatus(id, 'ditolak');
      showToast('success', 'Status pendaftar diubah menjadi Ditolak.');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status.');
    }
  };

  const handleVerifikasiPembayaran = async () => {
    try {
      await pembayaranApi.verifikasi(id);
      showToast('success', 'Status pembayaran dikonfirmasi Lunas.');
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memverifikasi pembayaran.');
    }
  };

  // BMI Calculation
  const heightM = Number(formData.tinggi_badan) / 100;
  const bmiVal = heightM > 0 && Number(formData.berat_badan) > 0
    ? (Number(formData.berat_badan) / (heightM * heightM)).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Memuat Detail Peserta...</span>
        </div>
      </div>
    );
  }

  if (!pendaftar) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Peserta Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 mb-6">Data peserta yang Anda cari mungkin telah dihapus atau ID salah.</p>
          <button
            onClick={() => router.visit('/admin/dashboard')}
            className="btn btn-primary text-xs font-semibold px-5"
          >
            ← Kembali ke Dashboard Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <Navbar />

      {saving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-2xl border border-slate-200">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-900">Menyimpan perubahan...</p>
              <p className="text-xs text-slate-500">Data peserta sedang diperbarui.</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => router.visit('/admin/dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Kembali ke Dashboard Admin</span>
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{pendaftar.nama_lengkap}</h1>
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-md">
                  {pendaftar.no_pendaftaran}
                </span>
                <span className={getStatusBadgeClass(pendaftar.status)}>
                  {getStatusLabel(pendaftar.status)}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Terdaftar pada: {new Date(pendaftar.tanggal_daftar).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
              </p>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`btn btn-sm text-xs font-semibold flex items-center gap-1.5 px-4 ${
                  isEditing ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>{isEditing ? 'Batal Edit' : 'Edit Data Peserta'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVerifikasiModal(true)}
                className="btn btn-sm text-xs font-semibold flex items-center gap-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{pendaftar.status === 'diterima' ? 'Edit Verifikasi & Fisik' : 'Verifikasi & Terima Peserta'}</span>
              </button>

              {pendaftar.status !== 'ditolak' && (
                <button
                  type="button"
                  onClick={handleReject}
                  className="btn btn-sm text-xs font-semibold flex items-center gap-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="8" />
                    <line x1="8" y1="8" x2="16" y2="16" />
                  </svg>
                  <span>Tolak</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: OVERVIEW STATUS & ANGATAN */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
              <div className="w-2 h-4 rounded-full bg-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Status Validasi, Pembayaran & Alokasi Angkatan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Program Pelatihan *
                </label>
                {isEditing ? (
                  <select
                    className="form-input text-xs font-bold w-full"
                    value={formData.program_id || ''}
                    onChange={(e) => {
                      const selectedProg = programList.find(p => p.id === e.target.value);
                      handleInputChange('program_id', e.target.value);
                      if (selectedProg) {
                        handleInputChange('jenis_pelatihan', selectedProg.nama);
                      }
                    }}
                  >
                    <option value="">-- Pilih Program Pelatihan --</option>
                    {programList.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.nama} ({prog.durasi})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm font-extrabold text-indigo-700 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                    {pendaftar.program?.nama || pendaftar.jenis_pelatihan || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Status Validasi Peserta
                </label>
                {isEditing ? (
                  <select
                    className="form-input text-xs font-bold"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="menunggu">Menunggu Validasi</option>
                    <option value="diterima">Diterima</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                ) : (
                  <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                    <span className={getStatusBadgeClass(pendaftar.status)}>{getStatusLabel(pendaftar.status)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Status Pembayaran
                </label>
                <div className="text-sm font-bold text-slate-800">
                  {pendaftar.status_pembayaran === 'lunas' ? (
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-bold">
                      LUNAS
                    </span>
                  ) : pendaftar.status_pembayaran === 'menunggu_konfirmasi' ? (
                    <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-xs font-bold">
                      MENUNGGU VERIFIKASI
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-xs font-bold">
                      BELUM BAYAR
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Alokasi Angkatan Pelatihan
                </label>
                {isEditing ? (
                  <select
                    className="form-input text-xs font-semibold"
                    value={formData.angkatan_id}
                    onChange={(e) => handleInputChange('angkatan_id', e.target.value)}
                  >
                    <option value="">-- Belum Masuk Angkatan --</option>
                    {angkatanList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nama_angkatan} ({a.periode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm font-semibold text-slate-900">
                    {pendaftar.angkatan?.nama_angkatan || (pendaftar.angkatan_id ? 'Sudah Di alokasikan' : 'Belum Ditentukan')}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Biaya Pelatihan
                </label>
                <div className="text-sm font-extrabold text-indigo-700">
                  {pendaftar.biaya_pelatihan
                    ? `Rp ${pendaftar.biaya_pelatihan.toLocaleString('id-ID')}`
                    : (pendaftar.program?.harga_formatted || (pendaftar.program?.harga ? `Rp ${pendaftar.program.harga.toLocaleString('id-ID')}` : '-'))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DATA DIRI & AKUN */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full bg-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  2. Data Diri & Akun Login
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Lengkap Peserta *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                  />
                ) : (
                  <div className="text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.nama_lengkap}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Nomor Induk Kependudukan (NIK) *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => handleInputChange('nik', e.target.value)}
                    className="form-input text-xs font-mono font-medium w-full"
                  />
                ) : (
                  <div className="text-sm font-mono font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.nik}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Tempat Lahir
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.tempat_lahir}
                    onChange={(e) => handleInputChange('tempat_lahir', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                  />
                ) : (
                  <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.tempat_lahir}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Tanggal Lahir
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                  />
                ) : (
                  <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.tanggal_lahir
                      ? new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Username / Email Login Peserta
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span>{pendaftar.user?.username || pendaftar.email}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      Password Default: password
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t pt-4 border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="form-label block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Alamat Lengkap & Rincian Wilayah
                  </label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Rincian Alamat
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <AlamatForm
                    data={alamatState}
                    onChange={(field, val) => setAlamatState((prev) => ({ ...prev, [field]: val }))}
                  />
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Provinsi</div>
                        <div className="text-xs font-semibold text-slate-800">{alamatState.provinsi || '-'}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kecamatan</div>
                        <div className="text-xs font-semibold text-slate-800">{alamatState.kecamatan || '-'}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kabupaten / Kota</div>
                        <div className="text-xs font-semibold text-slate-800">{alamatState.kabupaten_kota || '-'}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desa / Kelurahan</div>
                        <div className="text-xs font-semibold text-slate-800">{alamatState.desa_kelurahan || '-'}</div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 sm:col-span-2 md:col-span-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detail Jalan / Nomor</div>
                        <div className="text-xs font-semibold text-slate-800">{alamatState.detail_alamat || pendaftar.alamat || '-'}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 border-t pt-2.5 border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700">Teks Alamat Lengkap:</span>
                      <span className="font-semibold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">{pendaftar.alamat}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: DATA FISIK & KESEHATAN */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full bg-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  3. Data Fisik & Kesehatan Peserta
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifikasiModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Cek Ulang & Verifikasi Fisik
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Tinggi Badan (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.tinggi_badan}
                    onChange={(e) => handleInputChange('tinggi_badan', e.target.value)}
                    className="form-input text-xs font-bold w-full"
                  />
                ) : (
                  <div className="text-sm font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.tinggi_badan} cm
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Berat Badan (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.berat_badan}
                    onChange={(e) => handleInputChange('berat_badan', e.target.value)}
                    className="form-input text-xs font-bold w-full"
                  />
                ) : (
                  <div className="text-sm font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.berat_badan} kg
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Lingkar Pinggang (cm)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lingkar_pinggang}
                    onChange={(e) => handleInputChange('lingkar_pinggang', e.target.value)}
                    className="form-input text-xs font-bold w-full"
                  />
                ) : (
                  <div className="text-sm font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.lingkar_pinggang ? `${pendaftar.lingkar_pinggang} cm` : '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Body Mass Index (BMI)
                </label>
                <div className="text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>{bmiVal ? `${bmiVal} kg/m²` : '-'}</span>
                  {bmiVal && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {Number(bmiVal) < 18.5 ? 'Kurus' : Number(bmiVal) < 25 ? 'Normal / Ideal' : Number(bmiVal) < 30 ? 'Kelebihan Berat' : 'Obesitas'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Riwayat Penyakit
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.riwayat_penyakit}
                    onChange={(e) => handleInputChange('riwayat_penyakit', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                    placeholder="Tidak ada / Tuliskan riwayat jika ada"
                  />
                ) : (
                  <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.riwayat_penyakit || 'Tidak ada'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: BERKAS PERSYARATAN TERVERIFIKASI */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full bg-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  4. Checklist Berkas Persyaratan Fisik Peserta
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifikasiModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Ubah Checklist Berkas
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {LIST_BERKAS_PERSYARATAN.map((item) => {
                const isChecked = Array.isArray(pendaftar.berkas_verifikasi) && pendaftar.berkas_verifikasi.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    <span className="text-xs truncate pr-2">
                      {item.label}
                      {item.required && <span className="text-rose-500 font-bold ml-1">*</span>}
                    </span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isChecked ? '✓' : '✕'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: INFORMASI PRIBADI */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
              <div className="w-2 h-4 rounded-full bg-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                5. Informasi Pribadi
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Nomor HP / WhatsApp Peserta *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={formData.no_hp}
                    onChange={(e) => handleInputChange('no_hp', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                  />
                ) : (
                  <div className="text-sm font-bold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.no_hp}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Peserta
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="form-input text-xs font-medium w-full"
                  />
                ) : (
                  <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.email}
                  </div>
                )}
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">Jenjang Pendidikan</label>
                {isEditing ? (
                  <select value={formData.jenjang_pendidikan} onChange={(e) => handleInputChange('jenjang_pendidikan', e.target.value)} className="form-input text-xs font-medium w-full">
                    <option value="">Belum diisi</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SMA/SMK/MA">SMA/SMK/MA</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Sarjana (S1)">Sarjana (S1)</option>
                    <option value="Magister (S2)">Magister (S2)</option>
                  </select>
                ) : <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{pendaftar.jenjang_pendidikan || '-'}</div>}
              </div>
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">Asal Sekolah</label>
                {isEditing ? (
                  <input type="text" value={formData.asal_sekolah} onChange={(e) => handleInputChange('asal_sekolah', e.target.value)} className="form-input text-xs font-medium w-full" placeholder="Nama sekolah" />
                ) : <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{pendaftar.asal_sekolah || '-'}</div>}
              </div>
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">Tahun Lulus</label>
                {isEditing ? (
                  <input type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.tahun_lulus} onChange={(e) => handleInputChange('tahun_lulus', e.target.value)} className="form-input text-xs font-medium w-full" placeholder="Contoh: 2024" />
                ) : <div className="text-sm text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{pendaftar.tahun_lulus || '-'}</div>}
              </div>
            </div>
          </div>

          {/* SECTION 6: PROGRAM & MOTIVASI */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
              <div className="w-2 h-4 rounded-full bg-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                6. Program Pelatihan & Motivasi
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Program Pelatihan Pilihan
                </label>
                {isEditing ? (
                  <select
                    className="form-input text-xs font-semibold text-indigo-900 w-full"
                    value={formData.jenis_pelatihan}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleInputChange('jenis_pelatihan', val);
                      const found = programList.find((prog) => prog.nama === val);
                      if (found) handleInputChange('program_id', found.id);
                    }}
                  >
                    {programList.map((prog) => (
                      <option key={prog.id} value={prog.nama}>
                        {prog.nama} ({prog.durasi})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm font-bold text-indigo-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {pendaftar.program?.nama || (pendaftar.jenis_pelatihan === 'Bahasa Jepang' ? 'Menjahit' : pendaftar.jenis_pelatihan)}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Durasi Pelatihan
                </label>
                <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {pendaftar.program?.durasi || '3 Bulan'}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
                  Motivasi Bergabung Peserta
                </label>
                <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {pendaftar.motivasi}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: INFORMASI BUKTI PEMBAYARAN */}
          {pendaftar.status === 'diterima' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
                <div className="w-2 h-4 rounded-full bg-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  7. Bukti & Verifikasi Pembayaran
                </h2>
              </div>

              {pendaftar.bukti_pembayaran ? (
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-600">
                    Metode: <strong className="text-slate-900">{pendaftar.metode_pembayaran || 'Transfer Bank'}</strong> • Waktu Upload: {new Date(pendaftar.tanggal_bayar || '').toLocaleString('id-ID')}
                  </div>
                  <img
                    src={pendaftar.bukti_pembayaran}
                    alt="Bukti Pembayaran"
                    className="max-h-72 rounded-xl border border-slate-200 mx-auto bg-white p-2 shadow-xs"
                  />
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200">
                  Peserta belum mengunggah bukti pembayaran fisik/transfer.
                </div>
              )}

              {pendaftar.status_pembayaran !== 'lunas' && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleVerifikasiPembayaran}
                    className="btn btn-accent btn-sm font-semibold flex items-center gap-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Konfirmasi & Tandai Pembayaran LUNAS</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Save Bar when editing */}
          {isEditing && (
            <div className="sticky bottom-6 z-40 bg-indigo-950 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-indigo-800 animate-slide-up">
              <div className="text-xs font-semibold">
                Anda sedang dalam mode pengeditan data peserta. Klik simpan untuk menerapkan perubahan.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary text-xs px-4 bg-white/10 hover:bg-white/20 text-white border-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-accent text-xs font-bold px-6 bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan Data'}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Verification Modal Popup */}
      {showVerifikasiModal && (
        <VerifikasiPesertaModal
          pendaftar={pendaftar}
          onClose={() => setShowVerifikasiModal(false)}
          onSuccess={() => {
            setShowVerifikasiModal(false);
            showToast('success', 'Data verifikasi peserta berhasil disimpan.');
            loadData();
          }}
        />
      )}
    </div>
  );
}
