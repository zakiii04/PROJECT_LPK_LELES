'use client';

import { useState, useEffect } from 'react';
import { getStatusLabel, getStatusBadgeClass, getStatusValidasi, getStatusVerifikasi, getTahapLabel, getTahapBadgeClass, STATUS_AKHIR_OPTIONS, composeAlamat, parseAlamat } from '@/lib/storage';
import { pendaftarApi, angkatanApi, tempatApi, pembayaranApi } from '@/lib/api';
import { pickDefaultAngkatan, resolveDefaultTempat, tempatLabel, tempatOptions } from '@/lib/penempatan';
import type { Pendaftar, Angkatan, TempatPelatihan } from '@/lib/types';
import { LIST_BERKAS_PERSYARATAN } from '@/Components/VerifikasiPesertaModal';
import AlamatForm from '@/Components/AlamatForm';
import TenggatBanner from '@/Components/TenggatBanner';

export type DetailMode = 'validasi' | 'verifikasi' | 'semua';

interface AdminPendaftarDetailProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onStatusChange: () => void;
  /** Tampilan konten dibedakan per menu: validasi (identitas+fisik),
   * verifikasi (identitas+fisik+angkatan/tempat+berkas), semua (ringkasan+status). */
  mode?: DetailMode;
  backLabel?: string;
}

const MODE_TITLE: Record<DetailMode, string> = {
  validasi: 'Detail Validasi Awal — Identitas & Data Fisik',
  verifikasi: 'Detail Verifikasi — Berkas, Fisik & Penempatan',
  semua: 'Detail Peserta',
};

