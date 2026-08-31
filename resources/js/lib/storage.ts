// ============================================================
// UI Utility helpers — no more localStorage CRUD
// Types are in @/lib/types, API calls in @/lib/api
// ============================================================

import type { PendaftarStatus, StatusPembayaran, PendaftarFormData } from '@/lib/types';

// Re-export types for backward compatibility
export type {
  Pendaftar,
  Cicilan,
  JadwalPelatihan,
  SoalUjian,
  Interview,
  PendaftarFormData,
  PendaftarStatus,
  StatusPembayaran,
  Kehadiran,
  Kelulusan,
  Angkatan,
  ProgramPelatihan,
  ProgramPelatihan as Program,
  HasilUjian,
} from '@/lib/types';

// --- Constants ---

export const JENIS_PELATIHAN = [
  'Menjahit',
] as const;

// --- Status Label Helpers ---

export function getStatusLabel(status: PendaftarStatus): string {
  const map: Record<PendaftarStatus, string> = {
    menunggu: 'Menunggu',
    diterima: 'Diterima',
    ditolak: 'Ditolak',
  };
  return map[status] ?? status;
}

export function getStatusBadgeClass(status: PendaftarStatus): string {
  const map: Record<PendaftarStatus, string> = {
    menunggu: 'badge badge-pending',
    diterima: 'badge badge-accepted',
    ditolak: 'badge badge-rejected',
  };
  return map[status] ?? 'badge';
}

export function getStatusPembayaranLabel(status?: StatusPembayaran | null): string {
  if (!status || status === 'belum_bayar') return 'Belum Bayar';
  if (status === 'menunggu_konfirmasi') return 'Menunggu Konfirmasi';
  if (status === 'cicilan_sebagian') return 'Cicilan Sebagian';
  if (status === 'lunas') return 'Lunas';
  return 'Belum Bayar';
}

export function getStatusPembayaranBadgeClass(status?: StatusPembayaran | null): string {
  if (!status || status === 'belum_bayar') return 'badge badge-rejected';
  if (status === 'menunggu_konfirmasi') return 'badge badge-pending';
  if (status === 'cicilan_sebagian') return 'badge badge-processing';
  if (status === 'lunas') return 'badge badge-accepted';
  return 'badge badge-rejected';
}

// --- Address Composer ---

export function composeAlamat(data: Partial<PendaftarFormData>): string {
  const rtRw = [data.rt, data.rw].filter(Boolean).join('/');
  const parts = [
    data.provinsi?.trim(),
    data.kabupaten_kota?.trim(),
    data.kecamatan?.trim(),
    data.desa_kelurahan?.trim(),
    rtRw ? `RT/RW ${rtRw}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

// --- Form Data Mapper (camelCase form → snake_case API) ---

export function formToApiPayload(form: PendaftarFormData) {
  return {
    nama_lengkap: form.nama_lengkap,
    nik: form.nik,
    tempat_lahir: form.tempat_lahir,
    tanggal_lahir: form.tanggal_lahir,
    jenis_kelamin: form.jenis_kelamin,
    alamat: composeAlamat(form),
    tinggi_badan: form.tinggi_badan,
    berat_badan: form.berat_badan,
    lingkar_pinggang: form.lingkar_pinggang,
    riwayat_penyakit: form.riwayat_penyakit,
    no_hp: form.no_hp,
    email: form.email,
    nama_kontak_darurat: form.nama_kontak_darurat,
    no_hp_kontak_darurat: form.no_hp_kontak_darurat,
    hubungan_kontak_darurat: form.hubungan_kontak_darurat,
    jenis_pelatihan: form.jenis_pelatihan,
    program_id: form.program_id,
    motivasi: form.motivasi,
  };
}
