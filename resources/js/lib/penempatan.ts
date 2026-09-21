// ============================================================
// Helper penempatan otomatis: angkatan + tempat pelatihan
// - Angkatan default: cocokkan program + rentang waktu pendaftaran
//   (tgl_mulai_pendaftaran s/d tgl_selesai_pendaftaran mencakup
//   tanggal_daftar peserta). Fallback: status Pendaftaran/On_Going
//   terbaru, lalu yang terbaru secara tanggal.
// - Tempat default: selalu prioritaskan input peserta.
// ============================================================

import type { Angkatan, Pendaftar, TempatPelatihan } from '@/lib/types';

export function tempatLabel(t: TempatPelatihan): string {
  return `${t.nama_tempat} (${t.alamat_lengkap})`;
}

function toTime(v?: string | null): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}

function angkatanSortKey(a: Angkatan): number {
  return (
    toTime(a.tgl_mulai_pendaftaran) ??
    toTime(a.tanggal_mulai) ??
    toTime((a as unknown as { created_at?: string }).created_at) ??
    0
  );
}

export interface DefaultAngkatan {
  angkatan: Angkatan | null;
  reason: string;
}

function fmtDate(v?: string | null): string {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Pilih angkatan default untuk pendaftar.
 * 1. Filter program yang sama (bila pendaftar punya program_id).
 * 2. Cari yang rentang pendaftarannya mencakup tanggal_daftar.
 * 3. Fallback: status Pendaftaran → On_Going → terbaru.
 */
export function pickDefaultAngkatan(
  angkatanList: Angkatan[],
  pendaftar: Pick<Pendaftar, 'program_id' | 'tanggal_daftar' | 'angkatan_id'> & { program?: { id?: string } | null }
): DefaultAngkatan {
  if (angkatanList.length === 0) {
    return { angkatan: null, reason: 'Belum ada data angkatan.' };
  }

  const programId = pendaftar.program_id || pendaftar.program?.id || null;
  const seprogram = programId
    ? angkatanList.filter((a) => a.program_id === programId)
    : [];
  const pool = seprogram.length > 0 ? seprogram : angkatanList;

  const daftarTime = toTime(pendaftar.tanggal_daftar);

  if (daftarTime !== null) {
    const dalamRentang = pool.filter((a) => {
      const mulai = toTime(a.tgl_mulai_pendaftaran);
      const selesai = toTime(a.tgl_selesai_pendaftaran);
      if (mulai === null && selesai === null) return false;
      if (mulai !== null && daftarTime < mulai) return false;
      // Batas selesai inklusif sampai akhir hari.
      if (selesai !== null && daftarTime > selesai + 24 * 60 * 60 * 1000 - 1) return false;
      return true;
    });
    if (dalamRentang.length > 0) {
      dalamRentang.sort((x, y) => angkatanSortKey(y) - angkatanSortKey(x));
      const a = dalamRentang[0];
      return {
        angkatan: a,
        reason: `Otomatis: masa pendaftaran ${fmtDate(a.tgl_mulai_pendaftaran)}–${fmtDate(a.tgl_selesai_pendaftaran)} mencakup tgl daftar ${fmtDate(pendaftar.tanggal_daftar)}.`,
      };
    }
  }

  const byStatus = (s: string) =>
    pool
      .filter((a) => a.status === s)
      .sort((x, y) => angkatanSortKey(y) - angkatanSortKey(x));

  const pendaftaran = byStatus('Pendaftaran');
  if (pendaftaran.length > 0) {
    return { angkatan: pendaftaran[0], reason: 'Otomatis: angkatan dengan status Pendaftaran terbaru.' };
  }
  const ongoing = byStatus('On_Going');
  if (ongoing.length > 0) {
    return { angkatan: ongoing[0], reason: 'Otomatis: angkatan On_Going terbaru (tidak ada yang berstatus Pendaftaran).' };
  }

  const sorted = [...pool].sort((x, y) => angkatanSortKey(y) - angkatanSortKey(x));
  return { angkatan: sorted[0], reason: 'Otomatis: angkatan terbaru (fallback, periksa kesesuaian manual).' };
}

/** Tempat default = input peserta bila ada, else tempat pertama. */
export function resolveDefaultTempat(
  tempatList: TempatPelatihan[],
  pendaftarTempat?: string | null
): string {
  if (pendaftarTempat && pendaftarTempat.trim()) return pendaftarTempat;
  if (tempatList.length > 0) return tempatLabel(tempatList[0]);
  return '';
}

/**
 * Opsi tempat untuk <select>: semua tempat master + input peserta
 * (bila tidak sama persis dengan salah satu master) agar pilihan
 * peserta selalu tampil & terpilih by default. Masih bisa diubah.
 */
export function tempatOptions(
  tempatList: TempatPelatihan[],
  pendaftarTempat?: string | null
): string[] {
  const labels = tempatList.map(tempatLabel);
  const p = (pendaftarTempat || '').trim();
  if (p && !labels.includes(p)) return [p, ...labels];
  return labels;
}