export default function AdminPendaftarDetail({
  pendaftar: initialPendaftar,
  onClose,
  onStatusChange,
  mode = 'semua',
  backLabel = 'Kembali ke Daftar Peserta',
}: AdminPendaftarDetailProps) {
  const [currentPendaftar, setCurrentPendaftar] = useState<Pendaftar>(initialPendaftar);
  const [isEditingDataDiri, setIsEditingDataDiri] = useState(false);
  const [savingDataDiri, setSavingDataDiri] = useState(false);

  // Form State Edit Data Diri
  const [editNama, setEditNama] = useState(initialPendaftar.nama_lengkap || '');
  const [editNik, setEditNik] = useState(initialPendaftar.nik || '');
  const [editJenisKelamin, setEditJenisKelamin] = useState(initialPendaftar.jenis_kelamin || 'Perempuan');
  const [editTempatLahir, setEditTempatLahir] = useState(initialPendaftar.tempat_lahir || '');
  const [editTanggalLahir, setEditTanggalLahir] = useState(
    initialPendaftar.tanggal_lahir ? String(initialPendaftar.tanggal_lahir).split('T')[0] : ''
  );
  const [editNoHp, setEditNoHp] = useState(initialPendaftar.no_hp || '');
  const [editEmail, setEditEmail] = useState(initialPendaftar.email || '');
  const [editJenjangPendidikan, setEditJenjangPendidikan] = useState(initialPendaftar.jenjang_pendidikan || '');
  const [editAsalSekolah, setEditAsalSekolah] = useState(initialPendaftar.asal_sekolah || '');
  const [editTahunLulus, setEditTahunLulus] = useState(initialPendaftar.tahun_lulus ? String(initialPendaftar.tahun_lulus) : '');

  const parsedInitAlamat = parseAlamat(initialPendaftar.alamat || '');
  const [editProvinsi, setEditProvinsi] = useState(
    initialPendaftar.provinsi || parsedInitAlamat.provinsi || ''
  );
  const [editKabupatenKota, setEditKabupatenKota] = useState(
    initialPendaftar.kabupaten_kota || parsedInitAlamat.kabupaten_kota || ''
  );
  const [editKecamatan, setEditKecamatan] = useState(
    initialPendaftar.kecamatan || parsedInitAlamat.kecamatan || ''
  );
  const [editDesaKelurahan, setEditDesaKelurahan] = useState(
    initialPendaftar.desa_kelurahan || parsedInitAlamat.desa_kelurahan || ''
  );
  const [editAlamat, setEditAlamat] = useState(
    parsedInitAlamat.detail_alamat || initialPendaftar.alamat || ''
  );
  const [editMotivasi, setEditMotivasi] = useState(initialPendaftar.motivasi || '');

  // Form State Verifikasi & Fisik
  const [tinggiBadan, setTinggiBadan] = useState(initialPendaftar.tinggi_badan || '');
  const [beratBadan, setBeratBadan] = useState(initialPendaftar.berat_badan || '');
  const [lingkarPinggang, setLingkarPinggang] = useState(initialPendaftar.lingkar_pinggang || '');
  
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>([]);
  const [angkatanId, setAngkatanId] = useState<string>(initialPendaftar.angkatan_id || '');
  const [tempatPelatihan, setTempatPelatihan] = useState<string>(initialPendaftar.tempat_pelatihan || '');
  const [angkatanHint, setAngkatanHint] = useState<string>('');

  const [selectedBerkas, setSelectedBerkas] = useState<string[]>(
    Array.isArray(initialPendaftar.berkas_verifikasi) ? initialPendaftar.berkas_verifikasi : []
  );
  const [catatanValidasi, setCatatanValidasi] = useState(initialPendaftar.catatan_validasi || '');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState(initialPendaftar.catatan_verifikasi || '');

  const statusValidasi = getStatusValidasi(currentPendaftar);
  const statusVerifikasi = getStatusVerifikasi(currentPendaftar);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    Promise.all([angkatanApi.list(), tempatApi.list()]).then(([aRes, tRes]) => {
      const aData = aRes.data || [];
      const tData = tRes.data || [];
      setAngkatanList(aData);
      setTempatList(tData);

      // Angkatan default: cocokkan program + rentang waktu pendaftaran
      // mencakup tanggal daftar (bukan asal ambil index pertama).
      if (!initialPendaftar.angkatan_id && aData.length > 0) {
        const picked = pickDefaultAngkatan(aData, initialPendaftar);
        if (picked.angkatan) {
          setAngkatanId(picked.angkatan.id);
          setAngkatanHint(picked.reason);
        }
      } else if (initialPendaftar.angkatan_id) {
        setAngkatanHint('Sudah ditetapkan sebelumnya, masih bisa diubah.');
      }
      // Tempat default: prioritaskan input peserta, fallback tempat pertama.
      if (!initialPendaftar.tempat_pelatihan && tData.length > 0) {
        setTempatPelatihan(tempatLabel(tData[0]));
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPendaftar(initialPendaftar);
    const parsed = parseAlamat(initialPendaftar.alamat || '');
    setEditNama(initialPendaftar.nama_lengkap || '');
    setEditNik(initialPendaftar.nik || '');
    setEditJenisKelamin(initialPendaftar.jenis_kelamin || 'Perempuan');
    setEditTempatLahir(initialPendaftar.tempat_lahir || '');
    setEditTanggalLahir(
      initialPendaftar.tanggal_lahir ? String(initialPendaftar.tanggal_lahir).split('T')[0] : ''
    );
    setEditNoHp(initialPendaftar.no_hp || '');
    setEditEmail(initialPendaftar.email || '');
    setEditJenjangPendidikan(initialPendaftar.jenjang_pendidikan || '');
    setEditAsalSekolah(initialPendaftar.asal_sekolah || '');
    setEditTahunLulus(initialPendaftar.tahun_lulus ? String(initialPendaftar.tahun_lulus) : '');
    setEditProvinsi(initialPendaftar.provinsi || parsed.provinsi || '');
    setEditKabupatenKota(initialPendaftar.kabupaten_kota || parsed.kabupaten_kota || '');
    setEditKecamatan(initialPendaftar.kecamatan || parsed.kecamatan || '');
    setEditDesaKelurahan(initialPendaftar.desa_kelurahan || parsed.desa_kelurahan || '');
    setEditAlamat(parsed.detail_alamat || initialPendaftar.alamat || '');
    setEditMotivasi(initialPendaftar.motivasi || '');
    setTinggiBadan(initialPendaftar.tinggi_badan || '');
    setBeratBadan(initialPendaftar.berat_badan || '');
    setLingkarPinggang(initialPendaftar.lingkar_pinggang || '');
    if (initialPendaftar.angkatan_id) {
      setAngkatanId(initialPendaftar.angkatan_id);
      setAngkatanHint('Sudah ditetapkan sebelumnya, masih bisa diubah.');
    } else if (angkatanList.length > 0) {
      const picked = pickDefaultAngkatan(angkatanList, initialPendaftar);
      if (picked.angkatan) {
        setAngkatanId(picked.angkatan.id);
        setAngkatanHint(picked.reason);
      }
    }
    if (initialPendaftar.tempat_pelatihan) {
      setTempatPelatihan(initialPendaftar.tempat_pelatihan);
    } else {
      setTempatPelatihan((prev) => prev || resolveDefaultTempat(tempatList, null));
    }
    if (Array.isArray(initialPendaftar.berkas_verifikasi)) {
      setSelectedBerkas(initialPendaftar.berkas_verifikasi);
    }
    setCatatanValidasi(initialPendaftar.catatan_validasi || '');
    setCatatanVerifikasi(initialPendaftar.catatan_verifikasi || '');
  }, [initialPendaftar]);

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
      const finalAlamat = composeAlamat({
        provinsi: editProvinsi,
        kabupaten_kota: editKabupatenKota,
        kecamatan: editKecamatan,
        desa_kelurahan: editDesaKelurahan,
        detail_alamat: editAlamat,
      }) || editAlamat;

      const res = await pendaftarApi.update(currentPendaftar.id, {
        nama_lengkap: editNama,
        nik: editNik,
        jenis_kelamin: editJenisKelamin,
        tempat_lahir: editTempatLahir,
        tanggal_lahir: editTanggalLahir,
        no_hp: editNoHp,
        email: editEmail,
        jenjang_pendidikan: editJenjangPendidikan || undefined,
        asal_sekolah: editAsalSekolah || undefined,
        tahun_lulus: editTahunLulus ? Number(editTahunLulus) : undefined,
        alamat: finalAlamat,
        provinsi: editProvinsi || undefined,
        kabupaten_kota: editKabupatenKota || undefined,
        kecamatan: editKecamatan || undefined,
        desa_kelurahan: editDesaKelurahan || undefined,
        motivasi: editMotivasi,
      });

      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        const updatedParsed = parseAlamat(res.data.alamat || '');
        setEditProvinsi(res.data.provinsi || updatedParsed.provinsi || '');
        setEditKabupatenKota(res.data.kabupaten_kota || updatedParsed.kabupaten_kota || '');
        setEditKecamatan(res.data.kecamatan || updatedParsed.kecamatan || '');
        setEditDesaKelurahan(res.data.desa_kelurahan || updatedParsed.desa_kelurahan || '');
        setEditAlamat(updatedParsed.detail_alamat || res.data.alamat || '');
        setIsEditingDataDiri(false);
        setNotification({
          type: 'success',
          message: 'Data diri dan alamat peserta berhasil diperbarui!',
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

  // TAHAP 1: Validasi awal (filter laki-laki & keaslian data)
  const handleValidasi = async (status: 'diterima' | 'ditolak') => {
    setNotification(null);
    if (status === 'ditolak' && !catatanValidasi.trim()) {
      setNotification({ type: 'error', message: 'Alasan penolakan wajib diisi pada tahap validasi.' });
      return;
    }
    try {
      setLoading(true);
      const res = await pendaftarApi.validasi(currentPendaftar.id, status, {
        catatan_validasi: catatanValidasi || undefined,
        jenis_kelamin: editJenisKelamin as any,
      });
      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        setNotification({
          type: 'success',
          message: status === 'diterima'
            ? 'Validasi diterima. Pendaftar masuk ke tahap verifikasi.'
            : 'Pendaftar ditolak pada tahap validasi.',
        });
        onStatusChange();
      } else {
        setNotification({ type: 'error', message: res.error || 'Gagal menyimpan validasi.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  // TAHAP 2: Verifikasi berkas & fisik (seperti alur lama) + masuk angkatan/jadwal
  const handleVerifikasiDanTerima = async () => {
    setNotification(null);

    if (statusValidasi !== 'diterima') {
      setNotification({ type: 'error', message: 'Selesaikan Tahap 1 Validasi dulu sebelum verifikasi.' });
      return;
    }

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

    if (!angkatanId) {
      setNotification({ type: 'error', message: 'Angkatan wajib dipilih saat menerima peserta.' });
      return;
    }

    try {
      setLoading(true);
      const res = await pendaftarApi.verifikasi(currentPendaftar.id, 'diterima', {
        tinggi_badan: tinggiBadan,
        berat_badan: beratBadan,
        lingkar_pinggang: lingkarPinggang,
        berkas_verifikasi: selectedBerkas,
        angkatan_id: angkatanId,
        tempat_pelatihan: tempatPelatihan,
        catatan_verifikasi: catatanVerifikasi || undefined,
      });

      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        setNotification({
          type: 'success',
          message: 'Verifikasi diterima. Peserta masuk angkatan & jadwal, status menjadi diterima!',
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

  const handleVerifikasiTolak = async () => {
    setNotification(null);
    if (!catatanVerifikasi.trim()) {
      setNotification({ type: 'error', message: 'Alasan penolakan wajib diisi pada tahap verifikasi.' });
      return;
    }
    try {
      setLoading(true);
      const res = await pendaftarApi.verifikasi(currentPendaftar.id, 'ditolak', {
        catatan_verifikasi: catatanVerifikasi,
      });
      if (res.success && res.data) {
        setCurrentPendaftar(res.data);
        setNotification({ type: 'success', message: 'Pendaftar ditolak pada tahap verifikasi.' });
        onStatusChange();
      } else {
        setNotification({ type: 'error', message: res.error || 'Gagal menolak.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menolak pendaftaran.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    // Tolak pada tahap berjalan: validasi dulu, verifikasi bila sudah lolos validasi.
    if (statusValidasi !== 'diterima') return handleValidasi('ditolak');
    return handleVerifikasiTolak();
  };

  const totalBiaya = currentPendaftar.program?.harga || currentPendaftar.biaya_pelatihan || 0;

  const currentParsed = parseAlamat(currentPendaftar.alamat || '');
  const currentProvinsi = currentPendaftar.provinsi || currentParsed.provinsi || '-';
  const currentKota = currentPendaftar.kabupaten_kota || currentParsed.kabupaten_kota || '-';
  const currentKecamatan = currentPendaftar.kecamatan || currentParsed.kecamatan || '-';
  const currentKelurahan = currentPendaftar.desa_kelurahan || currentParsed.desa_kelurahan || '-';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigasi Header Top */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline btn-sm font-bold flex items-center gap-2 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{backLabel}</span>
        </button>

        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          {MODE_TITLE[mode]}
        </span>

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
              <span className={getTahapBadgeClass(currentPendaftar)}>
                {getTahapLabel(currentPendaftar)}
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

                  <div>
                    <label className="form-label block font-bold text-slate-700 mb-1">Jenis Kelamin *</label>
                    <select
                      value={editJenisKelamin}
                      onChange={(e) => setEditJenisKelamin(e.target.value)}
                      className="form-input w-full font-semibold"
                    >
                      <option value="Perempuan">Perempuan</option>
                      <option value="Laki-laki">Laki-laki</option>
                    </select>
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

                  <div className="border-t border-slate-200/80 pt-3 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                      Data Wilayah & Alamat Peserta
                    </span>

                    <AlamatForm
                      data={{
                        provinsi: editProvinsi,
                        kabupaten_kota: editKabupatenKota,
                        kecamatan: editKecamatan,
                        desa_kelurahan: editDesaKelurahan,
                        detail_alamat: editAlamat,
                      }}
                      onChange={(field, val) => {
                        if (field === 'provinsi') setEditProvinsi(val);
                        else if (field === 'kabupaten_kota') setEditKabupatenKota(val);
                        else if (field === 'kecamatan') setEditKecamatan(val);
                        else if (field === 'desa_kelurahan') setEditDesaKelurahan(val);
                        else if (field === 'detail_alamat') setEditAlamat(val);
                      }}
                      required={false}
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
                      <span className="text-slate-400 block text-[10px] font-bold">JENIS KELAMIN</span>
                      <span className={`font-bold ${currentPendaftar.jenis_kelamin === 'Laki-laki' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {currentPendaftar.jenis_kelamin || '-'}
                        {currentPendaftar.jenis_kelamin === 'Laki-laki' ? ' (tidak memenuhi syarat)' : ''}
                      </span>
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

                    <div className="border-t border-slate-100 pt-3 space-y-2.5">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        DATA WILAYAH & ALAMAT
                      </span>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Provinsi</span>
                          <span className="font-bold text-slate-800 text-xs block truncate" title={currentProvinsi}>
                            {currentProvinsi}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Kabupaten / Kota</span>
                          <span className="font-bold text-slate-800 text-xs block truncate" title={currentKota}>
                            {currentKota}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Kecamatan</span>
                          <span className="font-bold text-slate-800 text-xs block truncate" title={currentKecamatan}>
                            {currentKecamatan}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Kelurahan / Desa</span>
                          <span className="font-bold text-slate-800 text-xs block truncate" title={currentKelurahan}>
                            {currentKelurahan}
                          </span>
                        </div>
                      </div>

                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/80 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-800 block uppercase">Alamat Lengkap</span>
                        <span className="font-medium text-slate-800 text-xs leading-relaxed block">
                          {currentPendaftar.alamat || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {mode !== 'validasi' && (
          <Section title="Motivasi Peserta">
            <div className="text-xs text-slate-700 bg-white rounded-2xl p-4 border border-slate-200 leading-relaxed shadow-2xs">
              {currentPendaftar.motivasi || 'Pendaftaran dilakukan via portal LPK.'}
            </div>
          </Section>
          )}
          {mode === 'semua' && currentPendaftar.catatan_validasi && (
            <Section title="Catatan Validasi">
              <div className="text-xs text-slate-700 bg-amber-50/60 rounded-2xl p-4 border border-amber-200/70 leading-relaxed">
                {currentPendaftar.catatan_validasi}
              </div>
            </Section>
          )}
          {mode === 'semua' && currentPendaftar.catatan_verifikasi && (
            <Section title="Catatan Verifikasi">
              <div className="text-xs text-slate-700 bg-indigo-50/60 rounded-2xl p-4 border border-indigo-200/70 leading-relaxed">
                {currentPendaftar.catatan_verifikasi}
              </div>
            </Section>
          )}
        </div>

        {/* Right Column: Tahap 1 Validasi, Tahap 2 Verifikasi, Angkatan, Fisik & Berkas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alur 2 tahap */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 text-[11px] font-bold flex-wrap">
            <span className={`px-2.5 py-1 rounded-full border ${statusValidasi === 'diterima' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : statusValidasi === 'ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              1. Validasi: {statusValidasi === 'diterima' ? 'Lolos' : statusValidasi === 'ditolak' ? 'Ditolak' : 'Menunggu'}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full border ${statusVerifikasi === 'diterima' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : statusVerifikasi === 'ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              2. Verifikasi: {statusVerifikasi === 'diterima' ? 'Diterima' : statusVerifikasi === 'ditolak' ? 'Ditolak' : statusVerifikasi === 'menunggu' ? 'Menunggu' : 'Belum proses'}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full border ${currentPendaftar.status === 'diterima' || currentPendaftar.status === 'lulus' ? 'bg-emerald-600 text-white border-emerald-600' : currentPendaftar.status === 'ditolak' || currentPendaftar.status === 'keluar' ? 'bg-rose-600 text-white border-rose-600' : currentPendaftar.status === 'sudah_bekerja' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              Status akhir: {getStatusLabel(currentPendaftar.status)}
            </span>
          </div>

          {/* Tahap 1 — hanya di menu Validasi Awal */}
          {mode === 'validasi' && (
          <Section title="1. Validasi Awal (Filter Khusus Perempuan & Keaslian)">
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-3">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Cek jenis kelamin (program khusus <strong>perempuan</strong>) dan pastikan pendaftar benar-benar orang (NIK, HP, email bukan asal isi).
                Lolos validasi → masuk Tahap 2 Verifikasi. Ditolak → status akhir ditolak.
              </p>
              <div>
                <label className="form-label block text-xs font-bold text-slate-700 mb-1">Catatan Validasi (wajib jika menolak)</label>
                <textarea
                  value={catatanValidasi}
                  onChange={(e) => setCatatanValidasi(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Data benar, pendaftar perempuan, lanjut verifikasi."
                  className="form-input w-full text-xs bg-white"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleValidasi('ditolak')}
                  disabled={loading}
                  className="btn btn-sm font-bold bg-rose-600 hover:bg-rose-700 text-white border-rose-600 disabled:opacity-60"
                >
                  Tolak di Validasi
                </button>
                <button
                  type="button"
                  onClick={() => handleValidasi('diterima')}
                  disabled={loading || currentPendaftar.jenis_kelamin === 'Laki-laki' && editJenisKelamin === 'Laki-laki'}
                  className="btn btn-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 disabled:opacity-60"
                >
                  Terima → ke Verifikasi
                </button>
                {currentPendaftar.catatan_validasi && (
                  <span className="text-[11px] text-slate-500">Catatan tersimpan: {currentPendaftar.catatan_validasi}</span>
                )}
              </div>
            </div>
          </Section>
          )}

          {/* Info kelolosan validasi — hanya di menu Verifikasi */}
          {mode === 'verifikasi' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-extrabold">✓ Lolos Tahap 1 Validasi Awal</div>
              {currentPendaftar.tanggal_validasi && (
                <div className="font-medium">
                  Divalidasi pada {new Date(currentPendaftar.tanggal_validasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              {currentPendaftar.catatan_validasi && (
                <div className="leading-relaxed">Catatan validasi: {currentPendaftar.catatan_validasi}</div>
              )}
            </div>
          )}

          {/* Alokasi Angkatan & Tempat — tampil di Validasi awal maupun Verifikasi */}
          {(mode === 'verifikasi' || mode === 'validasi') && (
          <Section title="2. Alokasi Angkatan & Tempat Pelatihan (Koneksi Jadwal)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div>
                <label className="form-label block text-xs font-bold text-slate-700 mb-1">
                  Pilih Angkatan Pelatihan <span className="text-rose-500">*</span>
                </label>
                <select
                  className="form-input w-full text-xs font-bold text-indigo-900 bg-white"
                  value={angkatanId}
                  onChange={(e) => {
                    setAngkatanId(e.target.value);
                    setAngkatanHint('Dipilih manual oleh admin.');
                  }}
                >
                  {angkatanList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama_angkatan} ({a.kode_angkatan}) — {a.tahun}
                    </option>
                  ))}
                </select>
                {angkatanHint && (
                  <p className="text-[11px] text-indigo-700/80 italic mt-1.5">{angkatanHint}</p>
                )}
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
                  {tempatOptions(tempatList, tempatPelatihan).map((label) => (
                    <option key={label} value={label}>
                      {label === currentPendaftar.tempat_pelatihan && currentPendaftar.tempat_pelatihan ? `${label} — pilihan peserta` : label}
                    </option>
                  ))}
                </select>
                {currentPendaftar.tempat_pelatihan ? (
                  tempatPelatihan === currentPendaftar.tempat_pelatihan ? (
                    <p className="text-[11px] text-emerald-700 italic mt-1.5">Mengikuti pilihan peserta saat mendaftar, masih bisa diubah.</p>
                  ) : (
                    <p className="text-[11px] text-amber-700 italic mt-1.5">Diubah admin dari pilihan peserta: {currentPendaftar.tempat_pelatihan}</p>
                  )
                ) : (
                  <p className="text-[11px] text-slate-500 italic mt-1.5">Peserta tidak memilih tempat saat mendaftar, silakan tentukan.</p>
                )}
              </div>
            </div>
            {mode === 'validasi' && (
              <p className="text-[11px] text-indigo-700/80 italic mt-2 px-1">
                Alokasi ini pratinjau awal — penetapan final dilakukan pada Tahap 2 Verifikasi.
              </p>
            )}
          </Section>
          )}

          {/* Data Fisik — menu Validasi & Verifikasi (input), menu Semua Peserta (tampilan) */}
          {mode !== 'semua' && (
          <Section title={mode === 'validasi' ? '3. Data Fisik Peserta' : '3. Pemeriksaan Data Fisik & Ukuran Seragam'}>
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
          )}

          {/* Berkas & catatan — hanya di menu Verifikasi */}
          {mode === 'verifikasi' && (
          <Section title="4. Tahap 2 — Checklist Berkas & Dokumen Persyaratan">
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
          )}

          {/* Section 4b: Catatan verifikasi — hanya di menu Verifikasi */}
          {mode === 'verifikasi' && (
          <Section title="4b. Catatan Verifikasi (wajib jika menolak)">
            <div className="p-5 rounded-2xl bg-white border border-slate-200">
              <textarea
                value={catatanVerifikasi}
                onChange={(e) => setCatatanVerifikasi(e.target.value)}
                rows={2}
                placeholder="Contoh: Berkas lengkap, siap masuk angkatan."
                className="form-input w-full text-xs"
              />
              {currentPendaftar.catatan_verifikasi && (
                <p className="text-[11px] text-slate-500 mt-1">Catatan tersimpan: {currentPendaftar.catatan_verifikasi}</p>
              )}
            </div>
          </Section>
          )}

          {/* Ringkasan status & penempatan — hanya di menu Semua Peserta */}
          {mode === 'semua' && (
          <Section title="Status Akhir, Angkatan & Tempat Pelatihan">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-slate-500 font-bold">Status Akhir (bisa diubah)</span>
                <select
                  value={currentPendaftar.status}
                  disabled={loading}
                  onChange={async (e) => {
                    const next = e.target.value as Pendaftar['status'];
                    if (next === currentPendaftar.status) return;
                    const label = STATUS_AKHIR_OPTIONS.find((o) => o.value === next)?.label || next;
                    if (!window.confirm(`Ubah status akhir ${currentPendaftar.nama_lengkap} menjadi "${label}"?`)) return;
                    setNotification(null);
                    setLoading(true);
                    try {
                      const res = await pendaftarApi.updateStatusAkhir(currentPendaftar.id, next);
                      if (res.success && res.data) {
                        setCurrentPendaftar(res.data);
                        setNotification({ type: 'success', message: res.message || `Status akhir diubah menjadi ${label}.` });
                        onStatusChange();
                      } else {
                        setNotification({ type: 'error', message: res.error || 'Gagal mengubah status akhir.' });
                      }
                    } catch (err: any) {
                      setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="form-input text-xs font-bold text-indigo-900 bg-indigo-50/60 border-indigo-200 disabled:opacity-60"
                >
                  {STATUS_AKHIR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-slate-500 font-bold">Tahap</span>
                <span className={getTahapBadgeClass(currentPendaftar)}>{getTahapLabel(currentPendaftar)}</span>
              </div>
              {currentPendaftar.status === 'lulus' && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 leading-relaxed">
                  Status Lulus terisi otomatis saat peserta dinyatakan lulus di menu Kelulusan & Sertifikat. Masih bisa diubah manual bila keliru.
                </p>
              )}
              {currentPendaftar.status === 'keluar' && (
                <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 leading-relaxed">
                  Peserta tercatat keluar / tidak melanjutkan pelatihan: jadwal sesi dilepas dan menu peserta dikunci.
                </p>
              )}
              <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Angkatan</span>
                  <span className="font-bold text-slate-800">
                    {currentPendaftar.angkatan?.nama_angkatan || (currentPendaftar.angkatan_id ? 'Sudah ditetapkan' : 'Belum masuk angkatan')}
                  </span>
                  {currentPendaftar.angkatan && (
                    <span className="block text-[11px] text-slate-500 font-medium">
                      {currentPendaftar.angkatan.kode_angkatan} • Tahun {currentPendaftar.angkatan.tahun} • {currentPendaftar.angkatan.status}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tempat Pelatihan</span>
                  <span className="font-bold text-slate-800">{currentPendaftar.tempat_pelatihan || 'Belum ditentukan'}</span>
                </div>
              </div>
            </div>
          </Section>
          )}

          {/* Data fisik (tampilan) — hanya di menu Semua Peserta */}
          {mode === 'semua' && (
          <Section title="Data Fisik Peserta">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Tinggi</span>
                  <span className="font-bold text-slate-800">{currentPendaftar.tinggi_badan ? `${currentPendaftar.tinggi_badan} cm` : '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Berat</span>
                  <span className="font-bold text-slate-800">{currentPendaftar.berat_badan ? `${currentPendaftar.berat_badan} kg` : '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Lingkar Pinggang</span>
                  <span className="font-bold text-slate-800">{currentPendaftar.lingkar_pinggang ? `${currentPendaftar.lingkar_pinggang} cm` : '-'}</span>
                </div>
              </div>
              {bmiValue && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-medium">
                    BMI: <span className="font-bold text-slate-900">{bmiValue} kg/m²</span>
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
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Riwayat Penyakit</span>
                <span className="font-medium text-slate-800">{currentPendaftar.riwayat_penyakit || 'Tidak ada'}</span>
              </div>
            </div>
          </Section>
          )}

          {/* Section 5: Informasi Pembayaran (Jika Sudah Diterima; tidak di menu Validasi) */}
          {mode !== 'validasi' && currentPendaftar.status === 'diterima' && (
            <Section title="5. Status Pembayaran Pelatihan">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                {(currentPendaftar.status_pembayaran || 'belum_bayar') !== 'lunas' && (
                  <TenggatBanner pendaftarId={currentPendaftar.id} />
                )}
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

          {/* Action Buttons Panel — hanya di menu Verifikasi */}
          {mode === 'verifikasi' && (
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleVerifikasiTolak}
              disabled={loading || statusValidasi !== 'diterima'}
              title={statusValidasi !== 'diterima' ? 'Selesaikan validasi dulu' : 'Tolak di tahap verifikasi'}
              className="btn btn-danger btn-sm font-bold disabled:opacity-60"
            >
              Tolak di Verifikasi
            </button>
            <button
              type="button"
              onClick={handleVerifikasiDanTerima}
              disabled={loading || statusValidasi !== 'diterima'}
              title={statusValidasi !== 'diterima' ? 'Selesaikan validasi dulu' : 'Terima + masuk angkatan & jadwal'}
              className="btn btn-accent btn-sm bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 font-bold px-6 py-2.5 text-xs shadow-md flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Memproses Verifikasi...' : 'Verifikasi & Terima (Masuk Angkatan + Jadwal)'}
            </button>
          </div>
          )}
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
