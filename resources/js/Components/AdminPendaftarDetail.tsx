'use client';

import { useState, useEffect } from 'react';
import { getStatusLabel, getStatusBadgeClass } from '@/lib/storage';
import { pendaftarApi, angkatanApi, tempatApi, pembayaranApi } from '@/lib/api';
import type { Pendaftar, Angkatan, TempatPelatihan } from '@/lib/types';
import { LIST_BERKAS_PERSYARATAN } from '@/Components/VerifikasiPesertaModal';

interface AdminPendaftarDetailProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onStatusChange: () => void;
}

export default function AdminPendaftarDetail({
  pendaftar: initialPendaftar,
  onClose,
  onStatusChange,
}: AdminPendaftarDetailProps) {
  const [currentPendaftar, setCurrentPendaftar] = useState<Pendaftar>(initialPendaftar);
  const [isEditingDataDiri, setIsEditingDataDiri] = useState(false);
  const [savingDataDiri, setSavingDataDiri] = useState(false);

  // Form State Edit Data Diri
  const [editNama, setEditNama] = useState(initialPendaftar.nama_lengkap || '');
  const [editNik, setEditNik] = useState(initialPendaftar.nik || '');
  const [editTempatLahir, setEditTempatLahir] = useState(initialPendaftar.tempat_lahir || '');
  const [editTanggalLahir, setEditTanggalLahir] = useState(
    initialPendaftar.tanggal_lahir ? String(initialPendaftar.tanggal_lahir).split('T')[0] : ''
  );
  const [editNoHp, setEditNoHp] = useState(initialPendaftar.no_hp || '');
  const [editEmail, setEditEmail] = useState(initialPendaftar.email || '');
  const [editJenjangPendidikan, setEditJenjangPendidikan] = useState(initialPendaftar.jenjang_pendidikan || '');
  const [editAsalSekolah, setEditAsalSekolah] = useState(initialPendaftar.asal_sekolah || '');
  const [editTahunLulus, setEditTahunLulus] = useState(initialPendaftar.tahun_lulus ? String(initialPendaftar.tahun_lulus) : '');
  const [editAlamat, setEditAlamat] = useState(initialPendaftar.alamat || '');
  const [editMotivasi, setEditMotivasi] = useState(initialPendaftar.motivasi || '');

  // Form State Verifikasi & Fisik
  const [tinggiBadan, setTinggiBadan] = useState(initialPendaftar.tinggi_badan || '');
  const [beratBadan, setBeratBadan] = useState(initialPendaftar.berat_badan || '');
  const [lingkarPinggang, setLingkarPinggang] = useState(initialPendaftar.lingkar_pinggang || '');
  
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>([]);
  const [angkatanId, setAngkatanId] = useState<string>(initialPendaftar.angkatan_id || '');
  const [tempatPelatihan, setTempatPelatihan] = useState<string>(initialPendaftar.tempat_pelatihan || '');

  const [selectedBerkas, setSelectedBerkas] = useState<string[]>(
    Array.isArray(initialPendaftar.berkas_verifikasi) ? initialPendaftar.berkas_verifikasi : []
  );

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    Promise.all([angkatanApi.list(), tempatApi.list()]).then(([aRes, tRes]) => {
      const aData = aRes.data || [];
      const tData = tRes.data || [];
      setAngkatanList(aData);
      setTempatList(tData);

      if (!angkatanId && aData.length > 0) {
        setAngkatanId(aData[0].id);
      }
      if (!tempatPelatihan && tData.length > 0) {
        setTempatPelatihan(`${tData[0].nama_tempat} (${tData[0].alamat_lengkap})`);
      }
    }).catch(() => {});
  }, []);

  const tinggiM = Number(tinggiBadan) / 100;
  const bmiValue = tinggiM > 0 && Number(beratBadan) > 0 
    ? (Number(beratBadan) / (tinggiM * tinggiM)).toFixed(1)
    : null;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Kekurangan Berat', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (bmi < 25) return { label: 'Normal / Ideal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (bmi < 30) return { label: 'Kelebihan Berat', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Obesitas', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const handleToggleBerkas = (id: string) => {
    if (selectedBerkas.includes(id)) {
      setSelectedBerkas(selectedBerkas.filter((item) => item !== id));
    } else {
      setSelectedBerkas([...selectedBerkas, id]);
    }
  };

  const handleSelectAllBerkas = () => {
    if (selectedBerkas.length === LIST_BERKAS_PERSYARATAN.length) {
      setSelectedBerkas([]);
    } else {
      setSelectedBerkas(LIST_BERKAS_PERSYARATAN.map((b) => b.id));
    }
  };

  // Submit Handler Edit Data Diri
  const handleSaveDataDiri = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setSavingDataDiri(true);

    try {
      const res = await pendaftarApi.update(currentPendaftar.id, {
        nama_lengkap: editNama,
        nik: editNik,
        tempat_lahir: editTempatLahir,
        tanggal_lahir: editTanggalLahir,
        no_hp: editNoHp,
        email: editEmail,
        jenjang_pendidikan: editJenjangPendidikan || undefined,
        asal_sekolah: editAsalSekolah || undefined,
        tahun_lulus: editTahunLulus ? Number(editTahunLulus) : undefined,
        alamat: editAlamat,
        motivasi: editMotivasi,
      });

      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        setIsEditingDataDiri(false);
        setNotification({
          type: 'success',
          message: 'Data diri peserta berhasil diperbarui!',
        });
        onStatusChange();
      } else {
        setNotification({ type: 'error', message: res.error || 'Gagal memperbarui data diri.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setSavingDataDiri(false);
    }
  };

  // Submit Handler Verifikasi & Terima Peserta
  const handleVerifikasiDanTerima = async () => {
    setNotification(null);

    const missingRequired = LIST_BERKAS_PERSYARATAN.filter(
      (b) => b.required && !selectedBerkas.includes(b.id)
    );

    if (missingRequired.length > 0) {
      setNotification({
        type: 'error',
        message: `Verifikasi Gagal: Ada ${missingRequired.length} berkas wajib (*) yang belum diserahkan.`,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await pendaftarApi.updateStatus(currentPendaftar.id, 'diterima', {
        tinggi_badan: tinggiBadan,
        berat_badan: beratBadan,
        lingkar_pinggang: lingkarPinggang,
        berkas_verifikasi: selectedBerkas,
        angkatan_id: angkatanId,
        tempat_pelatihan: tempatPelatihan,
      });

      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        setNotification({
          type: 'success',
          message: 'Peserta berhasil diverifikasi, diterima, dan otomatis terhubung ke jadwal angkatan!',
        });
        onStatusChange();
      } else {
        setNotification({ type: 'error', message: res.error || 'Gagal memverifikasi peserta.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const res = await pendaftarApi.updateStatus(currentPendaftar.id, 'ditolak');
      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        setNotification({ type: 'success', message: 'Status pendaftaran peserta diubah menjadi Ditolak.' });
        onStatusChange();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menolak pendaftaran.' });
    } finally {
      setLoading(false);
    }
  };

  const totalBiaya = currentPendaftar.program?.harga || currentPendaftar.biaya_pelatihan || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigasi Header Top */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline btn-sm font-bold flex items-center gap-2 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Kembali ke Daftar Peserta</span>
        </button>

        <button
          type="button"
          onClick={() => setIsEditingDataDiri(!isEditingDataDiri)}
          className={`btn btn-sm font-bold flex items-center gap-2 transition-all ${
            isEditingDataDiri
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 shadow-2xs'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>{isEditingDataDiri ? 'Batal Edit Data Diri' : 'Edit Data Diri'}</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center justify-between shadow-2xs ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* HERO BANNER MEMANJANG (Nama & NIK di atas dengan Card Background) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-md border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-200 bg-indigo-900/80 px-3 py-1 rounded-xl border border-indigo-700/50">
                No. Reg: {currentPendaftar.no_pendaftaran}
              </span>
              <span className={getStatusBadgeClass(currentPendaftar.status)}>
                {getStatusLabel(currentPendaftar.status)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentPendaftar.nama_lengkap}
            </h1>

            <div className="flex items-center gap-4 text-xs text-indigo-200/90 flex-wrap font-medium pt-1">
              <span className="font-mono bg-indigo-950/90 px-3 py-1 rounded-lg border border-indigo-800/80 text-indigo-100 font-bold">
                NIK: {currentPendaftar.nik || '-'}
              </span>
              <span>•</span>
              <span><strong>Program:</strong> {currentPendaftar.program?.nama || currentPendaftar.jenis_pelatihan}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">
                Biaya: Rp {totalBiaya.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingDataDiri(!isEditingDataDiri)}
              className="btn btn-sm font-bold bg-white text-indigo-950 hover:bg-indigo-50 border-white shadow-md flex items-center gap-2 px-4 py-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>{isEditingDataDiri ? 'Selesai Edit' : 'Edit Data Diri'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Diri & Identitas Peserta */}
        <div className="lg:col-span-1 space-y-6">
          <Section title="1. Identitas & Data Diri Peserta">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              {isEditingDataDiri ? (
                <form onSubmit={handleSaveDataDiri} className="space-y-3.5 text-xs">
                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={editNama}
                      onChange={(e) => setEditNama(e.target.value)}
                      className="form-input w-full font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">NIK (KTP) *</label>
                    <input
                      type="text"
                      value={editNik}
                      onChange={(e) => setEditNik(e.target.value)}
                      className="form-input w-full font-mono font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label block font-bold text-slate-700 mb-1">Tempat Lahir *</label>
                      <input
                        type="text"
                        value={editTempatLahir}
                        onChange={(e) => setEditTempatLahir(e.target.value)}
                        className="form-input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label block font-bold text-slate-700 mb-1">Tanggal Lahir *</label>
                      <input
                        type="date"
                        value={editTanggalLahir}
                        onChange={(e) => setEditTanggalLahir(e.target.value)}
                        className="form-input w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">No. Handphone / WA *</label>
                    <input
                      type="text"
                      value={editNoHp}
                      onChange={(e) => setEditNoHp(e.target.value)}
                      className="form-input w-full font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="form-input w-full font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Jenjang Pendidikan</label>
                    <select
                      value={editJenjangPendidikan}
                      onChange={(e) => setEditJenjangPendidikan(e.target.value)}
                      className="form-input w-full"
                    >
                      <option value="">Belum diisi</option>
                      <option value="SMP/MTs">SMP/MTs</option>
                      <option value="SMA/SMK/MA">SMA/SMK/MA</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Sarjana (S1)">Sarjana (S1)</option>
                      <option value="Magister (S2)">Magister (S2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Asal Sekolah</label>
                    <input
                      type="text"
                      value={editAsalSekolah}
                      onChange={(e) => setEditAsalSekolah(e.target.value)}
                      className="form-input w-full"
                      placeholder="Contoh: SMK Negeri 1 Garut"
                    />
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Tahun Lulus</label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={editTahunLulus}
                      onChange={(e) => setEditTahunLulus(e.target.value)}
                      className="form-input w-full"
                      placeholder="Contoh: 2024"
                    />
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Alamat Lengkap *</label>
                    <textarea
                      value={editAlamat}
                      onChange={(e) => setEditAlamat(e.target.value)}
                      className="form-input w-full text-xs"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Motivasi Bergabung</label>
                    <textarea
                      value={editMotivasi}
                      onChange={(e) => setEditMotivasi(e.target.value)}
                      className="form-input w-full text-xs"
                      rows={2}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingDataDiri}
                    className="w-full btn btn-primary btn-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white mt-2 flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {savingDataDiri && (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {savingDataDiri ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Data Diri'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Ringkasan Diri</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingDataDiri(true)}
                      className="text-indigo-600 font-bold hover:underline text-[11px]"
                    >
                      Ubah Data
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">NAMA LENGKAP</span>
                      <span className="font-bold text-slate-900 text-sm">{currentPendaftar.nama_lengkap}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">NIK (KTP)</span>
                      <span className="font-mono text-slate-800 font-bold">{currentPendaftar.nik || '-'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">TEMPAT & TANGGAL LAHIR</span>
                      <span className="font-medium text-slate-800">
                        {currentPendaftar.tempat_lahir}, {currentPendaftar.tanggal_lahir ? new Date(currentPendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">NO. HANDPHONE / WA</span>
                      <span className="font-mono font-bold text-slate-800">{currentPendaftar.no_hp}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">EMAIL</span>
                      <span className="font-mono text-slate-800">{currentPendaftar.email}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">JENJANG PENDIDIKAN</span>
                      <span className="font-medium text-slate-800">{currentPendaftar.jenjang_pendidikan || '-'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">ASAL SEKOLAH</span>
                      <span className="font-medium text-slate-800">{currentPendaftar.asal_sekolah || '-'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">TAHUN LULUS</span>
                      <span className="font-medium text-slate-800">{currentPendaftar.tahun_lulus || '-'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">ALAMAT LENGKAP</span>
                      <span className="font-medium text-slate-800 leading-relaxed block">{currentPendaftar.alamat}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section title="Motivasi Peserta">
            <div className="text-xs text-slate-700 bg-white rounded-2xl p-4 border border-slate-200 leading-relaxed shadow-2xs">
              {currentPendaftar.motivasi || 'Pendaftaran dilakukan via portal LPK.'}
            </div>
          </Section>
        </div>

        {/* Right Column: Verifikasi, Angkatan, Tempat, Fisik & Berkas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 2: Alokasi Angkatan & Tempat Pelatihan */}
          <Section title="2. Alokasi Angkatan & Tempat Pelatihan (Koneksi Jadwal)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div>
                <label className="form-label block text-xs font-bold text-slate-700 mb-1">
                  Pilih Angkatan Pelatihan <span className="text-rose-500">*</span>
                </label>
                <select
                  className="form-input w-full text-xs font-bold text-indigo-900 bg-white"
                  value={angkatanId}
                  onChange={(e) => setAngkatanId(e.target.value)}
                >
                  {angkatanList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama_angkatan} ({a.kode_angkatan}) — {a.tahun}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label block text-xs font-bold text-slate-700 mb-1">
                  Pilih Tempat / Lokasi Pelatihan <span className="text-rose-500">*</span>
                </label>
                <select
                  className="form-input w-full text-xs font-bold text-indigo-900 bg-white"
                  value={tempatPelatihan}
                  onChange={(e) => setTempatPelatihan(e.target.value)}
                >
                  {tempatList.map((t) => {
                    const fullLabel = `${t.nama_tempat} (${t.alamat_lengkap})`;
                    return (
                      <option key={t.id} value={fullLabel}>
                        {fullLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </Section>

          {/* Section 3: Data Fisik & BMI */}
          <Section title="3. Pemeriksaan Data Fisik & Ukuran Seragam">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                    Tinggi Badan (cm) *
                  </label>
                  <input
                    type="number"
                    value={tinggiBadan}
                    onChange={(e) => setTinggiBadan(e.target.value)}
                    className="form-input text-xs font-medium"
                    placeholder="165"
                  />
                </div>
                <div>
                  <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                    Berat Badan (kg) *
                  </label>
                  <input
                    type="number"
                    value={beratBadan}
                    onChange={(e) => setBeratBadan(e.target.value)}
                    className="form-input text-xs font-medium"
                    placeholder="55"
                  />
                </div>
                <div>
                  <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                    Lingkar Pinggang *
                  </label>
                  <input
                    type="text"
                    value={lingkarPinggang}
                    onChange={(e) => setLingkarPinggang(e.target.value)}
                    className="form-input text-xs font-medium"
                    placeholder="75"
                  />
                </div>
              </div>

              {bmiValue && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-medium">
                    Kalkulasi BMI: <span className="font-bold text-slate-900">{bmiValue} kg/m²</span>
                  </div>
                  {(() => {
                    const cat = getBmiCategory(Number(bmiValue));
                    return (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cat.color}`}>
                        {cat.label}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
          </Section>

          {/* Section 4: Checklist Berkas Persyaratan */}
          <Section title="4. Checklist Berkas & Dokumen Persyaratan">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Centang berkas bertanda (<span className="text-rose-500 font-bold">*</span>) WAJIB diserahkan:</span>
                <button
                  type="button"
                  onClick={handleSelectAllBerkas}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  {selectedBerkas.length === LIST_BERKAS_PERSYARATAN.length ? 'Hapus Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LIST_BERKAS_PERSYARATAN.map((berkas) => {
                  const isChecked = selectedBerkas.includes(berkas.id);
                  return (
                    <label
                      key={berkas.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none text-xs font-medium transition-all ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-semibold'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBerkas(berkas.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <span className="truncate">{berkas.label} {berkas.required && <span className="text-rose-500 font-bold">*</span>}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Section 5: Informasi Pembayaran (Jika Sudah Diterima) */}
          {currentPendaftar.status === 'diterima' && (
            <Section title="5. Status Pembayaran Pelatihan">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Status Bayar:</span>
                  <span className="font-bold text-indigo-700 uppercase">{currentPendaftar.status_pembayaran || 'Belum Bayar'}</span>
                </div>
                {currentPendaftar.bukti_pembayaran && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold block mb-1">Bukti Transfer:</span>
                    <img src={currentPendaftar.bukti_pembayaran} alt="Bukti Transfer" className="max-h-48 rounded-lg border border-slate-200 bg-white p-1" />
                  </div>
                )}
                {currentPendaftar.status_pembayaran !== 'lunas' && (
                  <button
                    onClick={async () => {
                      const res = await pembayaranApi.verifikasi(currentPendaftar.id);
                      if (res.success && res.data) {
                        setCurrentPendaftar(res.data);
                      }
                      onStatusChange();
                    }}
                    className="btn btn-accent btn-sm flex items-center gap-1.5 font-bold mt-2"
                  >
                    Konfirmasi Lunas
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* Action Buttons Panel */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="btn btn-danger btn-sm font-bold"
            >
              Tolak Pendaftaran
            </button>
            <button
              type="button"
              onClick={handleVerifikasiDanTerima}
              disabled={loading}
              className="btn btn-accent btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 font-bold px-6 py-2.5 text-xs shadow-md flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Memproses Verifikasi...' : 'Verifikasi & Terima Peserta (Masuk Jadwal)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-4 rounded-full bg-indigo-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
