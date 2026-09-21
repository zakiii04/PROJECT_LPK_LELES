'use client';

import { useState, useEffect } from 'react';
import type { Pendaftar, Angkatan, TempatPelatihan } from '@/lib/types';
import { pendaftarApi, angkatanApi, tempatApi } from '@/lib/api';
import { parseAlamat, getStatusValidasi } from '@/lib/storage';
import { pickDefaultAngkatan, resolveDefaultTempat, tempatLabel, tempatOptions } from '@/lib/penempatan';

export interface VerifikasiPesertaModalProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onSuccess: () => void;
}

export const LIST_BERKAS_PERSYARATAN = [
  { id: 'KTP', label: 'Fotocopy / Asli Kartu Tanda Penduduk (KTP)', required: true },
  { id: 'KK', label: 'Fotocopy / Asli Kartu Keluarga (KK)', required: true },
  { id: 'SURAT_KELULUSAN', label: 'Surat Kelulusan SMA/SMK / Ijazah Terakhir', required: true },
  { id: 'SURAT_IZIN_ORTU', label: 'Surat Izin Orang Tua / Wali', required: false },
  { id: 'PAS_FOTO', label: 'Pas Foto Terbaru (3x4 & 4x6)', required: true },
  { id: 'SURAT_SEHAT', label: 'Surat Keterangan Sehat dari Dokter', required: true },
];

