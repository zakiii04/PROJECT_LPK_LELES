// ============================================================
// Helper "Kelas" — kelas = kombinasi angkatan_id + tempat_pelatihan
// Dipakai Admin (Kelola Kelas / Jadwal / Penilaian) & badge sidebar.
// ============================================================

import type { Angkatan, JadwalPelatihan, Pendaftar, TempatPelatihan } from '@/lib/types';

export interface KelasCard {
  key: string;
  angkatan: Angkatan;
  tempat_pelatihan: string;
  ruangan: string;
  pengajar: string;
  schedules: JadwalPelatihan[];
  pesertaCount: number;
}

export function matchesTempat(venue: string, filter: string) {
  if (!filter || filter === 'semua') return true;
  if (!venue) return false;
  const normVenue = venue.toLowerCase();
  const normFilter = filter.toLowerCase();

  if (normFilter.includes('utama')) return normVenue.includes('utama');
  if (normFilter.includes('workshop') || normFilter.includes('menjahit')) return normVenue.includes('workshop') || normVenue.includes('menjahit');
  if (normFilter.includes('garut') || normFilter.includes('cabang') || normFilter.includes('kampus')) return normVenue.includes('garut') || normVenue.includes('cabang') || normVenue.includes('kampus');

  return normVenue.includes(normFilter) || normFilter.includes(normVenue);
}

export function getSchedulesForKelas(
  jadwalList: JadwalPelatihan[],
  angkatanId: string,
  venue: string
) {
  return jadwalList.filter((schedule) =>
    schedule.angkatan_id === angkatanId &&
    (schedule.tempat_pelatihan === venue || matchesTempat(schedule.tempat_pelatihan || '', venue))
  );
}

// Helper untuk mengekstrak nomor angkatan (misal: "ANG-51" atau "Angkatan 51" -> 51)
export function getAngkatanNumber(ang: Angkatan) {
  const matchKode = (ang.kode_angkatan || '').match(/\d+/);
  if (matchKode) return parseInt(matchKode[0], 10);
  const matchNama = (ang.nama_angkatan || '').match(/\d+/);
  if (matchNama) return parseInt(matchNama[0], 10);
  return 0;
}

// Build kartu kelas (Grouped by Angkatan ID + Tempat Pelatihan Combo)
export function groupJadwalToKelas(
  jadwalList: JadwalPelatihan[],
  angkatanList: Angkatan[],
  tempatList: TempatPelatihan[]
): KelasCard[] {
  const map = new Map<string, KelasCard>();

  // 1. Group schedules by angkatan_id + tempat_pelatihan combo
  for (const j of jadwalList) {
    if (!j.angkatan_id) continue;
    const ang = angkatanList.find((a) => a.id === j.angkatan_id);
    if (!ang) continue;

    const venue = j.tempat_pelatihan || 'Gedung LPK Leles Utama';
    const comboKey = `${ang.id}:::${venue}`;

    if (!map.has(comboKey)) {
      map.set(comboKey, {
        key: comboKey,
        angkatan: ang,
        tempat_pelatihan: venue,
        ruangan: j.ruangan || 'Ruang Teori A',
        pengajar: j.pengajar || 'Hj. Siti Rahmah, S.Ds',
        schedules: [],
        pesertaCount: j.peserta_count || (j.peserta || []).length,
      });
    }

    const item = map.get(comboKey)!;
    item.schedules.push(j);
    const pCount = j.peserta_count || (j.peserta || []).length;
    if (pCount > item.pesertaCount) {
      item.pesertaCount = pCount;
    }
  }

  // 2. Ensure Angkatans without any schedules yet still render a default card
  for (const ang of angkatanList) {
    const hasCards = Array.from(map.values()).some((item) => item.angkatan.id === ang.id);
    if (!hasCards) {
      const defaultVenue = tempatList[0]?.nama_tempat ? `${tempatList[0].nama_tempat} (${tempatList[0].alamat_lengkap})` : 'Gedung LPK Leles Utama (Ruang Teori A)';
      const comboKey = `${ang.id}:::${defaultVenue}`;
      map.set(comboKey, {
        key: comboKey,
        angkatan: ang,
        tempat_pelatihan: defaultVenue,
        ruangan: 'Ruang Teori A',
        pengajar: 'Hj. Siti Rahmah, S.Ds',
        schedules: [],
        pesertaCount: 0,
      });
    }
  }

  const cards = Array.from(map.values());

  // Urutkan angkatan terbaru di paling atas (descending)
  cards.sort((a, b) => {
    const numA = getAngkatanNumber(a.angkatan);
    const numB = getAngkatanNumber(b.angkatan);

    // Prioritas 1: Nomor angkatan terbesar di atas (contoh: 51 > 50 > 49)
    if (numA !== numB) {
      return numB - numA;
    }

    // Prioritas 2: Tahun terbaru
    const tahunA = a.angkatan.tahun || 0;
    const tahunB = b.angkatan.tahun || 0;
    if (tahunA !== tahunB) {
      return tahunB - tahunA;
    }

    // Prioritas 3: Tanggal mulai terbaru
    const dateA = a.angkatan.tanggal_mulai ? new Date(a.angkatan.tanggal_mulai).getTime() : 0;
    const dateB = b.angkatan.tanggal_mulai ? new Date(b.angkatan.tanggal_mulai).getTime() : 0;
    if (dateA !== dateB) {
      return dateB - dateA;
    }

    // Prioritas 4: Nama tempat pelatihan
    return (a.tempat_pelatihan || '').localeCompare(b.tempat_pelatihan || '');
  });

  return cards;
}

// Kumpulkan peserta unik dari pivot semua sesi pada satu kelas
export function getPesertaKelas(
  kelas: KelasCard,
  pendaftarList: Pendaftar[]
): Pendaftar[] {
  const map = new Map<string, Pendaftar>();
  for (const sched of kelas.schedules) {
    if (sched.peserta && Array.isArray(sched.peserta)) {
      for (const p of sched.peserta) {
        const pObj = typeof p === 'string' ? pendaftarList.find((x) => x.id === p) : p;
        if (pObj && !map.has(pObj.id)) {
          map.set(pObj.id, pObj);
        }
      }
    }
  }
  return Array.from(map.values());
}
