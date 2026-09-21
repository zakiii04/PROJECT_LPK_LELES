// ============================================================
// Helper hari libur: Minggu + libur nasional Indonesia.
// Dipakai agar penyusunan sesi pelatihan OTOMATIS MELEWATI
// hari Minggu dan tanggal merah (digeser ke hari valid berikut).
// ============================================================

// Libur TETAP tiap tahun (MM-DD)
const LIBUR_TETAP: Record<string, string> = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'Hari Kemerdekaan RI',
  '12-25': 'Hari Raya Natal',
};

// Libur BERGESER (pastikan diperbarui tiap tahun mengikuti SKB 3 Menteri)
const LIBUR_BERGESER: Record<string, string> = {
  // 2025
  '2025-01-27': 'Isra Mikraj Nabi Muhammad SAW',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-29': 'Hari Suci Nyepi (Tahun Baru Saka 1947)',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-04-20': 'Kebangkitan Yesus Kristus (Paskah)',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-06-06': 'Hari Raya Idul Adha 1446 H',
  '2025-06-27': 'Tahun Baru Islam 1447 H',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  // 2026
  '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW 1447 H',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi (Tahun Baru Saka 1948)',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Kebangkitan Yesus Kristus (Paskah)',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-25': 'Maulid Nabi Muhammad SAW 1448 H',
};

export function toKeyTanggal(d?: string | null): string {
  if (!d) return '';
  return d.includes('T') ? d.split('T')[0] : d.slice(0, 10);
}

function geserHari(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isHariMinggu(dateStr: string): boolean {
  const key = toKeyTanggal(dateStr);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return new Date(`${key}T00:00:00`).getDay() === 0;
}

/** Keterangan libur nasional pada tanggal tsb (null bila bukan libur nasional). */
export function keteranganLiburNasional(dateStr: string): string | null {
  const key = toKeyTanggal(dateStr);
  if (!key) return null;
  if (LIBUR_BERGESER[key]) return LIBUR_BERGESER[key];
  const mmdd = key.slice(5);
  return LIBUR_TETAP[mmdd] || null;
}

/** True bila Minggu ATAU libur nasional. */
export function isTanggalMerah(dateStr: string): boolean {
  return isHariMinggu(dateStr) || keteranganLiburNasional(dateStr) !== null;
}

/** Keterangan "Minggu" / nama libur nasional (null bila hari biasa). */
export function keteranganTanggalMerah(dateStr: string): string | null {
  if (isHariMinggu(dateStr)) return 'Hari Minggu';
  return keteranganLiburNasional(dateStr);
}

/**
 * tanggal mulai + offset HARI VALID (melewati Minggu & tanggal merah).
 * offset 0 = tanggal mulai itu sendiri bila valid, atau hari valid berikut.
 */
export function tambahHariValid(startDate: string, offset: number): string {
  let cur = toKeyTanggal(startDate);
  while (isTanggalMerah(cur)) cur = geserHari(cur, 1);
  for (let k = 0; k < offset; k++) {
    cur = geserHari(cur, 1);
    while (isTanggalMerah(cur)) cur = geserHari(cur, 1);
  }
  return cur;
}

/** Jumlah hari Minggu/libur nasional pada rentang inklusif (untuk info di form). */
export function hitungHariLibur(mulai: string, selesai: string): number {
  const a = toKeyTanggal(mulai);
  const b = toKeyTanggal(selesai);
  if (!a || !b || b < a) return 0;
  let n = 0;
  let cur = a;
  for (let i = 0; i < 370 && cur <= b; i++) {
    if (isTanggalMerah(cur)) n++;
    cur = geserHari(cur, 1);
  }
  return n;
}
