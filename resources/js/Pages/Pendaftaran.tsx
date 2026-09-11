'use client';

import { useState } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import StepIndicator from '@/Components/StepIndicator';
import Step1DataDiri from '@/Components/Step1DataDiri';
import Step2DataFisik from '@/Components/Step2DataFisik';
import Step3KontakDarurat from '@/Components/Step3KontakDarurat';
import Step4PilihanPelatihan from '@/Components/Step4PilihanPelatihan';
import { type PendaftarFormData, formToApiPayload } from '@/lib/storage';
import { pendaftarApi } from '@/lib/api';
import type { Pendaftar } from '@/lib/types';

const STEP_LABELS = ['Data Diri', 'Data Fisik', 'Kontak', 'Pelatihan'];

const initialFormData: PendaftarFormData = {
  nama_lengkap: '',
  nik: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  alamat_lengkap: '',
  provinsi: '',
  kabupaten_kota: '',
  kecamatan: '',
  desa_kelurahan: '',
  tinggi_badan: '',
  berat_badan: '',
  lingkar_pinggang: '',
  riwayat_penyakit: '',
  no_hp: '',
  email: '',
  jenis_pelatihan: '',
  motivasi: '',
  username: '',
  password: '',
};

export default function PendaftaranPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PendaftarFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [no_pendaftaran, setno_pendaftaran] = useState('');

  const handleChange = (field: keyof PendaftarFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.nama_lengkap.trim()) newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
      if (!formData.nik.trim()) newErrors.nik = 'NIK wajib diisi';
      else if (formData.nik.length !== 16) newErrors.nik = 'NIK harus 16 digit';
      if (!formData.tempat_lahir.trim()) newErrors.tempat_lahir = 'Tempat lahir wajib diisi';
      if (!formData.tanggal_lahir) newErrors.tanggal_lahir = 'Tanggal lahir wajib diisi';
      else {
        const birthDate = new Date(formData.tanggal_lahir);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const birthdayPassed =
          today.getMonth() > birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
        if (!birthdayPassed) age--;
        if (age < 18) newErrors.tanggal_lahir = 'Usia peserta harus minimal 18 tahun';
      }
      if (!formData.alamat_lengkap.trim()) newErrors.alamat_lengkap = 'Alamat lengkap wajib diisi';
      if (!formData.provinsi?.trim()) newErrors.provinsi = 'Provinsi wajib dipilih';
      if (!formData.kabupaten_kota?.trim()) newErrors.kabupaten_kota = 'Kabupaten/Kota wajib dipilih';
      if (!formData.kecamatan?.trim()) newErrors.kecamatan = 'Kecamatan wajib dipilih';
      if (!formData.desa_kelurahan?.trim()) newErrors.desa_kelurahan = 'Kelurahan wajib dipilih';
    }

    if (step === 2) {
      if (!formData.tinggi_badan) newErrors.tinggi_badan = 'Tinggi badan wajib diisi';
      else if (Number(formData.tinggi_badan) < 100 || Number(formData.tinggi_badan) > 250)
        newErrors.tinggi_badan = 'Tinggi badan harus antara 100-250 cm';
      if (!formData.berat_badan) newErrors.berat_badan = 'Berat badan wajib diisi';
      else if (Number(formData.berat_badan) < 30 || Number(formData.berat_badan) > 200)
        newErrors.berat_badan = 'Berat badan harus antara 30-200 kg';
      if (
        formData.tinggi_badan &&
        formData.berat_badan &&
        Number(formData.tinggi_badan) > 0 &&
        Number(formData.berat_badan) > 0
      ) {
        const heightInMeters = Number(formData.tinggi_badan) / 100;
        const bmi = Number(formData.berat_badan) / (heightInMeters * heightInMeters);
        if (bmi < 18) newErrors.berat_badan = 'BMI peserta harus minimal 18';
      }
      if (!formData.lingkar_pinggang) newErrors.lingkar_pinggang = 'Lingkar pinggang wajib diisi';
      else if (Number(formData.lingkar_pinggang) < 30 || Number(formData.lingkar_pinggang) > 200)
        newErrors.lingkar_pinggang = 'Lingkar pinggang harus antara 30-200 cm';
    }

    if (step === 3) {
      if (!formData.no_hp.trim()) newErrors.no_hp = 'Nomor HP wajib diisi';
      else if (formData.no_hp.length < 10 || formData.no_hp.length > 13) newErrors.no_hp = 'Nomor HP harus 10-13 digit';
      if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Format email tidak valid';
      
    }

    if (step === 4) {
      if (!formData.jenis_pelatihan) newErrors.jenis_pelatihan = 'Pilih salah satu program pelatihan';
      if (!formData.motivasi.trim()) newErrors.motivasi = 'Motivasi wajib diisi';
      else if (formData.motivasi.trim().length < 20) newErrors.motivasi = 'Motivasi minimal 20 karakter';
      if (!formData.username?.trim()) newErrors.username = 'Username wajib diisi';
      else if (formData.username.trim().length < 4) newErrors.username = 'Username minimal 4 karakter';
      if (!formData.password?.trim()) newErrors.password = 'Password wajib diisi';
      else if (formData.password.trim().length < 6) newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [createdPendaftar, setCreatedPendaftar] = useState<Pendaftar | null>(null);

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    try {
      const res = await pendaftarApi.create(formToApiPayload(formData));
      const pendaftar = res.data;
      if (res.success && pendaftar) {
        setCreatedPendaftar(pendaftar);
        setno_pendaftaran(pendaftar.no_pendaftaran);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(res.error || 'Gagal mengirim pendaftaran. Mohon periksa data Anda.');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.message || 'Gagal mengirim pendaftaran.');
    }
  };

  // Success Screen
  if (isSubmitted) {
    const selectedPelatihan = formData.jenis_pelatihan;
    return (
      <>
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container-narrow">
            <div className="glass-card-static p-8 md:p-12 text-center animate-slide-up">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                Pendaftaran Berhasil!
              </h1>
              <p className="text-[var(--text-secondary)] mb-8">
                Data pendaftaran Anda telah kami terima dan sedang menunggu validasi admin.
              </p>

              <div className="bg-[var(--surface)] rounded-xl p-6 mb-8">
                <div className="text-sm text-[var(--text-secondary)] mb-2">Nomor Pendaftaran Anda</div>
                <div className="text-3xl font-bold text-gradient tracking-wider">{no_pendaftaran}</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-2">Simpan nomor ini untuk mengecek status</div>
              </div>

              <div className="text-left bg-[var(--surface)] rounded-xl p-6 mb-8">
                <h3 className="font-bold text-[var(--text-primary)] mb-4 text-sm">Ringkasan Pendaftaran</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Nama</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formData.nama_lengkap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">NIK</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formData.nik}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Program</span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedPelatihan}</span>
                  </div>
                  {createdPendaftar?.angkatan?.nama_angkatan && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Alokasi Angkatan</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                        {createdPendaftar.angkatan?.nama_angkatan} (On Going / Terjadwal)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Status</span>
                    <span className="badge badge-pending">Menunggu Validasi</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => router.visit(`/status?no=${no_pendaftaran}`)} className="btn btn-primary">
                  Cek Status Pendaftaran
                </button>
                <button onClick={() => router.visit('/')} className="btn btn-outline">
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 py-8 md:py-12">
        <div className="container-narrow">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Formulir Pendaftaran</h1>
            <p className="text-[var(--text-secondary)] text-sm">Lengkapi semua data berikut untuk mendaftar program pelatihan</p>
          </div>

          <StepIndicator currentStep={currentStep} totalSteps={4} labels={STEP_LABELS} />

          <div className="glass-card-static p-6 md:p-10">
            {currentStep === 1 && <Step1DataDiri data={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 2 && <Step2DataFisik data={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 3 && <Step3KontakDarurat data={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 4 && <Step4PilihanPelatihan data={formData} onChange={handleChange} errors={errors} />}

            <div className="flex justify-between mt-10 pt-6 border-t border-[var(--card-border)]">
              <button onClick={handlePrev} className="btn btn-ghost" disabled={currentStep === 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Sebelumnya
              </button>
              {currentStep < 4 ? (
                <button onClick={handleNext} className="btn btn-primary">
                  Selanjutnya
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              ) : (
                <button onClick={handleSubmit} className="btn btn-accent">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Kirim Pendaftaran
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}





