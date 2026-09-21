'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  angkatanApi,
  pendaftarApi,
  jadwalApi,
  tempatApi,
  instrukturApi,
  mataPelajaranApi,
  nilaiApi,
  absensiApi,
  kehadiranApi,
} from '@/lib/api';
import type {
  Angkatan,
  Pendaftar,
  JadwalPelatihan,
  TempatPelatihan,
  Instruktur,
  JenisSesi,
  MataPelajaran,
  Nilai,
  AbsensiData,
  StatusKehadiran,
  Kehadiran,
} from '@/lib/types';
import {
  groupJadwalToKelas,
  matchesTempat,
  getSchedulesForKelas,
  type KelasCard as SchedulePackageCard,
} from '@/lib/kelas';
import {
  tambahHariValid,
  isTanggalMerah,
  keteranganTanggalMerah,
  hitungHariLibur,
} from '@/lib/hariLibur';

export type JadwalManagerMode = 'penuh' | 'kelas' | 'jadwal' | 'penilaian';
import AdminPendaftarDetail from '@/Components/AdminPendaftarDetail';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import ActionToast, { useActionToast } from '@/Components/ActionToast';
import InstrukturSearchSelect from '@/Components/InstrukturSearchSelect';
import Pagination from '@/Components/Pagination';

function nilaiColor(n: number) {
  if (n >= 80) return 'text-emerald-700 font-bold';
  if (n >= 65) return 'text-blue-700 font-semibold';
  if (n >= 50) return 'text-amber-700 font-semibold';
  return 'text-red-600 font-bold';
}

function nilaiGrade(n: number) {
  if (n >= 85) return 'A';
  if (n >= 75) return 'B';
  if (n >= 65) return 'C';
  if (n >= 50) return 'D';
  return 'E';
}

const TEMPLATE_10_HARI = [
  { hari: 1, judul: 'Hari 1: Pre-test Ujian & Orientasi Program Pelatihan', sesi: 'Orientasi' as JenisSesi, jam: '08:00 - 10:00', ruangan: 'Ruang Teori A' },
  { hari: 2, judul: 'Hari 2: Pengenalan Peralatan, Bahan & K3 Pelatihan', sesi: 'Teori' as JenisSesi, jam: '08:00 - 12:00', ruangan: 'Lab Pola Busana' },
  { hari: 3, judul: 'Hari 3: Pemahaman Dasar & Teknik Pembuatan Pola', sesi: 'Teori' as JenisSesi, jam: '08:00 - 12:00', ruangan: 'Lab Pola Busana' },
  { hari: 4, judul: 'Hari 4: Praktik Teknik Lurus & Penggunaan Mesin Utama', sesi: 'Praktik' as JenisSesi, jam: '08:00 - 16:00', ruangan: 'Workshop Utama' },
  { hari: 5, judul: 'Hari 5: Pemotongan Bahan & Penggunaan Mesin Obras', sesi: 'Praktik' as JenisSesi, jam: '08:00 - 16:00', ruangan: 'Workshop Utama' },
  { hari: 6, judul: 'Hari 6: Praktik Detail Jahit Kerah & Saku Garis', sesi: 'Praktik' as JenisSesi, jam: '08:00 - 16:00', ruangan: 'Workshop 2' },
  { hari: 7, judul: 'Hari 7: Praktik Jahit Busana Lengkap / Model Utama', sesi: 'Praktik' as JenisSesi, jam: '08:00 - 16:00', ruangan: 'Workshop 2' },
  { hari: 8, judul: 'Hari 8: Finishing, Quality Control (QC) & Gosok Setrika', sesi: 'Praktik' as JenisSesi, jam: '08:00 - 16:00', ruangan: 'Workshop Utama' },
  { hari: 9, judul: 'Hari 9: Review Evaluasi Hasil Karya & Persiapan Ujian', sesi: 'Teori' as JenisSesi, jam: '08:00 - 12:00', ruangan: 'Ruang Teori A' },
  { hari: 10, judul: 'Hari 10: Post-test Ujian Akhir & Evaluasi Kelulusan', sesi: 'Ujian' as JenisSesi, jam: '09:00 - 11:00', ruangan: 'Aula Ujian' },
];

const formatDateOnly = (dateStr?: string) => {
  if (!dateStr) return 'Ditentukan kemudian';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  try {
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      if (!isNaN(m) && m >= 1 && m <= 12) {
        return `${d} ${months[m - 1]} ${y}`;
      }
    }
  } catch (e) { }
  return cleanStr;
};

const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  try {
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      if (!isNaN(m) && m >= 1 && m <= 12) {
        return `${d} ${months[m - 1]}`;
      }
    }
  } catch (e) { }
  return cleanStr;
};

interface JadwalManagerProps {
  initialAngkatanList?: Angkatan[];
  initialPendaftarList?: Pendaftar[];
  initialJadwalList?: JadwalPelatihan[];
  initialTempatList?: TempatPelatihan[];
  initialInstrukturList?: Instruktur[];
  /** mode tampilan: penuh (semua) | kelas (daftar kelas → peserta) | jadwal (kelas → sesi 1-10) | penilaian (kelas → nilai) */
  mode?: JadwalManagerMode;
}

