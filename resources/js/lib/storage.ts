// ============================================================
// UI Utility helpers — no more localStorage CRUD
// Types are in @/lib/types, API calls in @/lib/api
// ============================================================

import type { PendaftarStatus, StatusPembayaran, PendaftarFormData, StatusValidasi, StatusVerifikasi } from '@/lib/types';

// Re-export types for backward compatibility
export type {
  Pendaftar,
  JadwalPelatihan,
  SoalUjian,
  Interview,
  PendaftarFormData,
  PendaftarStatus,
  StatusValidasi,
  StatusVerifikasi,
  StatusPembayaran,
  Kehadiran,
  Kelulusan,
  Angkatan,
  ProgramPelatihan,
  ProgramPelatihan as Program,
  HasilUjian,
} from '@/lib/types';

// --- Status Label Helpers ---

export function getStatusValidasi(p: { status_validasi?: string | null; status?: string }): StatusValidasi {
  if (p.status_validasi) return p.status_validasi as StatusValidasi;
  if (p.status === 'diterima' || p.status === 'lulus' || p.status === 'sudah_bekerja') return 'diterima';
  if (p.status === 'ditolak') return 'ditolak';
  return 'menunggu';
}

export function getStatusVerifikasi(p: { status_verifikasi?: string | null; status?: string; status_validasi?: string | null }): StatusVerifikasi {
  if (p.status_verifikasi) return p.status_verifikasi as StatusVerifikasi;
  if (p.status === 'diterima' || p.status === 'lulus' || p.status === 'sudah_bekerja') return 'diterima';
  if (getStatusValidasi(p as any) === 'diterima') return 'menunggu';
  return 'belum_proses';
}

export function getTahapLabel(p: { status?: string; status_validasi?: string | null; status_verifikasi?: string | null }): string {
  const v = getStatusValidasi(p as any);
  const ver = getStatusVerifikasi(p as any);
  if (p.status === 'ditolak') return v === 'ditolak' ? 'Ditolak di Validasi' : 'Ditolak di Verifikasi';
  if (p.status === 'diterima') return 'Diterima (Selesai)';
  if (p.status === 'lulus') return 'Lulus';
  if (p.status === 'sudah_bekerja') return 'Sudah Bekerja';
  if (p.status === 'keluar') return 'Keluar (Tidak Melanjutkan)';
  if (v === 'menunggu') return 'Tahap 1: Validasi Awal';
  if (ver === 'menunggu' || ver === 'belum_proses') return 'Tahap 2: Verifikasi';
  return 'Menunggu';
}

export function getTahapBadgeClass(p: { status?: string; status_validasi?: string | null; status_verifikasi?: string | null }): string {
  const v = getStatusValidasi(p as any);
  const ver = getStatusVerifikasi(p as any);
  if (p.status === 'ditolak') return 'badge badge-rejected';
  if (p.status === 'diterima') return 'badge badge-accepted';
  if (p.status === 'lulus') return 'badge badge-accepted';
  if (p.status === 'sudah_bekerja') return 'badge badge-processing';
  if (p.status === 'keluar') return 'badge badge-rejected';
  if (v === 'menunggu') return 'badge badge-pending';
  if (ver === 'menunggu' || ver === 'belum_proses') return 'badge badge-processing';
  return 'badge badge-pending';
}

/** Status non-aktif (lulus/sudah_bekerja/keluar/ditolak) tidak lagi ikut jadwal/absensi aktif. */
export function isStatusAktif(status?: string | null): boolean {
  return status === 'diterima';
}

/** Peserta yang sudah melewati seleksi (materi/ujian/sertifikat terbuka). */
export function isSeleksiLolos(status?: string | null): boolean {
  return status === 'diterima' || status === 'lulus' || status === 'sudah_bekerja';
}

/** Anggota angkatan: tetap tercatat walau sudah lulus / sudah bekerja. */
export function isAnggotaAngkatan(status?: string | null): boolean {
  return status === 'diterima' || status === 'lulus' || status === 'sudah_bekerja';
}

// --- Tenggat Pembayaran (11 hari dari hari pertama pelatihan) ---

export function formatTanggalID(v?: string | null): string {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Teks sisa hari menuju batas: "11 hari lagi" / "Hari ini" / "Terlambat 119 hari". */
export function sisaHariText(sisaHari?: number | null): string | null {
  if (sisaHari === null || sisaHari === undefined) return null;
  if (sisaHari > 1) return `${sisaHari} hari lagi`;
  if (sisaHari === 1) return '1 hari lagi (besok)';
  if (sisaHari === 0) return 'Hari ini (terakhir)';
  return `Terlambat ${Math.abs(sisaHari)} hari`;
}

export const STATUS_AKHIR_OPTIONS: { value: PendaftarStatus; label: string }[] = [
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'sudah_bekerja', label: 'Sudah Bekerja' },
  { value: 'keluar', label: 'Keluar (Tidak Melanjutkan)' },
];

export function getStatusLabel(status: PendaftarStatus): string {
  const map: Record<PendaftarStatus, string> = {
    menunggu: 'Menunggu',
    diterima: 'Diterima',
    ditolak: 'Ditolak',
    lulus: 'Lulus',
    sudah_bekerja: 'Sudah Bekerja',
    keluar: 'Keluar',
  };
  return map[status] ?? status;
}

export function getStatusBadgeClass(status: PendaftarStatus): string {
  const map: Record<PendaftarStatus, string> = {
    menunggu: 'badge badge-pending',
    diterima: 'badge badge-accepted',
    ditolak: 'badge badge-rejected',
    lulus: 'badge badge-accepted',
    sudah_bekerja: 'badge badge-processing',
    keluar: 'badge badge-rejected',
  };
  return map[status] ?? 'badge';
}

export function getStatusPembayaranLabel(status?: StatusPembayaran | null): string {
  if (!status || status === 'belum_bayar') return 'Belum Bayar';
  if (status === 'menunggu_konfirmasi') return 'Menunggu Konfirmasi';
  if (status === 'cicilan_sebagian') return 'Bayar Sebagian';
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
    jenis_kelamin: form.jenis_kelamin || undefined,
    alamat: form.alamat_lengkap.trim() || composeAlamat(form),
    provinsi: form.provinsi?.trim() || undefined,
    kabupaten_kota: form.kabupaten_kota?.trim() || undefined,
    kecamatan: form.kecamatan?.trim() || undefined,
    desa_kelurahan: form.desa_kelurahan?.trim() || undefined,
    jenjang_pendidikan: form.jenjang_pendidikan?.trim() || undefined,
    asal_sekolah: form.asal_sekolah?.trim() || undefined,
    tahun_lulus: form.tahun_lulus ? Number(form.tahun_lulus) : undefined,
    tinggi_badan: form.tinggi_badan,
    berat_badan: form.berat_badan,
    lingkar_pinggang: form.lingkar_pinggang,
    riwayat_penyakit: form.riwayat_penyakit,
    no_hp: form.no_hp,
    email: form.email,
    jenis_pelatihan: form.jenis_pelatihan,
    program_id: form.program_id,
    tempat_pelatihan: form.tempat_pelatihan?.trim() || undefined,
    motivasi: form.motivasi,
  };
}