export default function VerifikasiPesertaModal({
  pendaftar,
  onClose,
  onSuccess,
}: VerifikasiPesertaModalProps) {
  const [tinggiBadan, setTinggiBadan] = useState(pendaftar.tinggi_badan || '');
  const [beratBadan, setBeratBadan] = useState(pendaftar.berat_badan || '');
  const [lingkarPinggang, setLingkarPinggang] = useState(pendaftar.lingkar_pinggang || '');

  // Angkatan & Tempat Pelatihan Selection
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>([]);
  const [angkatanId, setAngkatanId] = useState<string>(pendaftar.angkatan_id || '');
  const [tempatPelatihan, setTempatPelatihan] = useState<string>(pendaftar.tempat_pelatihan || '');
  
  // Default checklist
  const [selectedBerkas, setSelectedBerkas] = useState<string[]>(
    Array.isArray(pendaftar.berkas_verifikasi) ? pendaftar.berkas_verifikasi : []
  );

  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [catatanVerifikasi, setCatatanVerifikasi] = useState<string>(pendaftar.catatan_verifikasi || '');
  const [angkatanHint, setAngkatanHint] = useState<string>('');
  const lolosValidasi = getStatusValidasi(pendaftar) === 'diterima';

  useEffect(() => {
    Promise.all([angkatanApi.list(), tempatApi.list()]).then(([aRes, tRes]) => {
      const aData = aRes.data || [];
      const tData = tRes.data || [];
      setAngkatanList(aData);
      setTempatList(tData);

      // Angkatan default: cocokkan program + rentang waktu pendaftaran
      // mencakup tanggal daftar (bukan asal ambil index pertama).
      if (!pendaftar.angkatan_id && aData.length > 0) {
        const picked = pickDefaultAngkatan(aData, pendaftar);
        if (picked.angkatan) {
          setAngkatanId(picked.angkatan.id);
          setAngkatanHint(picked.reason);
        }
      }
      // Tempat default: prioritaskan input peserta.
      if (!pendaftar.tempat_pelatihan && tData.length > 0) {
        setTempatPelatihan(tempatLabel(tData[0]));
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BMI calculation
  const tinggiM = Number(tinggiBadan) / 100;
  const bmiRaw = tinggiM > 0 && Number(beratBadan) > 0
    ? Number(beratBadan) / (tinggiM * tinggiM)
    : null;
  const bmiValue = bmiRaw !== null ? bmiRaw.toFixed(1) : null;
  const birthDate = new Date(pendaftar.tanggal_lahir);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age--;
  const bmiNumber = bmiRaw ?? 0;
  const eligibilityError = age < 18
    ? 'Peserta belum berusia minimal 18 tahun.'
    : bmiNumber < 18
      ? `BMI peserta ${bmiValue || '0'} dan harus minimal 18.`
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

  const handleSelectAll = () => {
    if (selectedBerkas.length === LIST_BERKAS_PERSYARATAN.length) {
      setSelectedBerkas([]);
    } else {
      setSelectedBerkas(LIST_BERKAS_PERSYARATAN.map((b) => b.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAttemptedSubmit(true);

    if (!lolosValidasi) {
      setErrorMsg('Pendaftar belum lolos Tahap 1 Validasi. Selesaikan validasi awal terlebih dahulu.');
      return;
    }

    if (eligibilityError) {
      setErrorMsg(`Verifikasi gagal: ${eligibilityError}`);
      return;
    }

    // Validate mandatory documents
    const missingRequired = LIST_BERKAS_PERSYARATAN.filter(
      (b) => b.required && !selectedBerkas.includes(b.id)
    );

    if (missingRequired.length > 0) {
      setErrorMsg(
        `Verifikasi Gagal: Semua berkas bertanda (*) wajib dicentang untuk menerima peserta. Ada ${missingRequired.length} berkas wajib yang belum diserahkan.`
      );
      return;
    }

    if (!angkatanId) {
      setErrorMsg('Angkatan wajib dipilih. Peserta yang diterima otomatis masuk angkatan & jadwal.');
      return;
    }

    setLoading(true);

    try {
      const res = await pendaftarApi.verifikasi(pendaftar.id, 'diterima', {
        tinggi_badan: tinggiBadan,
        berat_badan: beratBadan,
        lingkar_pinggang: lingkarPinggang,
        berkas_verifikasi: selectedBerkas,
        angkatan_id: angkatanId,
        tempat_pelatihan: tempatPelatihan,
        catatan_verifikasi: catatanVerifikasi || undefined,
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan verifikasi peserta.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setErrorMsg(null);
    if (!catatanVerifikasi.trim()) {
      setErrorMsg('Alasan penolakan wajib diisi pada tahap verifikasi.');
      return;
    }
    setRejecting(true);
    try {
      const res = await pendaftarApi.verifikasi(pendaftar.id, 'ditolak', {
        catatan_verifikasi: catatanVerifikasi,
      });
      if (res.success) onSuccess();
      else setErrorMsg(res.error || 'Gagal menolak peserta.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setRejecting(false);
    }
  };

  const totalBiaya = pendaftar.program?.harga || pendaftar.biaya_pelatihan || 0;

  const parsedAlamat = parseAlamat(pendaftar.alamat || '');
  const displayProvinsi = pendaftar.provinsi || parsedAlamat.provinsi || '-';
  const displayKota = pendaftar.kabupaten_kota || parsedAlamat.kabupaten_kota || '-';
  const displayKecamatan = pendaftar.kecamatan || parsedAlamat.kecamatan || '-';
  const displayKelurahan = pendaftar.desa_kelurahan || parsedAlamat.desa_kelurahan || '-';

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div
        className="modal-content max-w-2xl w-full mx-4 shadow-2xl overflow-hidden rounded-2xl border border-[var(--card-border)] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tahap 2 — Verifikasi & Penempatan Peserta</h2>
              <p className="text-xs text-slate-500 font-medium">
                {pendaftar.nama_lengkap} • No. Reg: <span className="font-mono text-indigo-600 font-bold">{pendaftar.no_pendaftaran}</span>
                {' • '}Validasi: <span className="font-bold text-emerald-700">Lolos</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/60 transition-colors text-slate-400 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {!lolosValidasi && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-800">
              Pendaftar ini belum lolos Tahap 1 Validasi. Selesaikan validasi awal dulu sebelum verifikasi berkas.
            </div>
          )}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5 shadow-2xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-rose-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Ringkasan Data Diri Peserta */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                1. Ringkasan Data Diri & Program
              </span>
              <span className="text-xs font-extrabold text-indigo-700">
                {totalBiaya > 0 ? `Biaya: Rp ${totalBiaya.toLocaleString('id-ID')}` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Nama Lengkap</span>
                <span className="font-bold text-slate-800">{pendaftar.nama_lengkap}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">NIK (KTP)</span>
                <span className="font-mono text-slate-700">{pendaftar.nik}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800">{pendaftar.jenis_kelamin || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">No. Handphone / WA</span>
                <span className="font-mono text-slate-700">{pendaftar.no_hp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Email</span>
                <span className="font-mono text-slate-700 truncate block">{pendaftar.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Program Pelatihan</span>
                <span className="font-bold text-indigo-700">{pendaftar.program?.nama || pendaftar.jenis_pelatihan}</span>
              </div>
            </div>

            {/* Rincian Wilayah & Alamat Peserta */}
            <div className="border-t border-indigo-100/70 pt-2.5 space-y-2">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                Rincian Alamat & Wilayah Domisili
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Provinsi</span>
                  <span className="font-semibold text-slate-800 block truncate" title={displayProvinsi}>
                    {displayProvinsi}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Kota / Kab</span>
                  <span className="font-semibold text-slate-800 block truncate" title={displayKota}>
                    {displayKota}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Kecamatan</span>
                  <span className="font-semibold text-slate-800 block truncate" title={displayKecamatan}>
                    {displayKecamatan}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Kelurahan / Desa</span>
                  <span className="font-semibold text-slate-800 block truncate" title={displayKelurahan}>
                    {displayKelurahan}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-indigo-100/60">
                <span className="font-bold text-slate-600">Alamat Lengkap:</span> {pendaftar.alamat || '-'}
              </div>
            </div>
          </div>

          {/* Section 2: Angkatan & Tempat Pelatihan Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Alokasi Angkatan & Tempat Pelatihan (Otomatis Masuk Jadwal)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                  Pilih Angkatan Pelatihan <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  className="form-input w-full text-xs font-bold text-indigo-900"
                  value={angkatanId}
                  onChange={(e) => {
                    setAngkatanId(e.target.value);
                    setAngkatanHint('Dipilih manual oleh admin.');
                  }}
                  required
                >
                  {angkatanList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama_angkatan} ({a.kode_angkatan}) — Tahun {a.tahun}
                    </option>
                  ))}
                </select>
                {angkatanHint && (
                  <p className="text-[11px] text-indigo-700/80 italic mt-1">{angkatanHint}</p>
                )}
              </div>

              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                  Pilih Tempat / Lokasi Pelatihan <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  className="form-input w-full text-xs font-bold text-indigo-900"
                  value={tempatPelatihan}
                  onChange={(e) => setTempatPelatihan(e.target.value)}
                  required
                >
                  {tempatOptions(tempatList, tempatPelatihan).map((label) => (
                    <option key={label} value={label}>
                      {label === pendaftar.tempat_pelatihan && pendaftar.tempat_pelatihan ? `${label} — pilihan peserta` : label}
                    </option>
                  ))}
                </select>
                {pendaftar.tempat_pelatihan && (
                  <p className="text-[11px] text-emerald-700 italic mt-1">
                    {tempatPelatihan === pendaftar.tempat_pelatihan
                      ? 'Mengikuti pilihan peserta saat mendaftar, masih bisa diubah.'
                      : `Diubah admin dari pilihan peserta: ${pendaftar.tempat_pelatihan}`}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Ketika diverifikasi diterima, peserta akan langsung terhubung ke seluruh jadwal yang dibuat untuk Angkatan dan Tempat Pelatihan ini.
            </p>
          </div>

          {/* Section 3: Data Fisik */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 rounded-full bg-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Cek Ulang Ukuran & Data Fisik
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                  Tinggi Badan (cm) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                  className="form-input w-full text-sm font-medium"
                  placeholder="Contoh: 165"
                  required
                />
              </div>
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                  Berat Badan (kg) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                  className="form-input w-full text-sm font-medium"
                  placeholder="Contoh: 55"
                  required
                />
              </div>
              <div>
                <label className="form-label block text-[11px] font-semibold text-slate-700 mb-1">
                  Lingkar Pinggang (cm) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={lingkarPinggang}
                  onChange={(e) => setLingkarPinggang(e.target.value)}
                  className="form-input w-full text-sm font-medium"
                  placeholder="Contoh: 75"
                  required
                />
              </div>
            </div>

            {/* BMI Live Preview */}
            {bmiValue && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
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

          {eligibilityError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-800 flex items-start gap-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-amber-600">
                <path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <span>Peserta belum dapat diterima: {eligibilityError}</span>
            </div>
          )}

          {/* Section 4: Checklist Berkas / Persyaratan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  4. Checklist Berkas Persyaratan Peserta
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {selectedBerkas.length === LIST_BERKAS_PERSYARATAN.length ? 'Hapus Semua' : 'Pilih Semua'}
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Centang berkas yang diserahkan. Berkas bertanda (<span className="text-rose-500 font-bold">*</span>) <strong className="text-slate-800">WAJIB ADA</strong> untuk menerima peserta:
            </p>

            <div className="space-y-2">
              {LIST_BERKAS_PERSYARATAN.map((berkas) => {
                const isChecked = selectedBerkas.includes(berkas.id);
                const isMissingRequired = attemptedSubmit && berkas.required && !isChecked;

                return (
                  <label
                    key={berkas.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isMissingRequired
                        ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-200'
                        : isChecked
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleBerkas(berkas.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <span className={`text-xs font-semibold ${isChecked ? 'text-indigo-950' : 'text-slate-700'}`}>
                      {berkas.label}
                      {berkas.required && <span className="text-rose-500 font-bold text-sm ml-1">*</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-slate-400 font-medium">
                <span className="text-rose-500 font-bold">*</span> Wajib ada kecuali Surat Izin Ortu
              </span>
              <span className="font-semibold text-slate-700">
                {selectedBerkas.length} dari {LIST_BERKAS_PERSYARATAN.length} berkas dicentang
              </span>
            </div>
          </div>

          {/* Catatan verifikasi */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-4 rounded-full bg-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                5. Catatan Verifikasi (wajib jika menolak)
              </h3>
            </div>
            <textarea
              value={catatanVerifikasi}
              onChange={(e) => setCatatanVerifikasi(e.target.value)}
              rows={2}
              placeholder="Contoh: Berkas lengkap, fisik memenuhi syarat, siap masuk angkatan. / Ditolak karena berkas tidak lengkap."
              className="form-input w-full text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || rejecting}
              className="btn btn-secondary btn-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading || rejecting || !lolosValidasi}
              className="btn btn-sm font-bold bg-rose-600 hover:bg-rose-700 text-white border-rose-600 disabled:opacity-60"
            >
              {rejecting ? 'Menolak...' : 'Tolak di Verifikasi'}
            </button>
            <span
              onClick={() => {
                if (eligibilityError) {
                  setErrorMsg(`Verifikasi gagal: ${eligibilityError}`);
                  window.alert(`Peserta belum dapat diverifikasi.\n${eligibilityError}`);
                }
              }}
              style={{ cursor: eligibilityError ? 'not-allowed' : 'pointer' }}
              className={`inline-flex ${eligibilityError ? '!cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <button
                type="submit"
                disabled={loading || rejecting || Boolean(eligibilityError) || !lolosValidasi}
                aria-disabled={Boolean(eligibilityError) || !lolosValidasi}
                style={{ cursor: eligibilityError || !lolosValidasi ? 'not-allowed' : 'pointer' }}
                className={`btn btn-accent btn-sm flex items-center gap-2 px-5 font-bold ${eligibilityError || !lolosValidasi
                  ? 'pointer-events-none !cursor-not-allowed bg-slate-300 text-slate-500 border-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Verifikasi & Terima Peserta</span>
                  </>
                )}
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
