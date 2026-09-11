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

export function composeAlamat(data: {
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  desa_kelurahan?: string;
  detail_alamat?: string;
}): string {
  const parts = [
    data.provinsi?.trim(),
    data.kabupaten_kota?.trim(),
    data.kecamatan?.trim(),
    data.desa_kelurahan?.trim(),
  ].filter(Boolean);

  if (data.detail_alamat?.trim()) {
    parts.push(data.detail_alamat.trim());
  }

  return parts.join(', ');
}

export function parseAlamat(alamatStr: string): {
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  desa_kelurahan?: string;
  detail_alamat?: string;
} {
  if (!alamatStr) return {};
  const parts = alamatStr.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) return {};
  if (parts.length === 1) return { detail_alamat: parts[0] };

  return {
    provinsi: parts[0] || '',
    kabupaten_kota: parts[1] || '',
    kecamatan: parts[2] || '',
    desa_kelurahan: parts[3] || '',
    detail_alamat: parts.length > 4 ? parts.slice(4).join(', ') : '',
  };
}

// --- Form Data Mapper (camelCase form → snake_case API) ---

export function formToApiPayload(form: PendaftarFormData) {
  return {
    nama_lengkap: form.nama_lengkap,
    nik: form.nik,
    tempat_lahir: form.tempat_lahir,
    tanggal_lahir: form.tanggal_lahir,
    alamat: form.alamat_lengkap.trim() || composeAlamat(form),
    tinggi_badan: form.tinggi_badan,
    berat_badan: form.berat_badan,
    lingkar_pinggang: form.lingkar_pinggang,
    riwayat_penyakit: form.riwayat_penyakit,
    no_hp: form.no_hp,
    email: form.email,
    jenis_pelatihan: form.jenis_pelatihan,
    program_id: form.program_id,
    motivasi: form.motivasi,
  };
}