export default function JadwalManager({
  initialAngkatanList = [],
  initialPendaftarList = [],
  initialJadwalList = [],
  initialTempatList = [],
  initialInstrukturList = [],
  mode = 'penuh',
}: JadwalManagerProps) {
  // Tab detail yang dibuka + tab yang diizinkan sesuai mode
  const modeDetailTab = mode === 'kelas' ? 'peserta' : mode === 'jadwal' ? 'jadwal' : mode === 'penilaian' ? 'penilaian' : 'peserta';
  const allowedTabs: Array<'peserta' | 'jadwal' | 'penilaian' | 'cetak'> =
    mode === 'kelas' ? ['peserta']
    : mode === 'jadwal' ? ['jadwal', 'cetak']
    : mode === 'penilaian' ? ['penilaian']
    : ['peserta', 'jadwal', 'penilaian', 'cetak'];
  const canManagePackage = mode === 'penuh' || mode === 'jadwal';
  const modeTitle =
    mode === 'kelas' ? 'Kelola Kelas' :
    mode === 'jadwal' ? 'Kelola Jadwal Sesi' :
    mode === 'penilaian' ? 'Kelola Penilaian' :
    'Kelola Jadwal & Lokasi Pelatihan';
  const modeSubtitle =
    mode === 'kelas' ? 'Daftar kelas (angkatan + tempat). Klik kelas untuk melihat peserta di dalamnya.'
    : mode === 'jadwal' ? 'Pilih kelas, lalu susun sesi hari 1–10. Klik kelas untuk mengelola sesi.'
    : mode === 'penilaian' ? 'Pilih kelas untuk mengisi nilai peserta.'
    : 'Buat Paket Jadwal (Milih Angkatan + Tempat Pelatihan) ➔ Klik Card Kotak untuk Tarik Peserta & Susun Jadwal Hari 1-10';
  // Master data
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>(initialAngkatanList);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>(initialPendaftarList);
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>(initialJadwalList);
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>(initialTempatList);
  const [instrukturList, setInstrukturList] = useState<Instruktur[]>(initialInstrukturList);

  // Filters & Search
  const [filterTempat, setFilterTempat] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedAngkatanForDetail, setSelectedAngkatanForDetail] = useState<Angkatan | null>(null);
  const [showPullModal, setShowPullModal] = useState<boolean>(false);
  const [angkatanCandidates, setAngkatanCandidates] = useState<Pendaftar[]>([]);
  const [viewingParticipantDetail, setViewingParticipantDetail] = useState<Pendaftar | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [packageDeleteTarget, setPackageDeleteTarget] = useState<SchedulePackageCard | null>(null);
  const { actionToast, showLoading, showSuccess, showError, hideToast } = useActionToast();
  const [pulledParticipantsPage, setPulledParticipantsPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const pageSize = 10;

  // Form State: Buat/Edit Paket Jadwal Baru (Milih Angkatan + Milih Tempat)
  const [editingPackage, setEditingPackage] = useState<SchedulePackageCard | null>(null);
  const [cAngkatanId, setCAngkatanId] = useState<string>('');
  const [cTempatName, setCTempatName] = useState<string>('');
  const [cRuangan, setCRuangan] = useState<string>('Ruang Teori A');
  const [cPengajar, setCPengajar] = useState<string>('Hj. Siti Rahmah, S.Ds');
  // Rentang pelatihan KHUSUS jadwal (independen dari rentang angkatan,
  // namun tidak boleh mulai sebelum tanggal mulai angkatan)
  const [cTanggalMulai, setCTanggalMulai] = useState<string>('');
  const [cTanggalSelesai, setCTanggalSelesai] = useState<string>('');
  const [autoGenerate10Days, setAutoGenerate10Days] = useState<boolean>(true);

  const toDateInput = (d?: string | null) => {
    if (!d) return '';
    return d.includes('T') ? d.split('T')[0] : d.slice(0, 10);
  };

  const addDaysStr = (dateStr: string, days: number) => {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const diffDays = (from: string, to: string) => {
    const a = new Date(`${from}T00:00:00`).getTime();
    const b = new Date(`${to}T00:00:00`).getTime();
    return Math.round((b - a) / 86400000);
  };

  // Angkatan yang dipilih pada form paket + batas minimal tanggal jadwal
  const selectedCAngkatan = useMemo(
    () => angkatanList.find((a) => a.id === cAngkatanId) || null,
    [angkatanList, cAngkatanId]
  );
  const cMinTanggal = toDateInput(selectedCAngkatan?.tanggal_mulai);
  const cAngkatanRangeLabel = selectedCAngkatan
    ? `${formatDateOnly(selectedCAngkatan.tanggal_mulai)} s.d. ${formatDateOnly(selectedCAngkatan.tanggal_selesai)}`
    : '-';

  // Form State: Tambah/Edit Single Session (in detail modal)
  const [showAddSessionModal, setShowAddSessionModal] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<JadwalPelatihan | null>(null);
  const [sJudul, setSJudul] = useState('');
  const [sHariKe, setSHariKe] = useState<number>(1);
  const [sTanggal, setSTanggal] = useState('');
  const [sJam, setSJam] = useState('08:00 - 12:00');
  const [sRuangan, setSRuangan] = useState('Ruang Teori A');
  const [sPengajar, setSPengajar] = useState('Hj. Siti Rahmah, S.Ds');
  const [sJenisSesi, setSJenisSesi] = useState<JenisSesi>('Teori');
  const [sSelectedMpId, setSSelectedMpId] = useState<string>('');
  const [isCustomJudul, setIsCustomJudul] = useState<boolean>(false);

  // ── Subtab State in Detail View ──────────────────────────────
  const [activeDetailTab, setActiveDetailTab] = useState<'peserta' | 'jadwal' | 'penilaian' | 'cetak'>('peserta');

  // ── Kehadiran State ──────────────────────────────────────────
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [kehadiranRecords, setKehadiranRecords] = useState<Kehadiran[]>([]);
  const [kehadiranLoading, setKehadiranLoading] = useState(false);
  const [localPresensi, setLocalPresensi] = useState<Record<string, { status: StatusKehadiran; catatan: string }>>({});
  const [savingPresensi, setSavingPresensi] = useState(false);
  const [savedPresensiMsg, setSavedPresensiMsg] = useState('');

  // ── Penilaian State ──────────────────────────────────────────
  const [mpList, setMpList] = useState<MataPelajaran[]>([]);
  const [penilaianData, setPenilaianData] = useState<AbsensiData | null>(null);
  const [penilaianLoading, setPenilaianLoading] = useState(false);
  const [localNilai, setLocalNilai] = useState<Record<string, Record<string, number>>>({});
  const [savingNilai, setSavingNilai] = useState(false);
  const [savedNilaiMsg, setSavedNilaiMsg] = useState('');
  const [showAddMpModal, setShowAddMpModal] = useState(false);
  const [newMpKode, setNewMpKode] = useState('');
  const [newMpNama, setNewMpNama] = useState('');
  const [newMpUrutan, setNewMpUrutan] = useState(1);

  // ── Cetak State ──────────────────────────────────────────────
  const [jumlahKolHadir, setJumlahKolHadir] = useState<number>(10);
  const [printIncludeStatus, setPrintIncludeStatus] = useState<boolean>(true);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [aRes, pRes, jRes, tRes, insRes, mpRes] = await Promise.all([
        angkatanApi.list(),
        pendaftarApi.list({ per_page: 100 }),
        jadwalApi.list(),
        tempatApi.list(),
        instrukturApi.list(),
        mataPelajaranApi.list(),
      ]);

      setInstrukturList(insRes.data || []);

      const angk = aRes.data || [];
      setAngkatanList(angk);
      if (angk.length > 0 && !cAngkatanId) {
        setCAngkatanId(angk[0].id);
      }

      const tempatData = tRes.data || [];
      setTempatList(tempatData);
      if (tempatData.length > 0 && !cTempatName) {
        setCTempatName(tempatData[0].nama_tempat);
      }

      const allPendaftar = pRes.data?.data || (Array.isArray(pRes.data) ? pRes.data : []);
      setPendaftarList(allPendaftar);
      setJadwalList(jRes.data || []);
      if (mpRes.data) {
        setMpList(mpRes.data);
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
    }
  }, [cAngkatanId]);

  useEffect(() => {
    if (initialAngkatanList.length > 0) setAngkatanList(initialAngkatanList);
    if (initialPendaftarList.length > 0) setPendaftarList(initialPendaftarList);
    if (initialJadwalList.length > 0) setJadwalList(initialJadwalList);
    if (initialTempatList.length > 0) setTempatList(initialTempatList);
    if (initialInstrukturList.length > 0) setInstrukturList(initialInstrukturList);

    // Fetch from API only if props were empty
    if (initialAngkatanList.length === 0 || initialJadwalList.length === 0 || initialTempatList.length === 0 || initialInstrukturList.length === 0) {
      loadData();
    }
  }, [initialAngkatanList, initialPendaftarList, initialJadwalList, initialTempatList, initialInstrukturList]);

  const [selectedTempatForDetail, setSelectedTempatForDetail] = useState<string>('');

  // ── Kehadiran & Penilaian Loaders ─────────────────────────────
  const loadKehadiranData = async (angkatanId: string) => {
    setKehadiranLoading(true);
    try {
      const res = await kehadiranApi.list({ angkatan_id: angkatanId });
      if (res.success && res.data) {
        setKehadiranRecords(res.data);
      }
    } catch (e) {
      console.error('Error loading kehadiran:', e);
    } finally {
      setKehadiranLoading(false);
    }
  };

  const loadPenilaianData = async (angkatanId: string, programId?: string) => {
    setPenilaianLoading(true);
    try {
      const [absRes, mpRes] = await Promise.all([
        absensiApi.get({ angkatan_id: angkatanId, program_id: programId || undefined }),
        mataPelajaranApi.list(programId ? { program_id: programId } : undefined),
      ]);

      if (mpRes.success && mpRes.data) {
        setMpList(mpRes.data);
      }

      if (absRes.success && absRes.data) {
        setPenilaianData(absRes.data);
        const local: Record<string, Record<string, number>> = {};
        for (const p of absRes.data.peserta) {
          local[p.id] = {};
          // Existing mata pelajaran nilai
          for (const n of absRes.data.nilai.filter((x) => x.pendaftar_id === p.id)) {
            const key = n.mata_pelajaran_id ? `mp_${n.mata_pelajaran_id}` : n.tipe_nilai;
            local[p.id][key] = n.nilai;
          }
          // Auto-fill posttest for ujian akhir
          const posttest = absRes.data.hasil_posttest[p.id];
          if (posttest && local[p.id]['posttest'] === undefined) {
            local[p.id]['posttest'] = posttest.nilai;
          }
          // Auto-fill pretest
          const pretest = absRes.data.hasil_pretest[p.id];
          if (pretest && local[p.id]['pretest'] === undefined) {
            local[p.id]['pretest'] = pretest.nilai;
          }
          // Auto-fill kehadiran
          const keh = absRes.data.kehadiran[p.id];
          if (keh && local[p.id]['kehadiran'] === undefined) {
            local[p.id]['kehadiran'] = keh.persen;
          }
        }
        setLocalNilai(local);
      }
    } catch (e) {
      console.error('Error loading penilaian:', e);
    } finally {
      setPenilaianLoading(false);
    }
  };

  const handleOpenDetailCard = async (
    ang: Angkatan,
    tempat: string,
    initialTab: 'peserta' | 'jadwal' | 'penilaian' | 'cetak' = 'peserta'
  ) => {
    setSelectedAngkatanForDetail(ang);
    setSelectedTempatForDetail(tempat);
    // Pada mode terbatas, paksa tab sesuai mode (kelas→peserta, jadwal→sesi, penilaian→nilai)
    setActiveDetailTab(mode === 'penuh' ? initialTab : modeDetailTab as 'peserta' | 'jadwal' | 'penilaian' | 'cetak');
    try {
      const res = await angkatanApi.getPendaftar(ang.id);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setAngkatanCandidates(res.data);
      } else if (ang.pendaftar && ang.pendaftar.length > 0) {
        setAngkatanCandidates(ang.pendaftar);
      } else {
        setAngkatanCandidates(pendaftarList.filter((p) => p.angkatan_id === ang.id));
      }
    } catch (e) {
      if (ang.pendaftar && ang.pendaftar.length > 0) {
        setAngkatanCandidates(ang.pendaftar);
      } else {
        setAngkatanCandidates(pendaftarList.filter((p) => p.angkatan_id === ang.id));
      }
    }

    loadKehadiranData(ang.id);
    loadPenilaianData(ang.id, ang.program_id);
  };

  // ── Presensi Handlers ─────────────────────────────────────────
  const handleSavePresensiForSession = async (session: JadwalPelatihan, participants: Pendaftar[]) => {
    if (!session.tanggal) {
      alert('Sesi ini belum memiliki tanggal pelaksanaan.');
      return;
    }
    setSavingPresensi(true);
    try {
      const payloadData = participants.map((p) => {
        const pres = localPresensi[p.id] || { status: 'Hadir', catatan: '' };
        return {
          pendaftar_id: p.id,
          tanggal: session.tanggal,
          status_kehadiran: pres.status,
          catatan: pres.catatan || undefined,
        };
      });

      await kehadiranApi.createBulk({
        tanggal: session.tanggal,
        data: payloadData,
      });

      setSavedPresensiMsg(`Presensi Hari ${session.hari_ke || ''} (${formatDateOnly(session.tanggal)}) berhasil disimpan!`);
      setTimeout(() => setSavedPresensiMsg(''), 3500);
      if (selectedAngkatanForDetail) {
        await loadKehadiranData(selectedAngkatanForDetail.id);
      }
    } catch (e) {
      console.error('Error saving presensi:', e);
      alert('Gagal menyimpan presensi. Silakan coba lagi.');
    } finally {
      setSavingPresensi(false);
    }
  };

  const handleMarkAllPresent = (participants: Pendaftar[]) => {
    setLocalPresensi((prev) => {
      const updated = { ...prev };
      participants.forEach((p) => {
        updated[p.id] = { status: 'Hadir', catatan: prev[p.id]?.catatan || '' };
      });
      return updated;
    });
  };

  // ── Nilai Handlers ───────────────────────────────────────────
  const handleSaveAllNilai = async () => {
    setSavingNilai(true);
    try {
      const bulkPayload: Array<any> = [];
      for (const [pendaftarId, cols] of Object.entries(localNilai)) {
        for (const [key, nilai] of Object.entries(cols)) {
          if (nilai === undefined || isNaN(nilai)) continue;
          if (key.startsWith('mp_')) {
            const mpId = key.replace('mp_', '');
            bulkPayload.push({
              pendaftar_id: pendaftarId,
              mata_pelajaran_id: mpId,
              tipe_nilai: 'mata_pelajaran',
              nilai,
            });
          } else if (['pretest', 'posttest', 'kehadiran'].includes(key)) {
            bulkPayload.push({
              pendaftar_id: pendaftarId,
              tipe_nilai: key,
              nilai,
            });
          }
        }
      }

      await nilaiApi.bulk(bulkPayload);
      setSavedNilaiMsg('Nilai berhasil disimpan ke database!');
      setTimeout(() => setSavedNilaiMsg(''), 3000);
      if (selectedAngkatanForDetail) {
        await loadPenilaianData(selectedAngkatanForDetail.id, selectedAngkatanForDetail.program_id);
      }
    } catch (e) {
      console.error('Error saving nilai:', e);
      alert('Gagal menyimpan nilai.');
    } finally {
      setSavingNilai(false);
    }
  };

  const handleCreateQuickMp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMpKode || !newMpNama) return;
    try {
      const createdRes = await mataPelajaranApi.create({
        kode: newMpKode.toUpperCase(),
        nama: newMpNama,
        program_id: selectedAngkatanForDetail?.program_id || undefined,
        urutan: newMpUrutan,
      });
      setShowAddMpModal(false);
      setNewMpKode('');
      setNewMpNama('');

      // Refresh daftar mata pelajaran
      const mpRes = await mataPelajaranApi.list();
      if (mpRes.data) {
        setMpList(mpRes.data);
      }

      // Jika modal sesi sedang terbuka, otomatis pilih mata pelajaran yang baru dibuat
      if (showAddSessionModal && createdRes.data) {
        handleMpChange(createdRes.data.id);
      }

      if (selectedAngkatanForDetail) {
        await loadPenilaianData(selectedAngkatanForDetail.id, selectedAngkatanForDetail.program_id);
      }
    } catch (err) {
      console.error('Error creating mata pelajaran:', err);
    }
  };

  // Kartu kelas (angkatan + tempat) — logika di lib/kelas.ts
  const schedulePackageCards = useMemo<SchedulePackageCard[]>(
    () => groupJadwalToKelas(jadwalList, angkatanList, tempatList),
    [jadwalList, angkatanList, tempatList]
  );

  const getSchedulesForPackage = (angkatanId: string, venue: string) =>
    getSchedulesForKelas(jadwalList, angkatanId, venue);

  // Filtered Package Cards by Tempat & Search Query
  const filteredPackageCards = useMemo(() => {
    return schedulePackageCards.filter((card) => {
      if (!matchesTempat(card.tempat_pelatihan, filterTempat)) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNama = card.angkatan.nama_angkatan.toLowerCase().includes(q);
        const matchKode = card.angkatan.kode_angkatan.toLowerCase().includes(q);
        const matchTempat = card.tempat_pelatihan.toLowerCase().includes(q);
        return matchNama || matchKode || matchTempat;
      }

      return true;
    });
  }, [schedulePackageCards, filterTempat, searchQuery]);

  const handleEditPackageCard = (card: SchedulePackageCard) => {
    setEditingPackage(card);
    setCAngkatanId(card.angkatan.id);
    setCTempatName(card.tempat_pelatihan);
    setCRuangan(card.ruangan || 'Ruang Teori A');
    setCPengajar(card.pengajar || 'Hj. Siti Rahmah, S.Ds');
    // Rentang jadwal diambil dari sesi paling awal & akhir (independen dari angkatan)
    const dates = card.schedules
      .map((s) => toDateInput(s.tanggal))
      .filter(Boolean)
      .sort();
    const angStart = toDateInput(card.angkatan.tanggal_mulai);
    const angEnd = toDateInput(card.angkatan.tanggal_selesai);
    setCTanggalMulai(dates[0] || angStart);
    setCTanggalSelesai(dates[dates.length - 1] || dates[0] || angEnd || (angStart ? addDaysStr(angStart, 9) : ''));
    setShowCreateModal(true);
  };

  const fillRentangFromAngkatan = (angkatanId: string) => {
    const ang = angkatanList.find((a) => a.id === angkatanId);
    if (!ang) return;
    const start = toDateInput(ang.tanggal_mulai);
    if (!start) return;
    setCTanggalMulai(start);
    // Default paket 10 hari berurutan dari tanggal mulai
    setCTanggalSelesai(addDaysStr(start, 9));
  };

  const handleDeletePackageCard = (card: SchedulePackageCard) => {
    setPackageDeleteTarget(card);
  };

  const confirmDeletePackageCard = async () => {
    if (!packageDeleteTarget) return;
    const card = packageDeleteTarget;

    setIsDeleting(true);
    showLoading('delete', `Menghapus paket "${card.angkatan.nama_angkatan}"...`, `Menghapus ${card.schedules.length} sesi harian dari sistem...`);

    try {
      for (const sched of card.schedules) {
        const delRes = await jadwalApi.destroy(sched.id);
        if (!delRes.success) throw new Error(delRes.error || delRes.message || 'Gagal menghapus sesi paket.');
      }
      const deletedName = `${card.angkatan.nama_angkatan} — ${card.tempat_pelatihan}`;
      setPackageDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Paket Jadwal Berhasil Dihapus!', `"${deletedName}" telah dihapus dari sistem.`);
    } catch (err: any) {
      console.error('Error deleting package card:', err);
      showError('Gagal Menghapus Paket Jadwal', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Buat / Edit Paket Jadwal (Form Milih Angkatan + Tempat + Rentang)
  const handleCreateJadwalPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cAngkatanId || !cTempatName) return;

    const isEdit = Boolean(editingPackage);
    const angkatanMin = toDateInput(selectedCAngkatan?.tanggal_mulai);

    // Validasi rentang jadwal terhadap rentang angkatan
    if (!cTanggalMulai || !cTanggalSelesai) {
      showError('Rentang Belum Lengkap', 'Isi tanggal mulai dan tanggal selesai pelatihan jadwal.');
      return;
    }
    if (angkatanMin && cTanggalMulai < angkatanMin) {
      showError(
        'Tanggal Mulai Tidak Valid',
        `Tanggal mulai jadwal (${cTanggalMulai}) tidak boleh sebelum tanggal mulai angkatan (${angkatanMin}).`
      );
      return;
    }
    if (cTanggalSelesai < cTanggalMulai) {
      showError('Rentang Tidak Valid', 'Tanggal selesai jadwal tidak boleh sebelum tanggal mulai jadwal.');
      return;
    }

    // Tanggal tiap sesi dihitung dengan MELEWATI Minggu & tanggal merah,
    // sehingga sesi terakhir bisa mundur lebih jauh dari mulai+9 hari.
    const genTanggalAuto = autoGenerate10Days
      ? TEMPLATE_10_HARI.map((t) => tambahHariValid(cTanggalMulai, t.hari - 1))
      : [];
    if (!isEdit && autoGenerate10Days && genTanggalAuto[genTanggalAuto.length - 1] > cTanggalSelesai) {
      const leap = hitungHariLibur(cTanggalMulai, cTanggalSelesai);
      showError(
        'Rentang Tidak Muat 10 Sesi',
        `Hari Minggu/libur (${leap} hari) dilewati otomatis sehingga sesi ke-10 jatuh pada ${genTanggalAuto[genTanggalAuto.length - 1]}. Perlebar tanggal selesai hingga minimal tanggal tersebut.`
      );
      return;
    }

    setIsGenerating(true);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Menyimpan Perubahan Paket...' : 'Membuat Paket Jadwal...',
      isEdit ? 'Memperbarui tempat, ruangan, pengajar, dan rentang seluruh sesi...' : 'Menyusun paket sesi Hari 1–10...'
    );

    const fail = (res: { success: boolean; error?: string; message?: string }, fallback: string) => {
      if (!res.success) throw new Error(res.error || res.message || fallback);
    };

    try {

      if (editingPackage) {
        // Satu panggilan route bulk — tanggal tiap sesi sudah dilewati
        // dari Minggu/tanggal merah dan dikirim eksplisit per-sesi
        const sorted = [...editingPackage.schedules].sort((a, b) => (a.hari_ke || 0) - (b.hari_ke || 0));
        const baseHari = sorted[0]?.hari_ke || 1;
        const tanggalMap = sorted.map((s) => ({
          id: s.id,
          tanggal: tambahHariValid(cTanggalMulai, (s.hari_ke || baseHari) - baseHari),
        }));
        const lastTanggal = tanggalMap[tanggalMap.length - 1]?.tanggal || '';
        if (lastTanggal && lastTanggal > cTanggalSelesai) {
          showError(
            'Rentang Tidak Muat',
            `Hari Minggu/libur dilewati otomatis sehingga sesi terakhir jatuh pada ${lastTanggal}. Perlebar tanggal selesai hingga minimal tanggal tersebut.`
          );
          return;
        }
        const res = await jadwalApi.updatePaket({
          angkatan_id: editingPackage.angkatan.id,
          tempat_lama: editingPackage.tempat_pelatihan,
          tempat_pelatihan: cTempatName,
          ruangan: cRuangan,
          pengajar: cPengajar,
          tanggal_mulai: cTanggalMulai,
          tanggal_selesai: cTanggalSelesai,
          sesi: tanggalMap,
        });
        fail(res, 'Gagal memperbarui paket jadwal.');
        const savedName = editingPackage.angkatan.nama_angkatan;
        // Langsung gabungkan sesi terupdate ke list agar kartu overview &
        // form edit langsung menampilkan perubahan tanpa menunggu loadData
        if (res.data && Array.isArray(res.data)) {
          const updatedById = new Map(res.data.map((s: JadwalPelatihan) => [s.id, s]));
          setJadwalList((prev) => prev.map((j) => updatedById.get(j.id) || j));
        }
        // Sinkronkan filter detail bila tempat paket ikut berubah
        setSelectedTempatForDetail(cTempatName);
        setShowCreateModal(false);
        setEditingPackage(null);
        await loadData();
        showSuccess('edit', 'Paket Jadwal Berhasil Diperbarui!', `"${savedName}" (${cTanggalMulai} s.d. ${cTanggalSelesai}) telah diperbarui.`);
        return;
      }

      const targetAngkatan = angkatanList.find((a) => a.id === cAngkatanId);
      const programNama = targetAngkatan?.program?.nama || targetAngkatan?.program_id || 'Tata Boga & Pastry';

      if (autoGenerate10Days) {
        // Rentang jadwal independen: mulai dari tanggal mulai form (bukan otomatis tanggal angkatan).
        // Hari Minggu & tanggal merah dilewati otomatis.
        for (let i = 0; i < TEMPLATE_10_HARI.length; i++) {
          const tmpl = TEMPLATE_10_HARI[i];
          const dateStr = genTanggalAuto[i] || tambahHariValid(cTanggalMulai, tmpl.hari - 1);

          const res = await jadwalApi.create({
            judul: `${tmpl.judul} - ${targetAngkatan?.kode_angkatan}`,
            jenis_pelatihan: programNama,
            angkatan_id: cAngkatanId,
            hari_ke: tmpl.hari,
            tanggal: dateStr,
            jam: tmpl.jam,
            ruangan: cRuangan || tmpl.ruangan,
            tempat_pelatihan: cTempatName,
            pengajar: cPengajar,
            jenis_sesi: tmpl.sesi,
            status: 'akan_datang',
          });
          fail(res, 'Gagal membuat sesi paket.');
        }
      } else {
        const res = await jadwalApi.create({
          judul: `Sesi Perdana Pelatihan - ${targetAngkatan?.kode_angkatan}`,
          jenis_pelatihan: programNama,
          angkatan_id: cAngkatanId,
          hari_ke: 1,
          tanggal: cTanggalMulai,
          jam: '08:00 - 12:00',
          ruangan: cRuangan,
          tempat_pelatihan: cTempatName,
          pengajar: cPengajar,
          jenis_sesi: 'Teori',
          status: 'akan_datang',
        });
        fail(res, 'Gagal membuat sesi perdana.');
      }

      setShowCreateModal(false);
      await loadData();
      showSuccess('add', 'Paket Jadwal Berhasil Dibuat!', `Rentang ${cTanggalMulai} s.d. ${cTanggalSelesai} telah tersusun.`);
    } catch (err: any) {
      console.error('Error creating jadwal package:', err);
      showError('Gagal Menyimpan Paket Jadwal', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Tarik Peserta Massal ke Paket Jadwal (Hari 1 - 10)
  const handleBulkPullParticipants = async (ang: Angkatan) => {
    const angSchedules = getSchedulesForPackage(ang.id, selectedTempatForDetail);
    if (ang?.status === 'Selesai') {
      showError('Angkatan Selesai', 'Plotting dikunci — angkatan ini sudah diselesaikan.');
      return;
    }
    if (angSchedules.length === 0) {
      alert('Belum ada sesi harian. Silakan buat sesi harian terlebih dahulu.');
      return;
    }

    if (angkatanCandidates.length === 0) {
      alert('Tidak ada peserta terdaftar untuk angkatan ini.');
      return;
    }

    try {
      setIsGenerating(true);
      showLoading('add', 'Menarik Peserta ke Jadwal...', `Memasukkan ${angkatanCandidates.length} peserta ke ${angSchedules.length} sesi...`);
      const participantIds = angkatanCandidates.map((p) => p.id);

      for (const sched of angSchedules) {
        const res = await jadwalApi.addPeserta(sched.id, participantIds);
        if (!res.success) throw new Error(res.error || res.message || `Gagal menarik peserta ke sesi "${sched.judul}".`);
      }

      await loadData();
      showSuccess('add', 'Peserta Berhasil Ditarik!', `${participantIds.length} peserta dimasukkan ke jadwal.`);
    } catch (err: any) {
      console.error('Error bulk pulling participants:', err);
      showError('Gagal Menarik Peserta', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Tarik / Keluarkan Peserta Satu Per Satu (Granular)
  const handleToggleSingleParticipant = async (ang: Angkatan, pendaftarId: string, isCurrentlyAdded: boolean) => {
    if (ang?.status === 'Selesai') {
      showError('Angkatan Selesai', 'Plotting dikunci — angkatan ini sudah diselesaikan.');
      return;
    }
    const angSchedules = getSchedulesForPackage(ang.id, selectedTempatForDetail);
    if (angSchedules.length === 0) {
      alert('Belum ada sesi harian. Silakan buat/generate sesi harian terlebih dahulu.');
      return;
    }

    try {
      setIsGenerating(true);
      showLoading('edit', isCurrentlyAdded ? 'Mengeluarkan Peserta...' : 'Menambahkan Peserta...', 'Memperbarui seluruh sesi paket...');
      let gagal = 0;
      for (const sched of angSchedules) {
        const res = isCurrentlyAdded
          ? await jadwalApi.removePeserta(sched.id, pendaftarId)
          : await jadwalApi.addPeserta(sched.id, [pendaftarId]);
        if (!res.success) {
          gagal++;
          console.error(`Gagal memproses sesi "${sched.judul}":`, res.error || res.message);
        }
      }
      await loadData();
      if (gagal > 0) {
        throw new Error(`${gagal} dari ${angSchedules.length} sesi gagal diproses. Sebagian jadwal mungkin belum berubah — silakan coba lagi.`);
      }
      showSuccess('edit', isCurrentlyAdded ? 'Peserta Dikeluarkan!' : 'Peserta Ditambahkan!', isCurrentlyAdded ? 'Peserta dilepas dari seluruh sesi paket — jadwalnya ikut hilang dari portal peserta.' : 'Daftar peserta jadwal telah diperbarui.');
    } catch (err: any) {
      console.error('Error toggling single participant:', err);
      showError('Gagal Memproses Peserta', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Generate 10-Hari Otomatis dari Dalam Detail
  const handleGenerate10DaysForDetail = async (ang: Angkatan, venueName: string) => {
    try {
      setIsGenerating(true);
      showLoading('add', 'Membuat 10 Sesi Otomatis...', 'Menyusun sesi Hari 1–10 (lewati Minggu & tanggal merah)...');
      const programNama = ang.program?.nama || ang.program_id || 'Tata Boga & Pastry';
      const startStr = toDateInput(ang.tanggal_mulai) || new Date().toISOString().split('T')[0];

      for (const tmpl of TEMPLATE_10_HARI) {
        // Hari Minggu & tanggal merah dilewati otomatis
        const dateStr = tambahHariValid(startStr, tmpl.hari - 1);

        await jadwalApi.create({
          judul: `${tmpl.judul} - ${ang.kode_angkatan}`,
          jenis_pelatihan: programNama,
          angkatan_id: ang.id,
          hari_ke: tmpl.hari,
          tanggal: dateStr,
          jam: tmpl.jam,
          ruangan: tmpl.ruangan,
          tempat_pelatihan: venueName,
          pengajar: 'Hj. Siti Rahmah, S.Ds',
          jenis_sesi: tmpl.sesi,
          status: 'akan_datang',
        }).then((res) => {
          if (!res.success) throw new Error(res.error || res.message || `Gagal membuat sesi Hari ke-${tmpl.hari}.`);
        });
      }

      await loadData();
      showSuccess('add', '10 Sesi Berhasil Dibuat!', 'Paket sesi Hari 1–10 telah tersusun.');
    } catch (err: any) {
      console.error('Error generating 10 days:', err);
      showError('Gagal Membuat Sesi Otomatis', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Sinkronisasi Mata Pelajaran ke Judul Sesi Harian
  const handleMpChange = (val: string) => {
    setSSelectedMpId(val);
    const angKode = selectedAngkatanForDetail?.kode_angkatan || '';

    if (val === 'orientasi') {
      setSJudul(`Hari ${sHariKe}: Orientasi & K3 Program Pelatihan - ${angKode}`);
      setSJenisSesi('Orientasi');
      setIsCustomJudul(false);
    } else if (val === 'pretest') {
      setSJudul(`Hari ${sHariKe}: Pre-test Ujian Masuk - ${angKode}`);
      setSJenisSesi('Ujian');
      setIsCustomJudul(false);
    } else if (val === 'posttest') {
      setSJudul(`Hari ${sHariKe}: Post-test Ujian Akhir & Evaluasi Kelulusan - ${angKode}`);
      setSJenisSesi('Ujian');
      setIsCustomJudul(false);
    } else if (val === 'custom') {
      setIsCustomJudul(true);
      if (!sJudul) setSJudul(`Hari ${sHariKe}: `);
    } else {
      const foundMp = mpList.find((m) => m.id === val);
      if (foundMp) {
        setSJudul(`Hari ${sHariKe}: ${foundMp.nama} - ${angKode}`);
        const lowerName = foundMp.nama.toLowerCase();
        if (
          lowerName.includes('praktik') ||
          lowerName.includes('mesin') ||
          lowerName.includes('jahit') ||
          lowerName.includes('potong') ||
          lowerName.includes('obras')
        ) {
          setSJenisSesi('Praktik');
          setSJam('08:00 - 16:00');
        } else {
          setSJenisSesi('Teori');
          setSJam('08:00 - 12:00');
        }
        setIsCustomJudul(false);
      }
    }
  };

  const handleHariKeChange = (val: number) => {
    setSHariKe(val);
    if (!isCustomJudul && sSelectedMpId) {
      const angKode = selectedAngkatanForDetail?.kode_angkatan || '';
      if (sSelectedMpId === 'orientasi') {
        setSJudul(`Hari ${val}: Orientasi & K3 Program Pelatihan - ${angKode}`);
      } else if (sSelectedMpId === 'pretest') {
        setSJudul(`Hari ${val}: Pre-test Ujian Masuk - ${angKode}`);
      } else if (sSelectedMpId === 'posttest') {
        setSJudul(`Hari ${val}: Post-test Ujian Akhir & Evaluasi Kelulusan - ${angKode}`);
      } else {
        const foundMp = mpList.find((m) => m.id === sSelectedMpId);
        if (foundMp) {
          setSJudul(`Hari ${val}: ${foundMp.nama} - ${angKode}`);
        }
      }
    }
  };

  // Handler: Simpan / Update Single Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAngkatanForDetail || !sJudul || !sTanggal) return;

    // Tanggal sesi tidak boleh sebelum tanggal mulai angkatan
    const detailMinTanggal = toDateInput(selectedAngkatanForDetail.tanggal_mulai);
    if (detailMinTanggal && sTanggal < detailMinTanggal) {
      showError(
        'Tanggal Sesi Tidak Valid',
        `Tanggal sesi (${sTanggal}) tidak boleh sebelum tanggal mulai angkatan (${detailMinTanggal}).`
      );
      return;
    }

    const isEdit = Boolean(editingSession);
    setIsSavingSession(true);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Menyimpan Perubahan Sesi...' : 'Menambahkan Sesi Baru...',
      'Sedang menyimpan sesi ke sistem...'
    );

    try {
      const ang = selectedAngkatanForDetail;
      const angSchedules = getSchedulesForPackage(ang.id, selectedTempatForDetail);
      const venueName = angSchedules[0]?.tempat_pelatihan || cTempatName;
      const programNama = ang.program?.nama || ang.program_id || 'Tata Boga & Pastry';

      const payload = {
        judul: sJudul,
        jenis_pelatihan: programNama,
        angkatan_id: ang.id,
        hari_ke: Number(sHariKe),
        tanggal: sTanggal,
        jam: sJam,
        ruangan: sRuangan,
        tempat_pelatihan: venueName,
        pengajar: sPengajar,
        jenis_sesi: sJenisSesi,
        status: 'akan_datang',
      };

      const res = editingSession
        ? await jadwalApi.update(editingSession.id, payload)
        : await jadwalApi.create(payload);
      if (!res.success) throw new Error(res.error || res.message || 'Gagal menyimpan sesi.');

      // Langsung gabungkan hasil ke list agar tampilan sesi terupdate seketika
      if (res.data && (res.data as JadwalPelatihan).id) {
        const saved = res.data as JadwalPelatihan;
        setJadwalList((prev) => {
          const exists = prev.some((j) => j.id === saved.id);
          return exists ? prev.map((j) => (j.id === saved.id ? { ...j, ...saved } : j)) : [...prev, saved];
        });
      }

      const savedTitle = sJudul;
      setShowAddSessionModal(false);
      setEditingSession(null);
      await loadData();
      showSuccess(
        isEdit ? 'edit' : 'add',
        isEdit ? 'Sesi Berhasil Diperbarui!' : 'Sesi Baru Berhasil Ditambahkan!',
        `"${savedTitle}" telah tersimpan.`
      );
    } catch (err: any) {
      console.error('Error saving session:', err);
      showError('Gagal Menyimpan Sesi', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleDeleteSession = (id: string, name: string = 'sesi harian ini') => {
    setDeleteTarget({ id, name });
  };

  const confirmDeleteSession = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    showLoading('delete', `Menghapus ${deleteTarget.name}...`, 'Sedang menghapus sesi dari sistem...');

    try {
      const delRes = await jadwalApi.destroy(deleteTarget.id);
      if (!delRes.success) throw new Error(delRes.error || delRes.message || 'Gagal menghapus sesi.');
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Sesi Berhasil Dihapus!', `"${deletedName}" telah dihapus.`);
    } catch (err: any) {
      console.error('Error deleting session:', err);
      showError('Gagal Menghapus Sesi', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================================
  // VIEW MODE 2: INLINE DETAIL VIEW PANEL (Bukan Popup Modal Floating)
  // =========================================================================
  if (selectedAngkatanForDetail) {
    const ang = selectedAngkatanForDetail;
    const allAngSchedules = jadwalList.filter((j) => j.angkatan_id === ang.id);
    const angSchedules = selectedTempatForDetail
      ? allAngSchedules.filter((j) => matchesTempat(j.tempat_pelatihan, selectedTempatForDetail) || j.tempat_pelatihan === selectedTempatForDetail)
      : allAngSchedules;

    const venue = selectedTempatForDetail || angSchedules[0]?.tempat_pelatihan || cTempatName;
    const room = angSchedules[0]?.ruangan || cRuangan;

    // Rentang pelatihan KHUSUS jadwal (dari sesi paling awal & akhir).
    // Independen dari rentang angkatan; fallback ke rentang angkatan bila belum ada sesi.
    const jadwalTanggalList = angSchedules
      .map((s) => toDateInput(s.tanggal))
      .filter(Boolean)
      .sort();
    const jadwalRangeMulai = jadwalTanggalList[0] || toDateInput(ang.tanggal_mulai);
    const jadwalRangeSelesai =
      jadwalTanggalList[jadwalTanggalList.length - 1] ||
      jadwalTanggalList[0] ||
      toDateInput(ang.tanggal_selesai);

    // ID Peserta yang saat ini sudah ditarik di paket jadwal ini (diambil dari seluruh sesi jadwal angkatan)
    const pulledParticipantsMap = new Map<string, Pendaftar>();
    for (const sched of angSchedules) {
      if (sched.peserta && Array.isArray(sched.peserta)) {
        for (const p of sched.peserta) {
          const pObj = typeof p === 'string' ? pendaftarList.find((x) => x.id === p) : p;
          if (pObj && !pulledParticipantsMap.has(pObj.id)) {
            pulledParticipantsMap.set(pObj.id, pObj);
          }
        }
      }
    }
    const pulledParticipants = Array.from(pulledParticipantsMap.values());
    const pulledParticipantIds = new Set(pulledParticipants.map((p) => p.id));

    return (
      <div className="space-y-6">
        {/* Navigasi Kembali */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <button
            onClick={() => setSelectedAngkatanForDetail(null)}
            className="btn btn-outline btn-sm font-bold flex items-center gap-2 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 self-start"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{mode === 'penuh' ? 'Kembali ke Daftar Paket Jadwal' : 'Kembali ke Daftar Kelas'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              {ang.kode_angkatan}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {ang.status}
            </span>
          </div>
        </div>

        {/* Overview Header Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{ang.nama_angkatan}</h3>
            <p className="text-xs text-slate-500">Program: <span className="font-semibold text-slate-700">{ang.program?.nama || ang.program_id}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Tempat Pelatihan (Fixed)</div>
              <div className="font-bold text-indigo-950 text-sm mt-0.5">{venue} ({room})</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Pengajar Utama</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">{angSchedules[0]?.pengajar || '-'}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Rentang Pelatihan (Jadwal)</div>
              <div className="font-bold font-mono text-slate-800 text-xs mt-0.5">
                {jadwalRangeMulai ? formatDateOnly(jadwalRangeMulai) : '-'} s.d. {jadwalRangeSelesai ? formatDateOnly(jadwalRangeSelesai) : '-'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Angkatan: {formatDateOnly(ang.tanggal_mulai)} s.d. {formatDateOnly(ang.tanggal_selesai)}
              </div>
            </div>
          </div>
        </div>

        {/* SUBTAB DETAIL JADWAL (dibatasi sesuai mode) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {([
            { id: 'peserta' as const, label: 'Daftar Peserta', badge: `${pulledParticipants.length} Peserta`, activeColor: 'text-indigo-700' },
            { id: 'jadwal' as const, label: 'Jadwal Sesi Pelatihan', badge: `${angSchedules.length} Sesi`, activeColor: 'text-indigo-700' },
            { id: 'penilaian' as const, label: 'Penilaian Peserta', badge: null as string | null, activeColor: 'text-amber-700' },
            { id: 'cetak' as const, label: 'Cetak Lembar Absensi', badge: null as string | null, activeColor: 'text-purple-700' },
          ]).filter((t) => allowedTabs.includes(t.id)).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveDetailTab(t.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${activeDetailTab === t.id
                ? `bg-white shadow-sm ${t.activeColor}`
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>{t.label}</span>
              {t.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DAFTAR PESERTA PELATIHAN */}
        {/* ========================================================================= */}
        {activeDetailTab === 'peserta' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Daftar Peserta Terdaftar Di Paket Jadwal Ini</h4>
                  <p className="text-xs text-slate-500">
                    Daftar peserta yang dialokasikan mengikuti sesi pelatihan di tempat <b>{venue}</b> ({pulledParticipants.length} orang)
                  </p>
                </div>

                {ang?.status === 'Selesai' ? (
                  <span className="text-[11px] italic text-slate-400 shrink-0">Angkatan selesai — plotting dikunci.</span>
                ) : (
                <button
                  onClick={() => setShowPullModal(true)}
                  className="btn btn-primary btn-sm font-bold shrink-0 text-xs flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span> Tarik / Pilih Peserta Angkatan</span>
                </button>
                )}
              </div>

              {/* TABEL Peserta yang Sudah Ditarik */}
              {pulledParticipants.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl space-y-1">
                  <div className="font-semibold text-slate-600">Belum ada peserta yang ditarik ke paket jadwal ini.</div>
                  <div>Klik tombol <b>"+ Tarik / Pilih Peserta Angkatan"</b> di atas untuk menarik peserta dari {ang.nama_angkatan}.</div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-3 py-2.5 w-10 text-center">No</th>
                        <th className="px-3 py-2.5">No. Pendaftaran</th>
                        <th className="px-4 py-2.5">Nama Lengkap</th>
                        <th className="px-3 py-2.5">NIK</th>
                        <th className="px-3 py-2.5">Jenis Kelamin</th>
                        <th className="px-3 py-2.5">No. HP</th>
                        <th className="px-3 py-2.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pulledParticipants.slice((pulledParticipantsPage - 1) * pageSize, pulledParticipantsPage * pageSize).map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                              {p.no_pendaftaran}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {p.nama_lengkap}
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600 text-[11px]">
                            {p.nik}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600 text-[11px]">
                            {p.no_hp || '-'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingParticipantDetail(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                              >
                                Detail
                              </button>
                              {ang?.status !== 'Selesai' && (
                              <button
                                type="button"
                                onClick={() => handleToggleSingleParticipant(ang, p.id, true)}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                Keluarkan
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination currentPage={pulledParticipantsPage} totalItems={pulledParticipants.length} pageSize={pageSize} onPageChange={setPulledParticipantsPage} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: JADWAL SESI PELATIHAN */}
        {/* ========================================================================= */}
        {activeDetailTab === 'jadwal' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Penyusunan Jadwal Sesi Hari 1 s.d. 10</h4>
                  <p className="text-xs text-slate-500">Kelola dan susun sesi harian (Hari 1 s.d 10) di {venue} ({angSchedules.length} sesi)</p>
                </div>
                <div className="flex items-center gap-2">
                  {angSchedules.length === 0 && (
                    <button
                      onClick={() => handleGenerate10DaysForDetail(ang, venue)}
                      disabled={isGenerating}
                      className="btn btn-outline btn-sm font-bold border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs"
                    >
                      Generate Hari 1-10 Otomatis
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingSession(null);
                      setSSelectedMpId('');
                      setIsCustomJudul(false);
                      setSJudul('');
                      setSHariKe(angSchedules.length + 1);
                      setSTanggal(
                        jadwalTanggalList.length > 0
                          ? tambahHariValid(jadwalTanggalList[jadwalTanggalList.length - 1], 1)
                          : tambahHariValid(
                              ang.tanggal_mulai ? ang.tanggal_mulai.split('T')[0] : new Date().toISOString().split('T')[0],
                              0
                            )
                      );
                      setSJam('08:00 - 12:00');
                      setSRuangan(room);
                      setSPengajar(angSchedules[0]?.pengajar || 'Hj. Siti Rahmah, S.Ds');
                      setSJenisSesi('Teori');
                      setShowAddSessionModal(true);
                    }}
                    className="btn btn-primary btn-sm text-xs font-bold"
                  >
                    + Tambah Sesi Harian
                  </button>
                </div>
              </div>

              {/* TABEL Sesi Harian */}
              {angSchedules.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl space-y-1">
                  <div className="font-semibold text-slate-600">Belum ada sesi harian.</div>
                  <div>Klik <b>"Generate Hari 1-10 Otomatis"</b> atau <b>"+ Tambah Sesi Harian"</b> di atas.</div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-14 text-center">Hari</th>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Tanggal & Jam</th>
                        <th className="py-2.5 px-4 min-w-[220px]">Materi / Judul Sesi</th>
                        <th className="py-2.5 px-3">Tipe & Ruang</th>
                        <th className="py-2.5 px-3.5">Pengajar</th>
                        <th className="py-2.5 px-3 text-center">Peserta</th>
                        <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...angSchedules]
                        .sort((a, b) => (a.hari_ke || 0) - (b.hari_ke || 0))
                        .slice((schedulePage - 1) * pageSize, schedulePage * pageSize)
                        .map((s) => {
                          const countPeserta = (s.peserta || []).length;
                          const isPretest = s.hari_ke === 1 || s.judul.toLowerCase().includes('pretest');
                          const isPosttest = s.hari_ke === 10 || s.judul.toLowerCase().includes('posttest');

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Kolom 1: Hari */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className="font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] inline-block shadow-2xs">
                                  Hari {s.hari_ke || '-'}
                                </span>
                              </td>

                              {/* Kolom 2: Tanggal & Jam */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-bold text-slate-800 text-xs">
                                  {formatDateOnly(s.tanggal)}
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 font-medium mt-0.5">
                                  {s.jam}
                                </div>
                              </td>

                              {/* Kolom 3: Materi / Judul Sesi */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 text-xs">
                                  {s.judul}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {isPretest && (
                                    <span className="font-bold px-1.5 py-0.5 text-[9px] rounded bg-amber-100 text-amber-800 border border-amber-200">
                                      Pre-test
                                    </span>
                                  )}
                                  {isPosttest && (
                                    <span className="font-bold px-1.5 py-0.5 text-[9px] rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Post-test Ujian
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Kolom 4: Tipe & Ruang */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    s.jenis_sesi === 'Praktik'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}
                                >
                                  {s.jenis_sesi}
                                </span>
                                <div className="text-[11px] text-slate-500 font-medium mt-1">
                                  {s.ruangan}
                                </div>
                              </td>

                              {/* Kolom 5: Pengajar */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="font-medium text-slate-800 text-xs">
                                  {s.pengajar}
                                </span>
                              </td>

                              {/* Kolom 6: Peserta */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] border border-slate-200">
                                  {countPeserta} Org
                                </span>
                              </td>

                              {/* Kolom 7: Aksi */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSession(s);
                                      setSJudul(s.judul);
                                      setSHariKe(s.hari_ke || 1);
                                      setSTanggal(s.tanggal ? s.tanggal.split('T')[0] : '');
                                      setSJam(s.jam);
                                      setSRuangan(s.ruangan);
                                      setSPengajar(s.pengajar);
                                      setSJenisSesi(s.jenis_sesi);

                                      // Auto-match Mata Pelajaran
                                      const lowerJudul = (s.judul || '').toLowerCase();
                                      const matchedMp = mpList.find((m) =>
                                        lowerJudul.includes(m.nama.toLowerCase()) ||
                                        (m.kode && lowerJudul.includes(m.kode.toLowerCase()))
                                      );

                                      if (matchedMp) {
                                        setSSelectedMpId(matchedMp.id);
                                        setIsCustomJudul(false);
                                      } else if (lowerJudul.includes('orientasi')) {
                                        setSSelectedMpId('orientasi');
                                        setIsCustomJudul(false);
                                      } else if (lowerJudul.includes('pretest') || lowerJudul.includes('pre-test')) {
                                        setSSelectedMpId('pretest');
                                        setIsCustomJudul(false);
                                      } else if (lowerJudul.includes('posttest') || lowerJudul.includes('post-test') || lowerJudul.includes('ujian akhir')) {
                                        setSSelectedMpId('posttest');
                                        setIsCustomJudul(false);
                                      } else {
                                        setSSelectedMpId('custom');
                                        setIsCustomJudul(true);
                                      }

                                      setShowAddSessionModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                                    title="Edit Sesi"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSession(s.id, s.judul || 'sesi harian ini')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                                    title="Hapus Sesi"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  <Pagination currentPage={schedulePage} totalItems={angSchedules.length} pageSize={pageSize} onPageChange={setSchedulePage} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PENILAIAN PESERTA */}
        {/* ========================================================================= */}
        {activeDetailTab === 'penilaian' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Penilaian Peserta Pelatihan</h4>
                  <p className="text-xs text-slate-500">
                    Nilai mata pelajaran, pretest, dan ujian akhir. Nilai Ujian Akhir (Posttest) <b>terisi otomatis</b> dari hasil ujian online peserta.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowAddMpModal(true)}
                    className="btn btn-outline btn-sm text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                  >
                    + Tambah Mata Pelajaran
                  </button>
                  <button
                    onClick={handleSaveAllNilai}
                    disabled={savingNilai}
                    className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>{savingNilai ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
                  </button>
                </div>
              </div>

              {savedNilaiMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{savedNilaiMsg}</span>
                </div>
              )}

              {/* Table Penilaian Inline */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-3 py-2.5 w-10 text-center">#</th>
                      <th className="px-4 py-2.5 min-w-[160px]">Nama Peserta</th>
                      {/* Kolom Mata Pelajaran */}
                      {mpList
                        .filter((m) => !ang.program_id || !m.program_id || m.program_id === ang.program_id)
                        .map((mp) => (
                          <th key={mp.id} className="px-2 py-2.5 text-center min-w-[80px]">
                            <div className="font-mono text-indigo-700">{mp.kode}</div>
                            <div className="normal-case font-medium text-[9px] text-slate-400 truncate max-w-[80px]">{mp.nama}</div>
                          </th>
                        ))}
                      <th className="px-2 py-2.5 text-center min-w-[75px] bg-amber-50 text-amber-800">Pretest</th>
                      <th className="px-2 py-2.5 text-center min-w-[90px] bg-emerald-50 text-emerald-800">
                        <div>Ujian Akhir</div>
                        <div className="text-[8px] normal-case text-emerald-600 font-normal">(Auto Posttest)</div>
                      </th>
                      <th className="px-2 py-2.5 text-center min-w-[75px] bg-blue-50 text-blue-800">Kehadiran (%)</th>
                      <th className="px-2 py-2.5 text-center min-w-[65px]">Rata-rata</th>
                      <th className="px-2 py-2.5 text-center min-w-[50px]">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(pulledParticipants.length > 0 ? pulledParticipants : angkatanCandidates).map((p, idx) => {
                      const rowNilai = localNilai[p.id] || {};
                      const posttestAuto = penilaianData?.hasil_posttest[p.id];
                      const activeMpList = mpList.filter((m) => !ang.program_id || !m.program_id || m.program_id === ang.program_id);

                      // Hitung rata-rata
                      const mpScores = activeMpList.map((m) => rowNilai[`mp_${m.id}`]).filter((v) => v !== undefined && !isNaN(v));
                      const postScore = rowNilai['posttest'] !== undefined ? rowNilai['posttest'] : (posttestAuto ? posttestAuto.nilai : undefined);
                      const allScores = [...mpScores, ...(postScore !== undefined ? [postScore] : [])];
                      const avg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : undefined;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-800">{p.nama_lengkap}</div>
                            <div className="font-mono text-[10px] text-indigo-700">{p.no_pendaftaran}</div>
                          </td>

                          {/* Mapel inputs */}
                          {activeMpList.map((mp) => {
                            const key = `mp_${mp.id}`;
                            const val = rowNilai[key];
                            return (
                              <td key={mp.id} className="px-1 py-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  className={`w-14 text-center text-xs border rounded-lg py-1 px-1 focus:ring-1 focus:ring-indigo-400 ${val !== undefined ? nilaiColor(val) : 'text-slate-400'}`}
                                  value={val ?? ''}
                                  placeholder="-"
                                  onChange={(e) => {
                                    const v = e.target.value === '' ? undefined : Number(e.target.value);
                                    setLocalNilai((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], [key]: v as number },
                                    }));
                                  }}
                                />
                              </td>
                            );
                          })}

                          {/* Pretest */}
                          <td className="px-1 py-2 text-center bg-amber-50/40">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              className="w-14 text-center text-xs border border-amber-200 bg-amber-50 rounded-lg py-1 px-1"
                              value={rowNilai['pretest'] ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const v = e.target.value === '' ? undefined : Number(e.target.value);
                                setLocalNilai((prev) => ({ ...prev, [p.id]: { ...prev[p.id], pretest: v as number } }));
                              }}
                            />
                          </td>

                          {/* Ujian Akhir (Posttest auto) */}
                          <td className="px-1 py-2 text-center bg-emerald-50/40">
                            <div className="relative inline-block">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                className="w-16 text-center text-xs border border-emerald-300 bg-emerald-50 rounded-lg py-1 px-1 font-bold text-emerald-800"
                                value={rowNilai['posttest'] ?? ''}
                                placeholder={posttestAuto ? String(posttestAuto.nilai) : '-'}
                                onChange={(e) => {
                                  const v = e.target.value === '' ? undefined : Number(e.target.value);
                                  setLocalNilai((prev) => ({ ...prev, [p.id]: { ...prev[p.id], posttest: v as number } }));
                                }}
                              />
                              {posttestAuto && rowNilai['posttest'] === undefined && (
                                <span className="absolute -top-2 -right-2 text-[8px] bg-emerald-600 text-white rounded-full px-1 font-bold shadow-xs">
                                  Auto
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kehadiran */}
                          <td className="px-1 py-2 text-center bg-blue-50/40">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-14 text-center text-xs border border-blue-200 bg-blue-50 rounded-lg py-1 px-1 font-semibold text-blue-800"
                              value={rowNilai['kehadiran'] ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const v = e.target.value === '' ? undefined : Number(e.target.value);
                                setLocalNilai((prev) => ({ ...prev, [p.id]: { ...prev[p.id], kehadiran: v as number } }));
                              }}
                            />
                          </td>

                          {/* Rata-rata */}
                          <td className="px-2 py-2.5 text-center font-extrabold text-slate-800">
                            {avg !== undefined ? avg : '-'}
                          </td>

                          {/* Grade */}
                          <td className="px-2 py-2.5 text-center font-extrabold text-indigo-700">
                            {avg !== undefined ? nilaiGrade(avg) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CETAK LEMBAR ABSENSI RESMI (DAFTAR HADIR) */}
        {/* ========================================================================= */}
        {activeDetailTab === 'cetak' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Pratinjau Lembar Daftar Hadir Resmi</h4>
                <p className="text-xs text-slate-500">Format A4 Landscape siap cetak dengan kolom tanggal dan tanda tangan harian peserta</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <label className="font-semibold text-slate-600">Jumlah Kolom Hari:</label>
                  <select
                    value={jumlahKolHadir}
                    onChange={(e) => setJumlahKolHadir(Number(e.target.value))}
                    className="form-input text-xs py-1 px-2 font-bold"
                  >
                    <option value={10}>10 Hari</option>
                    <option value={12}>12 Hari</option>
                    <option value={14}>14 Hari</option>
                    <option value={20}>20 Hari</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={printIncludeStatus}
                    onChange={(e) => setPrintIncludeStatus(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium">Sertakan Status Presensi Database</span>
                </label>

                <button
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>
            </div>

            {/* Print Container with ID #print-absensi */}
            <div className="rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50">
              <div className="bg-slate-200/80 px-4 py-2 text-xs font-bold text-slate-600 flex items-center gap-2">
                <span>PRATINJAU DOKUMEN CETAK — Klik "Cetak / Simpan PDF" di atas untuk mencetak lembar resmi A4 Landscape</span>
              </div>

              <div id="print-absensi" className="bg-white p-6 print-area text-black">
                {/* Header Dokumen */}
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                  <div className="font-extrabold text-xl tracking-wide text-black uppercase">
                    LEMBAGA PELATIHAN KERJA (LPK) LELES
                  </div>
                  <div className="text-xs text-gray-700">
                    Jl. Raya Leles No. 1, Kec. Leles, Kabupaten Garut, Jawa Barat
                  </div>
                  <div className="mt-2 font-extrabold text-base text-black uppercase tracking-wider">
                    DAFTAR HADIR PESERTA PELATIHAN
                  </div>
                </div>

                {/* Metadata info */}
                <div className="grid grid-cols-2 gap-x-8 mb-4 text-xs text-black">
                  <div className="space-y-1">
                    <div className="flex"><span className="w-36 font-semibold">Angkatan</span><span>: {ang.nama_angkatan} ({ang.kode_angkatan})</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Program Pelatihan</span><span>: {ang.program?.nama || ang.program_id}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Tempat / Ruangan</span><span>: {venue} ({room})</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex"><span className="w-36 font-semibold">Instruktur Pengajar</span><span>: {angSchedules[0]?.pengajar || '-'}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Periode Pelatihan</span><span>: {jadwalRangeMulai ? formatDateOnly(jadwalRangeMulai) : '-'} s.d. {jadwalRangeSelesai ? formatDateOnly(jadwalRangeSelesai) : '-'}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Jumlah Peserta</span><span>: {(pulledParticipants.length > 0 ? pulledParticipants : angkatanCandidates).length} orang</span></div>
                  </div>
                </div>

                {/* Main Print Table: Hanya Kehadiran Saja dengan Kolom Tanda Tangan per Hari */}
                {(() => {
                  const participantsToPrint = pulledParticipants.length > 0 ? pulledParticipants : angkatanCandidates;

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[10px] text-black" style={{ minWidth: '920px' }}>
                        <thead>
                          <tr className="bg-gray-100">
                            <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold w-8">No</th>
                            <th rowSpan={2} className="border border-black px-2.5 py-1 text-left font-bold min-w-[160px]">Nama Lengkap</th>
                            <th rowSpan={2} className="border border-black px-2 py-1 text-center font-bold min-w-[95px]">NIK</th>
                            <th colSpan={jumlahKolHadir} className="border border-black px-1 py-1.5 text-center font-bold uppercase tracking-wider">
                              Tanda Tangan Kehadiran Peserta (Hari ke- & Tanggal)
                            </th>
                            <th colSpan={2} className="border border-black px-1 py-1 text-center font-bold w-24">Rekap</th>
                          </tr>
                          <tr className="bg-gray-100">
                            {Array.from({ length: jumlahKolHadir }, (_, i) => {
                              const dayNum = i + 1;
                              const session = angSchedules.find((s) => s.hari_ke === dayNum);
                              let dayDate = '';
                              if (session?.tanggal) {
                                dayDate = formatShortDate(session.tanggal);
                              } else if (jadwalRangeMulai) {
                                try {
                                  dayDate = formatShortDate(addDaysStr(jadwalRangeMulai, i));
                                } catch (e) { }
                              }

                              return (
                                <th key={i} className="border border-black px-1 py-1 text-center font-bold min-w-[68px]">
                                  <div className="font-extrabold text-[10px] text-black">Hari {dayNum}</div>
                                  <div className="text-[8px] font-mono text-gray-700 font-semibold mt-0.5 whitespace-nowrap">
                                    {dayDate || '-'}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="border border-black px-1 py-1 text-center font-bold w-12 text-[9px]">Hadir</th>
                            <th className="border border-black px-1 py-1 text-center font-bold w-12 text-[9px]">Ket</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participantsToPrint.map((p, idx) => {
                            let totalHadirPeserta = 0;

                            return (
                              <tr key={p.id} className={idx % 2 === 0 ? '' : 'bg-gray-50/70'}>
                                <td className="border border-black px-1 py-2 text-center font-bold text-[10px]">{idx + 1}</td>
                                <td className="border border-black px-2.5 py-2 font-bold text-[11px] text-slate-900">{p.nama_lengkap}</td>
                                <td className="border border-black px-2 py-2 font-mono text-[9px] text-center">{p.nik}</td>

                                {/* Kolom Tanda Tangan Setiap Hari (Hari 1 s.d 10) */}
                                {Array.from({ length: jumlahKolHadir }, (_, i) => {
                                  const dayNum = i + 1;
                                  const session = angSchedules.find((s) => s.hari_ke === dayNum);
                                  const sessionDate = session?.tanggal ? session.tanggal.split('T')[0] : null;

                                  const rec = sessionDate
                                    ? kehadiranRecords.find((k) => k.pendaftar_id === p.id && k.tanggal && k.tanggal.startsWith(sessionDate))
                                    : null;

                                  if (rec?.status_kehadiran === 'Hadir') {
                                    totalHadirPeserta++;
                                  }

                                  return (
                                    <td key={i} className="border border-black px-1 py-1 text-center h-14 min-w-[68px] align-middle">
                                      {printIncludeStatus && rec ? (
                                        <div className="w-full h-full flex flex-col justify-between items-center py-0.5">
                                          <span className="text-[7px] text-gray-400 font-mono self-start leading-none">{idx + 1}.</span>
                                          {rec.status_kehadiran === 'Hadir' ? (
                                            <div className="my-auto text-center">
                                              <span className="text-sm font-extrabold text-emerald-800 leading-none">✓</span>
                                              <div className="text-[7px] font-bold text-slate-800 tracking-wider">HADIR</div>
                                            </div>
                                          ) : rec.status_kehadiran === 'Izin' ? (
                                            <span className="text-[8px] font-bold text-blue-800 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">Izin</span>
                                          ) : rec.status_kehadiran === 'Sakit' ? (
                                            <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Sakit</span>
                                          ) : (
                                            <span className="text-[8px] font-bold text-red-800 bg-red-50 px-1 py-0.5 rounded border border-red-200">Alpha</span>
                                          )}
                                          <span className="text-[6px] text-gray-400 border-t border-dotted border-gray-400 w-8"></span>
                                        </div>
                                      ) : (
                                        <div className="w-full h-full flex flex-col justify-between p-0.5">
                                          <span className="text-[8px] text-gray-400 font-mono self-start leading-none">{idx + 1}.</span>
                                          <span className="text-[7px] text-gray-300 italic self-center">Paraf</span>
                                          <span className="border-b border-dotted border-gray-300 w-full"></span>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Total Hadir */}
                                <td className="border border-black px-1 py-2 text-center font-bold text-[10px]">
                                  {totalHadirPeserta > 0 ? `${totalHadirPeserta}/${jumlahKolHadir}` : '-'}
                                </td>

                                {/* Keterangan */}
                                <td className="border border-black px-1 py-2 text-center text-[9px] text-gray-600">
                                  &nbsp;
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* Tanda Tangan Footer */}
                <div className="mt-8 flex justify-between items-end text-xs text-black">
                  <div className="text-center">
                    <div>Mengetahui,</div>
                    <div className="font-semibold">Kepala LPK Leles</div>
                    <div className="mt-14 border-t border-black w-40 mx-auto"></div>
                    <div className="font-semibold">(_________________________)</div>
                    <div>NIP. ___________________</div>
                  </div>
                  <div className="text-center">
                    <div>Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="font-semibold">Instruktur / Pengajar Pelatihan</div>
                    <div className="mt-14 border-t border-black w-40 mx-auto"></div>
                    <div className="font-semibold">({angSchedules[0]?.pengajar || '-'})</div>
                    <div>NIP. ___________________</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* POP-UP MODAL TARIK / PILIH PESERTA ANGKATAN */}
        {/* ========================================================================= */}
        {showPullModal && (
          <div className="modal-overlay" onClick={() => setShowPullModal(false)}>
            <div className="modal-content max-w-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Pilih & Tarik Peserta — {ang.nama_angkatan}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan {angkatanCandidates.length} peserta terdaftar khusus pada {ang.nama_angkatan} untuk ditarik ke {venue}.
                  </p>
                </div>
                <button onClick={() => setShowPullModal(false)} className="text-slate-400 hover:text-black text-lg">
                  ✕
                </button>
              </div>

              {/* Action Button: Tarik Semua */}
              {angkatanCandidates.length > 0 && ang?.status !== 'Selesai' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => handleBulkPullParticipants(ang)}
                    disabled={isGenerating}
                    className="btn btn-primary btn-sm font-bold text-xs"
                  >
                    {isGenerating ? 'Memproses...' : `Tarik Semua Peserta Angkatan (${angkatanCandidates.length} Orang)`}
                  </button>
                </div>
              )}
              {ang?.status === 'Selesai' && (
                <p className="text-[11px] italic text-slate-400 text-right">Angkatan selesai — plotting dikunci.</p>
              )}

              {/* Candidates List inside Pop-up */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {angkatanCandidates.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl">
                    Belum ada peserta terdaftar pada {ang.nama_angkatan}.
                  </div>
                ) : (
                  angkatanCandidates.map((p, idx) => {
                    const isPulled = pulledParticipantIds.has(p.id);

                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${isPulled
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-bold">{idx + 1}.</span>
                            <span className="font-bold text-slate-800 text-sm">{p.nama_lengkap}</span>
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {p.no_pendaftaran}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            NIK: {p.nik} • HP: {p.no_hp}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setViewingParticipantDetail(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                          >
                            Detail
                          </button>

                          {isPulled ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                Terdaftar Di Jadwal
                              </span>
                              {ang?.status !== 'Selesai' && (
                              <button
                                type="button"
                                onClick={() => handleToggleSingleParticipant(ang, p.id, true)}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                              >
                                Keluarkan
                              </button>
                              )}
                            </div>
                          ) : (
                            ang?.status !== 'Selesai' && (
                            <button
                              type="button"
                              onClick={() => handleToggleSingleParticipant(ang, p.id, false)}
                              disabled={isGenerating}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              + Tarik Peserta Ini
                            </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button onClick={() => setShowPullModal(false)} className="btn btn-primary btn-sm font-bold">
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Add / Edit Sesi Harian */}
        {showAddSessionModal && (
          <div className="modal-overlay" onClick={() => { if (!isSavingSession) setShowAddSessionModal(false); }}>
            <div className="modal-content relative max-w-lg p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {isSavingSession && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingSession ? 'Edit Sesi Harian' : 'Tambah Sesi Harian Pelatihan'}
                </h3>
                <button disabled={isSavingSession} onClick={() => setShowAddSessionModal(false)} className="text-slate-400 hover:text-black disabled:opacity-40">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
                {/* PILIHAN MATA PELAJARAN (Dropdown terintegrasi CRUD Mapel) */}
                <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="form-label font-bold text-indigo-950 mb-0 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                      Mata Pelajaran Pelatihan *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddMpModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                    >
                      + Mapel Baru
                    </button>
                  </div>

                  <select
                    className="form-input bg-white text-xs font-semibold text-slate-800 border-indigo-200 focus:border-indigo-500 shadow-sm"
                    value={sSelectedMpId}
                    onChange={(e) => handleMpChange(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mpList.length > 0 && (
                      <optgroup label="Mata Pelajaran Kurikulum (Database)">
                        {mpList
                          .filter((m) => !selectedAngkatanForDetail?.program_id || !m.program_id || m.program_id === selectedAngkatanForDetail.program_id)
                          .map((mp) => (
                            <option key={mp.id} value={mp.id}>
                              [{mp.kode}] {mp.nama}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup label="Sesi Orientasi & Evaluasi">
                      <option value="orientasi">Orientasi & K3 Program Pelatihan</option>
                      <option value="pretest">Ujian Pre-Test (Awal)</option>
                      <option value="posttest">Ujian Post-Test & Evaluasi Kelulusan</option>
                    </optgroup>
                    <option value="custom">✍️ Tulis Judul Manual / Kustom</option>
                  </select>

                  {/* Output Judul Sesi Otomatis */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Judul Sesi {isCustomJudul ? '(Mode Manual)' : '(Format Otomatis)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomJudul(!isCustomJudul)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        {isCustomJudul ? '🔄 Reset ke Otomatis' : '✏️ Kustom Teks'}
                      </button>
                    </div>
                    <input
                      type="text"
                      className={`form-input text-xs ${!isCustomJudul ? 'bg-slate-100/90 text-slate-700 font-medium cursor-default' : 'bg-white'}`}
                      placeholder="Pilih mata pelajaran di atas atau ketik judul..."
                      value={sJudul}
                      onChange={(e) => {
                        setSJudul(e.target.value);
                        setIsCustomJudul(true);
                      }}
                      readOnly={!isCustomJudul}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label font-bold text-slate-700">Hari Ke-</label>
                    <input
                      type="number"
                      className="form-input"
                      value={sHariKe}
                      onChange={(e) => handleHariKeChange(Number(e.target.value))}
                      min={1}
                      max={30}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label font-bold text-slate-700">Jenis Sesi</label>
                    <select
                      className="form-input"
                      value={sJenisSesi}
                      onChange={(e) => setSJenisSesi(e.target.value as JenisSesi)}
                    >
                      <option value="Orientasi">Orientasi</option>
                      <option value="Teori">Teori</option>
                      <option value="Praktik">Praktik</option>
                      <option value="Ujian">Ujian</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label font-bold text-slate-700">Tanggal Pelaksanaan</label>
                    <input
                      type="date"
                      className="form-input"
                      value={sTanggal}
                      min={toDateInput(selectedAngkatanForDetail?.tanggal_mulai) || undefined}
                      onChange={(e) => setSTanggal(e.target.value)}
                      required
                    />
                    {selectedAngkatanForDetail?.tanggal_mulai && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tidak boleh sebelum mulai angkatan ({toDateInput(selectedAngkatanForDetail.tanggal_mulai)}).
                      </p>
                    )}
                    {sTanggal && isTanggalMerah(sTanggal) && (
                      <p className="text-[11px] font-semibold text-amber-600 mt-1">
                        Perhatian: {sTanggal} adalah {keteranganTanggalMerah(sTanggal)} — sesi sebaiknya digeser ke hari valid.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label font-bold text-slate-700">Jam</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="08:00 - 12:00"
                      value={sJam}
                      onChange={(e) => setSJam(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label font-bold text-slate-700">Ruangan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={sRuangan}
                      onChange={(e) => setSRuangan(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label font-bold text-slate-700">Pengajar</label>
                    <InstrukturSearchSelect
                      value={sPengajar}
                      onChange={setSPengajar}
                      instrukturList={instrukturList}
                      placeholder="Ketik untuk cari instruktur..."
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" disabled={isSavingSession} onClick={() => setShowAddSessionModal(false)} className="btn btn-outline btn-sm disabled:opacity-50">
                    Batal
                  </button>
                  <button type="submit" disabled={isSavingSession} className="btn btn-primary btn-sm font-bold flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed">
                    {isSavingSession && (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isSavingSession
                      ? (editingSession ? 'Menyimpan...' : 'Menambahkan...')
                      : (editingSession ? 'Simpan Perubahan' : 'Tambah Sesi')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail Profile Peserta */}
        {viewingParticipantDetail && (
          <AdminPendaftarDetail
            pendaftar={viewingParticipantDetail}
            onClose={() => setViewingParticipantDetail(null)}
            onStatusChange={loadData}
          />
        )}

        {/* Modal Tambah Mata Pelajaran Cepat */}
        {showAddMpModal && (
          <div className="modal-overlay" onClick={() => setShowAddMpModal(false)}>
            <div className="modal-content max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Tambah Mata Pelajaran Baru</h3>
                <button onClick={() => setShowAddMpModal(false)} className="text-slate-400 hover:text-black">✕</button>
              </div>
              <form onSubmit={handleCreateQuickMp} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label font-bold text-slate-700">Kode Mapel *</label>
                    <input type="text" className="form-input text-xs uppercase font-mono" placeholder="misal: MTK01" value={newMpKode} onChange={(e) => setNewMpKode(e.target.value.toUpperCase())} required />
                  </div>
                  <div>
                    <label className="form-label font-bold text-slate-700">Urutan</label>
                    <input type="number" className="form-input text-xs" value={newMpUrutan} onChange={(e) => setNewMpUrutan(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div>
                  <label className="form-label font-bold text-slate-700">Nama Mata Pelajaran *</label>
                  <input type="text" className="form-input text-xs" placeholder="misal: Teknik Pola Dasar" value={newMpNama} onChange={(e) => setNewMpNama(e.target.value)} required />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddMpModal(false)} className="btn btn-outline btn-sm">Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm font-bold">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteConfirmModal
          open={Boolean(deleteTarget)}
          title="Hapus Sesi?"
          message="Anda yakin ingin menghapus sesi"
          itemName={deleteTarget?.name || null}
          loading={isDeleting}
          onConfirm={confirmDeleteSession}
          onCancel={() => {
            if (!isDeleting) setDeleteTarget(null);
          }}
        />

        <ActionToast toast={actionToast} onClose={hideToast} />
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 1: GRID LIST CARD KOTAK PAKET JADWAL
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{modeTitle}</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {modeSubtitle}
          </p>
        </div>
        {canManagePackage && (
          <button
            onClick={() => {
              const firstId = angkatanList.length > 0 && !cAngkatanId ? angkatanList[0].id : cAngkatanId;
              if (angkatanList.length > 0 && !cAngkatanId) setCAngkatanId(angkatanList[0].id);
              if (firstId && !editingPackage) fillRentangFromAngkatan(firstId);
              setShowCreateModal(true);
            }}
            className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold self-start sm:self-auto shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Buat Jadwal Baru</span>
          </button>
        )}
      </div>

      {/* FILTER BAR BERDASARKAN TEMPAT */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600 shrink-0 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Filter Berdasarkan Tempat:</span>
            </span>
            <button
              onClick={() => setFilterTempat('semua')}
              className={`btn btn-sm text-xs ${filterTempat === 'semua' ? 'btn-primary font-bold' : 'btn-outline'}`}
            >
              Semua Tempat
            </button>
            {tempatList.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTempat(t.nama_tempat)}
                className={`btn btn-sm text-xs ${filterTempat === t.nama_tempat ? 'btn-primary font-bold' : 'btn-outline'}`}
              >
                {t.nama_tempat.replace('Gedung LPK ', '').replace(' Leles', '')}
              </button>
            ))}
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              className="form-input text-xs"
              placeholder="Cari angkatan atau tempat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE VIEW: KELOLA JADWAL & LOKASI PELATIHAN */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Paket Jadwal & Angkatan</th>
                <th className="py-3.5 px-5">Lokasi Pelatihan & Ruangan</th>
                <th className="py-3.5 px-5">Status Angkatan</th>
                <th className="py-3.5 px-5">Total Sesi</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPackageCards.length === 0 ? (
                <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada kelas yang ditemukan.
                      {canManagePackage && (
                        <> Klik tombol <b>"Buat Jadwal Baru"</b> untuk menambahkan paket jadwal.</>
                      )}
                    </td>
                </tr>
              ) : (
                filteredPackageCards.map((card) => {
                  const { angkatan: ang, tempat_pelatihan: venue, ruangan: room, pengajar, schedules: angSchedules } = card;
                  const totalSessions = angSchedules.length;

                  return (
                    <tr
                      key={card.key}
                      onClick={() => handleOpenDetailCard(ang, venue)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Column 1: Angkatan & Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-extrabold flex items-center justify-center text-[11px] shadow-2xs shrink-0 uppercase tracking-tight">
                            {ang.kode_angkatan.replace('ANG-', '') || 'AG'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                              {ang.nama_angkatan}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {ang.kode_angkatan}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Program: <strong className="text-slate-700">{ang.program?.nama || ang.program_id}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Venue & Pengajar */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600 shrink-0">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="truncate max-w-xs">{venue}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium pl-4">
                            {room} • Pengajar: <span className="text-slate-700 font-semibold">{pengajar}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Status Angkatan */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${ang.status === 'On_Going'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ang.status === 'Pendaftaran'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                          {ang.status}
                        </span>
                      </td>

                      {/* Column 4: Sesi Pill (Tanpa Peserta) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 inline-block">
                          {totalSessions} Sesi (1-10)
                        </span>
                      </td>

                      {/* Column 5: Action Buttons (Detail, Edit, Hapus) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Peserta Button */}
                          {allowedTabs.includes('peserta') && (
                            <button
                              type="button"
                              title="Kelola Daftar Peserta"
                              onClick={() => handleOpenDetailCard(ang, venue, 'peserta')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Peserta</span>
                            </button>
                          )}

                          {/* Sesi Button */}
                          {allowedTabs.includes('jadwal') && (
                            <button
                              type="button"
                              title="Kelola Jadwal Sesi Pelatihan"
                              onClick={() => handleOpenDetailCard(ang, venue, 'jadwal')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Sesi</span>
                            </button>
                          )}

                          {/* Nilai Button */}
                          {allowedTabs.includes('penilaian') && (
                            <button
                              type="button"
                              title="Input Penilaian Peserta"
                              onClick={() => handleOpenDetailCard(ang, venue, 'penilaian')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Nilai</span>
                            </button>
                          )}

                          {/* Cetak Button */}
                          {allowedTabs.includes('cetak') && (
                            <button
                              type="button"
                              title="Cetak Lembar Absensi PDF"
                              onClick={() => handleOpenDetailCard(ang, venue, 'cetak')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                            >
                              <span>Cetak</span>
                            </button>
                          )}

                          {canManagePackage && <div className="h-4 w-px bg-slate-200 mx-0.5" />}

                          {/* Edit Button */}
                          {canManagePackage && (
                          <>
                          <button
                            type="button"
                            title="Edit Paket Jadwal"
                            onClick={() => handleEditPackageCard(card)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                            <span>Edit</span>
                          </button>

                          {/* Hapus Button */}
                          <button
                            type="button"
                            title="Hapus Paket Jadwal"
                            onClick={() => handleDeletePackageCard(card)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                          </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: BUAT JADWAL BARU */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { if (!isGenerating) { setShowCreateModal(false); setEditingPackage(null); } }}>
          <div className="modal-content relative max-w-lg p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isGenerating && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
              </div>
            )}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingPackage ? 'Edit Paket Jadwal' : 'Buat Kelola Jadwal Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingPackage
                    ? 'Form memperbarui alokasi tempat pelatihan, ruangan, dan pengajar paket jadwal'
                    : 'Form memilih angkatan dan alokasi tempat pelatihan'}
                </p>
              </div>
              <button onClick={() => { if (!isGenerating) { setShowCreateModal(false); setEditingPackage(null); } }} disabled={isGenerating} className="text-slate-400 hover:text-black disabled:opacity-40">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJadwalPackage} className="space-y-4 text-xs">
              <div>
                <label className="form-label font-bold text-slate-700">1. Pilih Angkatan Pelatihan</label>
                <select
                  className="form-input"
                  value={cAngkatanId}
                  onChange={(e) => {
                    setCAngkatanId(e.target.value);
                    if (!editingPackage) fillRentangFromAngkatan(e.target.value);
                  }}
                  required
                >
                  {angkatanList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.kode_angkatan} — {a.nama_angkatan} ({a.program?.nama || a.program_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label font-bold text-slate-700">2. Pilih Tempat Pelatihan (Fixed/Tetap)</label>
                <select
                  className="form-input"
                  value={cTempatName}
                  onChange={(e) => setCTempatName(e.target.value)}
                  required
                >
                  {tempatList.map((t) => (
                    <option key={t.id} value={t.nama_tempat}>
                      {t.nama_tempat} ({t.kapasitas} Peserta) — {t.alamat_lengkap}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tempat pelatihan disetel tetap untuk seluruh sesi Hari 1 s.d. 10 angkatan ini.
                </p>
              </div>

              <div>
                <label className="form-label font-bold text-slate-700">3. Rentang Pelatihan Jadwal</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Tanggal Mulai</label>
                    <input
                      type="date"
                      className="form-input"
                      value={cTanggalMulai}
                      min={cMinTanggal || undefined}
                      onChange={(e) => setCTanggalMulai(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Tanggal Selesai</label>
                    <input
                      type="date"
                      className="form-input"
                      value={cTanggalSelesai}
                      min={cTanggalMulai || cMinTanggal || undefined}
                      onChange={(e) => setCTanggalSelesai(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rentang angkatan: <span className="font-semibold text-slate-600">{cAngkatanRangeLabel}</span>.
                  Tanggal mulai jadwal tidak boleh sebelum tanggal mulai angkatan
                  {cMinTanggal ? (<span className="font-mono font-semibold"> ({cMinTanggal})</span>) : ''}.
                </p>
                {cTanggalMulai && cTanggalSelesai && cTanggalSelesai >= cTanggalMulai && (
                  <p className="text-[11px] text-indigo-600 mt-1">
                    Hari Minggu & tanggal merah ({hitungHariLibur(cTanggalMulai, cTanggalSelesai)} hari) dilewati otomatis saat generate.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label font-bold text-slate-700">Ruangan Default</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ruang Teori A"
                    value={cRuangan}
                    onChange={(e) => setCRuangan(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label font-bold text-slate-700">Pengajar Utama</label>
                  <InstrukturSearchSelect
                    value={cPengajar}
                    onChange={setCPengajar}
                    instrukturList={instrukturList}
                    placeholder="Ketik untuk cari instruktur..."
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-indigo-900">Generate Paket 10-Hari Otomatis</div>
                  <div className="text-[11px] text-indigo-700">Hari 1 Pre-test, Hari 2-9 Teori/Praktik, Hari 10 Post-test</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoGenerate10Days}
                  onChange={(e) => setAutoGenerate10Days(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" disabled={isGenerating} onClick={() => { setShowCreateModal(false); setEditingPackage(null); }} className="btn btn-outline btn-sm disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={isGenerating} className="btn btn-primary btn-sm font-bold flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed">
                  {isGenerating && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isGenerating ? 'Memproses...' : (editingPackage ? 'Simpan Perubahan' : 'Buat Paket Jadwal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PROFILE PESERTA */}
      {viewingParticipantDetail && (
        <AdminPendaftarDetail
          pendaftar={viewingParticipantDetail}
          onClose={() => setViewingParticipantDetail(null)}
          onStatusChange={loadData}
        />
      )}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Sesi?"
        message="Anda yakin ingin menghapus sesi"
        itemName={deleteTarget?.name || null}
        loading={isDeleting}
        onConfirm={confirmDeleteSession}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      <DeleteConfirmModal
        open={Boolean(packageDeleteTarget)}
        title="Hapus Paket Jadwal?"
        message={`Anda yakin ingin menghapus paket "${packageDeleteTarget?.angkatan.nama_angkatan}" di ${packageDeleteTarget?.tempat_pelatihan}? (${packageDeleteTarget?.schedules.length || 0} sesi akan dihapus)`}
        itemName={null}
        loading={isDeleting}
        onConfirm={confirmDeletePackageCard}
        onCancel={() => {
          if (!isDeleting) setPackageDeleteTarget(null);
        }}
      />

      <ActionToast toast={actionToast} onClose={hideToast} />
    </div>
  );
}
