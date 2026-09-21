'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import CalendarView from '@/Components/CalendarView';
import JadwalTable from '@/Components/JadwalTable';
import PenilaianPanel from '@/Components/PenilaianPanel';
import { RiwayatUjianPanel } from '@/Components/RiwayatUjian';
import { type JadwalPelatihan, type Pendaftar } from '@/lib/storage';
import { angkatanApi, authApi, instrukturApi, jadwalApi, pendaftarApi, programsApi, soalApi } from '@/lib/api';
import { getToken, removeToken, setRoleUser } from '@/lib/axios';
import type { Angkatan, Instruktur, ProgramPelatihan, SoalUjian } from '@/lib/types';

type InstrukturTab = 'jadwal' | 'peserta' | 'penilaian' | 'histori_ujian' | 'profil' | 'materi' | 'soal_ujian';

export interface KelasBinaan {
  key: string;
  angkatanId: string;
  angkatanNama: string;
  kodeAngkatan: string;
  programId?: string;
  programNama: string;
  tempat: string;
  jadwal: JadwalPelatihan[];
  pesertaIds: string[];
}

export default function InstrukturDashboardPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<InstrukturTab>('jadwal');
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>([]);
  // Seluruh jadwal (tanpa filter pengajar) — untuk peta plotting per angkatan.
  const [allJadwalList, setAllJadwalList] = useState<JadwalPelatihan[]>([]);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [programList, setProgramList] = useState<ProgramPelatihan[]>([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('Semua');
  const [soalList, setSoalList] = useState<SoalUjian[]>([]);
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [myInstruktur, setMyInstruktur] = useState<Instruktur | null>(null);
  const [myUser, setMyUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [jadwalFiltered, setJadwalFiltered] = useState(false);
  const [selectedKelasKey, setSelectedKelasKey] = useState<string>('');
  const [jadwalViewMode, setJadwalViewMode] = useState<'calendar' | 'table'>('calendar');

  // Profil state
  const [editingProfil, setEditingProfil] = useState(false);
  const [pNama, setPNama] = useState('');
  const [pNoHp, setPNoHp] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pKeahlian, setPKeahlian] = useState('');
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilMsg, setProfilMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLama, setPwLama] = useState('');
  const [pwBaru, setPwBaru] = useState('');
  const [pwKonfirmasi, setPwKonfirmasi] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Material upload state
  const [materiJudul, setMateriJudul] = useState('');
  const [materiProgram, setMateriProgram] = useState('');
  const [materiSuccess, setMateriSuccess] = useState(false);

  // Soal ujian state
  const [showSoalModal, setShowSoalModal] = useState(false);
  const [editingSoal, setEditingSoal] = useState<SoalUjian | null>(null);
  const [isSavingSoal, setIsSavingSoal] = useState(false);
  const [filterSoalTipe, setFilterSoalTipe] = useState<'semua' | 'pretest' | 'posttest'>('semua');
  const [soalPage, setSoalPage] = useState(1);
  
  // Form fields for soal
  const [sJenisPelatihan, setSJenisPelatihan] = useState('Semua');
  const [sTipe, setSTipe] = useState<'pretest' | 'posttest'>('pretest');
  const [sPertanyaan, setSPertanyaan] = useState('');
  const [sOpsiA, setSOpsiA] = useState('');
  const [sOpsiB, setSOpsiB] = useState('');
  const [sOpsiC, setSOpsiC] = useState('');
  const [sOpsiD, setSOpsiD] = useState('');
  const [sJawabanBenar, setSJawabanBenar] = useState(0);
  const [sGambarFile, setSGambarFile] = useState<File | null>(null);
  const [sGambarPreview, setSGambarPreview] = useState<string | null>(null);
  const [sIsActive, setSIsActive] = useState(true);
  const [filterSoalStatus, setFilterSoalStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');

  // Histori pengerjaan ujian per peserta binaan (croschek jawaban)
  const [historiPesertaId, setHistoriPesertaId] = useState('');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    // Identitas instruktur WAJIB dari token per-peran (/auth/me), bukan dari
    // cookie session (dipakai bersama antar-tab) atau cache bersama.
    if (!getToken('INSTRUKTUR')) {
      router.visit('/login');
      return;
    }
    try {
      const [jadwalRes, pendaftarRes, progRes, soalRes, meRes, insRes, angkRes] = await Promise.all([
        jadwalApi.list(),
        pendaftarApi.list(),
        programsApi.list(),
        soalApi.list(),
        authApi.me().catch(() => null),
        instrukturApi.list().catch(() => null),
        angkatanApi.list().catch(() => null),
      ]);
      const allJadwal = jadwalRes.data || [];
      setAllJadwalList(allJadwal);

      // Kenali instruktur yang sedang login lalu tampilkan hanya jadwal miliknya
      // (dicocokkan lewat nama pengajar pada tiap sesi: jadwal 1,3,5,7,9 dst.)
      let mine: Instruktur | null = null;
      const meUser = (meRes as any)?.data || (meRes as any)?.user || null;
      if (!meUser || (meUser.role || '').toUpperCase() !== 'INSTRUKTUR') {
        // Token hilang/kedaluwarsa ATAU milik peran lain → bukan sesi
        // instruktur yang valid. Jangan tampilkan data siapa pun.
        removeToken('INSTRUKTUR');
        sessionStorage.removeItem('lpk_instruktur_logged_in');
        router.visit('/login');
        return;
      }
      if ((meUser as any).instruktur) {
        mine = (meUser as any).instruktur;
      }
      setMyUser({ id: meUser.id, username: meUser.username, email: meUser.email });
      setRoleUser('INSTRUKTUR', meUser);
      if (!mine) {
        // Fallback terakhir: cocokkan user_id pada daftar instruktur
        // (BUKAN dari cache bersama — hanya dari /auth/me di atas).
        const list: Instruktur[] = (insRes as any)?.data || [];
        mine = list.find((i) => i.user_id === meUser.id) || null;
      }

      if (mine) {
        const target = mine.nama.trim().toLowerCase();
        setJadwalList(allJadwal.filter((j) => (j.pengajar || '').trim().toLowerCase() === target));
        setMyInstruktur(mine);
        setJadwalFiltered(true);
        setPNama(mine.nama);
        setPNoHp(mine.no_hp || '');
        setPEmail(mine.email || '');
        setPKeahlian(mine.keahlian || '');
      } else {
        setJadwalList(allJadwal);
        setMyInstruktur(null);
        setJadwalFiltered(false);
      }
      const allPendaftar = pendaftarRes.data?.data || [];
      setPendaftarList(allPendaftar.filter((p: Pendaftar) => p.status === 'diterima'));
      const progs = progRes.data || [];
      setProgramList(progs);
      setSoalList(soalRes.data || []);
      setAngkatanList((angkRes as any)?.data || []);
      if (progs.length > 0 && !materiProgram) {
        setMateriProgram(progs[0].nama);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [materiProgram]);

  useEffect(() => {
    if (sessionStorage.getItem('lpk_instruktur_logged_in') !== 'true') {
      router.visit('/login');
      return;
    }
    setIsAuthed(true);
    loadData();
  }, [router, loadData]);

  // Auto-refresh agar perubahan admin di tab lain (tambah/keluarkan peserta,
  // ubah jadwal/soal) otomatis tercermin tanpa refresh manual.
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') loadDataRef.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadDataRef.current();
    };
    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = window.setInterval(refreshIfVisible, 60000);
    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  // Refetch tiap kali masuk tab berisi data peserta (peserta/penilaian/histori).
  useEffect(() => {
    if (activeTab === 'peserta' || activeTab === 'penilaian' || activeTab === 'histori_ujian') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleLogout = () => {
    // Logout HANYA peran instruktur: revoke token sendiri di server, hapus
    // key peran sendiri. Peran lain di tab sebelah tetap login.
    authApi.logout().catch(() => null);
    removeToken('INSTRUKTUR');
    sessionStorage.removeItem('lpk_instruktur_logged_in');
    router.visit('/login');
  };

  const handleUploadMateri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiJudul) return;
    setMateriSuccess(true);
    setMateriJudul('');
    setTimeout(() => setMateriSuccess(false), 3000);
  };

  // ── Soal Ujian Handlers ──────────────────────────────────────────────
  const handleOpenAddSoal = () => {
    setEditingSoal(null);
    setSJenisPelatihan('Semua');
    setSTipe('pretest');
    setSPertanyaan('');
    setSOpsiA('');
    setSOpsiB('');
    setSOpsiC('');
    setSOpsiD('');
    setSJawabanBenar(0);
    setSGambarFile(null);
    setSGambarPreview(null);
    setSIsActive(true);
    setShowSoalModal(true);
  };

  const handleOpenEditSoal = (soal: SoalUjian) => {
    setEditingSoal(soal);
    setSJenisPelatihan(soal.jenis_pelatihan);
    setSTipe(soal.tipe);
    setSPertanyaan(soal.pertanyaan);
    setSOpsiA(soal.opsi[0] || '');
    setSOpsiB(soal.opsi[1] || '');
    setSOpsiC(soal.opsi[2] || '');
    setSOpsiD(soal.opsi[3] || '');
    setSJawabanBenar(soal.jawaban_benar);
    setSGambarFile(null);
    setSGambarPreview(soal.gambar_soal || null);
    setSIsActive(soal.is_active ?? true);
    setShowSoalModal(true);
  };

  const handleToggleSoalStatus = async (soal: SoalUjian) => {
    try {
      const next = !(soal.is_active ?? true);
      await soalApi.updateStatus(soal.id, next);
      await loadData();
    } catch (err) {
      console.error('Error toggling soal status:', err);
      alert('Gagal mengubah status soal.');
    }
  };

  const handleSaveSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sPertanyaan || !sOpsiA || !sOpsiB || !sOpsiC || !sOpsiD) return;

    setIsSavingSoal(true);
    const isEdit = Boolean(editingSoal);

    try {
      const payload = {
        jenis_pelatihan: sJenisPelatihan,
        tipe: sTipe as any,
        pertanyaan: sPertanyaan,
        opsi: [sOpsiA, sOpsiB, sOpsiC, sOpsiD],
        jawaban_benar: Number(sJawabanBenar),
        gambar_soal: sGambarFile || undefined,
        is_active: sIsActive,
      };

      if (editingSoal) {
        await soalApi.update(editingSoal.id, payload);
      } else {
        await soalApi.create(payload);
      }

      setEditingSoal(null);
      setSPertanyaan('');
      setSOpsiA('');
      setSOpsiB('');
      setSOpsiC('');
      setSOpsiD('');
      setSGambarFile(null);
      setSGambarPreview(null);
      setShowSoalModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving soal:', err);
      alert('Terjadi kesalahan saat menyimpan soal: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSavingSoal(false);
    }
  };

  const handleDeleteSoal = async (id: string, name: string = 'soal ini') => {
    if (!confirm(`Hapus soal "${name}"?`)) return;
    
    try {
      await soalApi.destroy(id);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting soal:', err);
      alert('Terjadi kesalahan saat menghapus soal.');
    }
  };

  // ── Kelas binaan: group jadwal milik instruktur per (angkatan + tempat) ──
  const myKelasList: KelasBinaan[] = useMemo(() => {
    const map = new Map<string, KelasBinaan>();
    for (const j of jadwalList) {
      if (!j.angkatan_id) continue;
      const venue = (j.tempat_pelatihan || '').trim() || 'Tempat tidak ditentukan';
      const key = `${j.angkatan_id}:::${venue}`;
      if (!map.has(key)) {
        const ang = angkatanList.find((a) => a.id === j.angkatan_id);
        map.set(key, {
          key,
          angkatanId: j.angkatan_id,
          angkatanNama: ang?.nama_angkatan || j.angkatan?.nama_angkatan || 'Angkatan',
          kodeAngkatan: ang?.kode_angkatan || j.angkatan?.kode_angkatan || '',
          programId: ang?.program_id || j.angkatan?.program_id,
          programNama: ang?.program?.nama || j.angkatan?.program?.nama || j.jenis_pelatihan,
          tempat: venue,
          jadwal: [],
          pesertaIds: [],
        });
      }
      const item = map.get(key)!;
      item.jadwal.push(j);
      const ids = (j.peserta || []).map((p) => (typeof p === 'string' ? p : p.id));
      for (const pid of ids) {
        if (!item.pesertaIds.includes(pid)) item.pesertaIds.push(pid);
      }
    }
    return Array.from(map.values());
  }, [jadwalList, angkatanList]);

  // Default pilihan kelas = kelas pertama
  useEffect(() => {
    if (!selectedKelasKey && myKelasList.length > 0) {
      setSelectedKelasKey(myKelasList[0].key);
    }
  }, [myKelasList, selectedKelasKey]);

  const selectedKelas = myKelasList.find((k) => k.key === selectedKelasKey) || myKelasList[0] || null;

  // Peta plotting SELURUH jadwal per angkatan (milik instruktur mana pun).
  // Dipakai fallback agar tidak menampilkan peserta yang sebenarnya sudah
  // ditempatkan di kelas/sesi lain dalam angkatan yang sama.
  const angkatanPlotted = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const j of allJadwalList) {
      if (!j.angkatan_id) continue;
      let set = map.get(j.angkatan_id);
      if (!set) {
        set = new Set<string>();
        map.set(j.angkatan_id, set);
      }
      for (const p of j.peserta || []) {
        set.add(typeof p === 'string' ? p : p.id);
      }
    }
    return map;
  }, [allJadwalList]);

  // ── Peserta yang diajar: pivot jadwal milik instruktur dulu, fallback angkatan+tempat ──
  const pesertaBinaan: Pendaftar[] = useMemo(() => {
    if (!jadwalFiltered) {
      return pendaftarList.filter(
        (p) => selectedProgramFilter === 'Semua' || p.jenis_pelatihan === selectedProgramFilter
      );
    }
    const pivotIds = new Set<string>();
    for (const k of myKelasList) for (const pid of k.pesertaIds) pivotIds.add(pid);

    const inAngkatanTempat = (p: Pendaftar, kelas: KelasBinaan) => {
      if (p.angkatan_id !== kelas.angkatanId) return false;
      const pv = (p.tempat_pelatihan || '').trim();
      if (!pv) return true; // tempat peserta kosong → ikut angkatannya
      return pv.toLowerCase() === kelas.tempat.toLowerCase() || kelas.tempat.toLowerCase().includes(pv.toLowerCase()) || pv.toLowerCase().includes(kelas.tempat.toLowerCase());
    };

    const scope: KelasBinaan[] = selectedKelas ? [selectedKelas] : myKelasList;
    if (pivotIds.size > 0) {
      const allowed = new Set<string>();
      for (const k of scope) for (const pid of k.pesertaIds) allowed.add(pid);
      if (allowed.size === 0) {
        // Kelas terpilih pivot-nya kosong padahal plotting sudah dipakai
        // (kelas lain punya pivot): artinya seluruh peserta kelas ini memang
        // dikeluarkan — tampilkan kosong, JANGAN fallback ke angkatan+tempat
        // yang akan memunculkan lagi peserta yang baru dikeluarkan.
        return [];
      }
      return pendaftarList.filter((p) => allowed.has(p.id));
    }
    // Belum ada plotting sama sekali di kelas sendiri → fallback ke anggota
    // angkatan+tempat, TAPI kecualikan peserta yang sudah di-plot di sesi
    // mana pun dalam angkatan yang sama (milik instruktur lain) — mereka
    // sudah bertuan di kelas lain, bukan kandidat kelas ini.
    return pendaftarList.filter(
      (p) =>
        scope.some((k) => inAngkatanTempat(p, k)) &&
        !(p.angkatan_id && angkatanPlotted.get(p.angkatan_id)?.has(p.id)),
    );
  }, [pendaftarList, myKelasList, selectedKelas, selectedKelasKey, jadwalFiltered, selectedProgramFilter, angkatanPlotted, allJadwalList]);

  const filteredPendaftar = pesertaBinaan;

  // Early return ditaruh SETELAH semua hooks agar urutan hooks stabil
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarMenu = [
    {
      sectionTitle: 'UTAMA',
      items: [
        {
          id: 'jadwal' as InstrukturTab,
          label: 'Jadwal & Kalender',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ),
          badge: jadwalList.length,
          badgeColor: 'bg-blue-100 text-blue-700',
        },
      ],
    },
    {
      sectionTitle: 'KELAS & SISWA',
      items: [
        {
          id: 'peserta' as InstrukturTab,
          label: 'Data Peserta Binaan',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
          badge: pesertaBinaan.length,
          badgeColor: 'bg-green-100 text-green-700',
        },
        {
          id: 'penilaian' as InstrukturTab,
          label: 'Penilaian Peserta',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          ),
          badge: null,
          badgeColor: 'bg-slate-200 text-slate-700',
        },
        {
          id: 'histori_ujian' as InstrukturTab,
          label: 'Histori Ujian',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
          badge: null,
          badgeColor: 'bg-amber-100 text-amber-700',
        },
      ],
    },
    {
      sectionTitle: 'AKUN SAYA',
      items: [
        {
          id: 'profil' as InstrukturTab,
          label: 'Profil Saya',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0116 0v1" />
            </svg>
          ),
          badge: null,
          badgeColor: 'bg-slate-200 text-slate-700',
        },
      ],
    },
    {
      sectionTitle: 'MATERI & DOKUMEN',
      items: [
        {
          id: 'materi' as InstrukturTab,
          label: 'Upload Materi',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          ),
          badge: null,
          badgeColor: 'bg-purple-100 text-purple-700',
        },
        {
          id: 'soal_ujian' as InstrukturTab,
          label: 'Soal Ujian',
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ),
          badge: soalList.length,
          badgeColor: 'bg-indigo-100 text-indigo-700',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col lg:flex-row">
      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <button 
          type="button" 
          aria-label="Tutup menu" 
          className="admin-sidebar-backdrop lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Left Sidebar - Similar to Admin */}
      <aside className={`admin-sidebar w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm overflow-y-auto ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="space-y-4">
          {/* Brand Header inside Sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md">
                INS
              </div>
              <div>
                <div className="font-bold text-sm text-slate-800 leading-tight">Portal Instruktur</div>
                <div className="text-[10px] text-slate-500 font-medium">Pengajar Profesional</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 lg:hidden"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Navigation Menu */}
          {sidebarMenu.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 mt-3">
                <span>{group.sectionTitle}</span>
                <span className="text-slate-300 font-normal">+</span>
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                >
                  <div className="icon-box">{item.icon}</div>
                  <span className="flex-1 text-xs">{item.label}</span>
                  {item.badge !== null && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Sidebar Bottom Action */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="sidebar-link text-red-500 hover:text-red-700"
          >
            <div className="icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="text-xs">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace Area */}
      <div className="flex-1 lg:ml-0 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>Instruktur Aktif</span>
            </div>
          </div>
        </header>

        {/* Content Body according to Active Tab */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* Header Card */}
          <div className="card p-6 md:p-8 border-l-4 border-l-blue-600">
            <div className="badge badge-active mb-2 bg-blue-50 text-blue-700 border-blue-200">
              Portal Instruktur / Pengajar
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Dashboard Instruktur
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelola jadwal mengajar, peserta binaan, penilaian, serta materi pelatihan LPK.
            </p>
          </div>

          {/* TAB CONTENTS */}
          <div className="pt-2">
            {/* TAB 1: JADWAL */}
            {activeTab === 'jadwal' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Jadwal Mengajar Saya</h3>
                    {jadwalFiltered && myInstruktur && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Menampilkan sesi dengan pengajar <span className="font-bold text-slate-700">{myInstruktur.nama}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs text-slate-500">
                      {jadwalList.length} sesi mengajar ditemukan
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setJadwalViewMode('calendar')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${jadwalViewMode === 'calendar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Tampilan Kalender
                      </button>
                      <button
                        onClick={() => setJadwalViewMode('table')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${jadwalViewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Tampilan Tabel
                      </button>
                    </div>
                  </div>
                </div>
                {jadwalFiltered && jadwalList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-xl bg-white">
                    Belum ada sesi jadwal atas nama <b>{myInstruktur?.nama}</b>. Hubungi admin untuk penjadwalan.
                  </div>
                ) : jadwalViewMode === 'calendar' ? (
                  <CalendarView schedules={jadwalList} />
                ) : (
                  <JadwalTable
                    schedules={jadwalList}
                    variant="instruktur"
                    emptyText={`Belum ada sesi jadwal atas nama ${myInstruktur?.nama || 'Anda'}. Hubungi admin untuk penjadwalan.`}
                  />
                )}
              </div>
            )}

            {/* TAB 2: DATA PESERTA BINAAN (hanya kelas yang diajar) */}
            {activeTab === 'peserta' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Daftar Peserta Binaan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hanya peserta pada kelas (angkatan + tempat) yang Anda ajar
                      {jadwalFiltered && myInstruktur ? ` — ${myInstruktur.nama}` : ''}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Kelas:</label>
                    <select
                      value={selectedKelasKey}
                      onChange={(e) => setSelectedKelasKey(e.target.value)}
                      className="form-input text-xs w-auto"
                    >
                      {myKelasList.length === 0 && <option value="">— Belum ada kelas —</option>}
                      {myKelasList.map((k) => (
                        <option key={k.key} value={k.key}>
                          {k.angkatanNama} • {k.tempat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedKelas && (
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-600 flex flex-wrap gap-x-5 gap-y-1">
                    <span><b className="text-slate-800">{selectedKelas.angkatanNama}</b>{selectedKelas.kodeAngkatan ? ` (${selectedKelas.kodeAngkatan})` : ''}</span>
                    <span>Program: <b className="text-slate-800">{selectedKelas.programNama}</b></span>
                    <span>Tempat: <b className="text-slate-800">{selectedKelas.tempat}</b></span>
                    <span>Sesi: <b className="text-slate-800">{selectedKelas.jadwal.length}</b></span>
                  </div>
                )}

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>No. Pendaftaran</th>
                        <th>Nama Peserta</th>
                        <th>Program Pelatihan</th>
                        <th>Angkatan</th>
                        <th>Kontak Peserta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendaftar.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                            Tidak ada peserta pada kelas ini.
                          </td>
                        </tr>
                      ) : (
                        filteredPendaftar.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                                {p.no_pendaftaran}
                              </span>
                            </td>
                            <td className="font-bold text-slate-800 text-xs">{p.nama_lengkap}</td>
                            <td className="text-xs font-semibold text-slate-700">{p.jenis_pelatihan}</td>
                            <td className="text-xs text-slate-600">{p.angkatan?.nama_angkatan || angkatanList.find((a) => a.id === p.angkatan_id)?.nama_angkatan || '-'}</td>
                            <td className="whitespace-nowrap">
                              <div className="text-xs font-mono font-bold text-slate-800">{p.no_hp}</div>
                              <div className="text-[11px] text-slate-500">{p.email}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PENILAIAN PESERTA BINAAN */}
            {activeTab === 'penilaian' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Penilaian Peserta Binaan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Nilai tersimpan ke rekap yang sama dengan admin.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Kelas:</label>
                    <select
                      value={selectedKelasKey}
                      onChange={(e) => setSelectedKelasKey(e.target.value)}
                      className="form-input text-xs w-auto"
                    >
                      {myKelasList.length === 0 && <option value="">— Belum ada kelas —</option>}
                      {myKelasList.map((k) => (
                        <option key={k.key} value={k.key}>
                          {k.angkatanNama} • {k.tempat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedKelas ? (
                  <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-xl bg-white">
                    Belum ada kelas binaan. Hubungi admin untuk penjadwalan.
                  </div>
                ) : (
                  <PenilaianPanel
                    key={selectedKelas.key}
                    angkatanId={selectedKelas.angkatanId}
                    programId={selectedKelas.programId}
                    pesertaList={pesertaBinaan}
                    title={`Penilaian — ${selectedKelas.angkatanNama}`}
                    subtitle={`${selectedKelas.programNama} • ${selectedKelas.tempat}. Nilai Ujian Akhir (Posttest) terisi otomatis dari hasil ujian online peserta.`}
                  />
                )}
              </div>
            )}

            {/* TAB 4: HISTORI UJIAN PESERTA BINAAN (CROSCHEK JAWABAN) */}
            {activeTab === 'histori_ujian' && (
              <div className="space-y-4 animate-fade-in">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-base">Histori Pengerjaan Pretest & Posttest</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih peserta binaan untuk melihat seluruh percobaan ujian beserta rincian jawaban per soal
                    (jawaban peserta vs kunci) — untuk croschek ulang kesesuaian nilai.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">Peserta Binaan:</label>
                  <select
                    value={historiPesertaId}
                    onChange={(e) => setHistoriPesertaId(e.target.value)}
                    className="form-input text-xs w-full sm:w-auto sm:min-w-80"
                  >
                    <option value="">— Pilih peserta —</option>
                    {filteredPendaftar.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_lengkap} • {p.no_pendaftaran}
                      </option>
                    ))}
                  </select>
                </div>

                {!historiPesertaId ? (
                  <div className="text-center py-12 text-slate-400 text-xs border border-dashed rounded-xl bg-white">
                    Pilih peserta binaan untuk menampilkan histori pengerjaannya.
                  </div>
                ) : (
                  (() => {
                    const hp = filteredPendaftar.find((p) => p.id === historiPesertaId)
                      || pendaftarList.find((p) => p.id === historiPesertaId);
                    return (
                      <div className="rounded-xl bg-white border border-slate-200 p-4">
                        <RiwayatUjianPanel
                          key={historiPesertaId}
                          pendaftarId={historiPesertaId}
                          pendaftarNama={hp ? `${hp.nama_lengkap} (${hp.no_pendaftaran})` : undefined}
                        />
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* TAB 4: PROFIL SAYA */}
            {activeTab === 'profil' && (
              <div className="space-y-4 animate-fade-in max-w-2xl">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                        {(myInstruktur?.nama || myUser?.username || 'IN').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{myInstruktur?.nama || myUser?.username || 'Instruktur'}</h3>
                        <p className="text-xs text-slate-500">
                          {myInstruktur?.keahlian || 'Pengajar'} • Akun: <span className="font-mono font-bold text-indigo-700">{myUser?.username || '-'}</span>
                        </p>
                      </div>
                    </div>
                    {!editingProfil && myInstruktur && (
                      <button onClick={() => setEditingProfil(true)} className="btn btn-outline btn-sm text-xs">
                        Edit Profil
                      </button>
                    )}
                  </div>

                  {profilMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${profilMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                      {profilMsg.text}
                    </div>
                  )}

                  {!editingProfil ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-400">Nama Lengkap</div>
                        <div className="font-bold text-slate-800 mt-0.5">{myInstruktur?.nama || '-'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-400">Keahlian</div>
                        <div className="font-bold text-slate-800 mt-0.5">{myInstruktur?.keahlian || '-'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-400">No. HP</div>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">{myInstruktur?.no_hp || '-'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-400">Email</div>
                        <div className="font-bold text-slate-800 mt-0.5 break-all">{myInstruktur?.email || myUser?.email || '-'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-400">Status</div>
                        <div className="font-bold text-slate-800 mt-0.5">{myInstruktur?.status || '-'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[11px] text-slate-400">Kelas Binaan</div>
                        <div className="font-bold text-slate-800 mt-0.5">{myKelasList.length} kelas • {jadwalList.length} sesi</div>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!myInstruktur || !pNama.trim()) return;
                        setSavingProfil(true);
                        setProfilMsg(null);
                        try {
                          const res = await instrukturApi.update(myInstruktur.id, {
                            nama: pNama.trim(),
                            no_hp: pNoHp.trim() || undefined,
                            email: pEmail.trim() || undefined,
                            keahlian: pKeahlian.trim() || undefined,
                          });
                          if (res.success && res.data) {
                            setMyInstruktur(res.data);
                            setEditingProfil(false);
                            setProfilMsg({ type: 'ok', text: 'Profil berhasil diperbarui.' });
                          } else {
                            setProfilMsg({ type: 'err', text: res.error || 'Gagal memperbarui profil.' });
                          }
                        } catch (err: any) {
                          setProfilMsg({ type: 'err', text: err?.message || 'Gagal memperbarui profil.' });
                        } finally {
                          setSavingProfil(false);
                        }
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div>
                        <label className="form-label">Nama Lengkap *</label>
                        <input type="text" className="form-input" value={pNama} onChange={(e) => setPNama(e.target.value)} required />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">No. HP</label>
                          <input type="text" className="form-input" value={pNoHp} onChange={(e) => setPNoHp(e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Email</label>
                          <input type="email" className="form-input" value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">Keahlian / Spesialisasi</label>
                        <input type="text" className="form-input" value={pKeahlian} onChange={(e) => setPKeahlian(e.target.value)} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={savingProfil} onClick={() => setEditingProfil(false)} className="btn btn-outline btn-sm">
                          Batal
                        </button>
                        <button type="submit" disabled={savingProfil} className="btn btn-primary btn-sm font-bold">
                          {savingProfil ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ganti Password</h4>
                    <p className="text-xs text-slate-500">Gunakan password baru minimal 6 karakter.</p>
                  </div>
                  {pwMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${pwMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                      {pwMsg.text}
                    </div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (pwBaru.length < 6) {
                        setPwMsg({ type: 'err', text: 'Password baru minimal 6 karakter.' });
                        return;
                      }
                      if (pwBaru !== pwKonfirmasi) {
                        setPwMsg({ type: 'err', text: 'Konfirmasi password tidak sama.' });
                        return;
                      }
                      setSavingPw(true);
                      setPwMsg(null);
                      try {
                        const res = await authApi.changePassword({
                          password_lama: pwLama,
                          password_baru: pwBaru,
                          password_baru_confirmation: pwKonfirmasi,
                        });
                        if (res.success) {
                          setPwLama('');
                          setPwBaru('');
                          setPwKonfirmasi('');
                          setPwMsg({ type: 'ok', text: 'Password berhasil diubah.' });
                        } else {
                          setPwMsg({ type: 'err', text: res.error || 'Gagal mengubah password.' });
                        }
                      } catch (err: any) {
                        setPwMsg({ type: 'err', text: err?.message || 'Gagal mengubah password.' });
                      } finally {
                        setSavingPw(false);
                      }
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="form-label">Password Lama *</label>
                      <input type="password" className="form-input" value={pwLama} onChange={(e) => setPwLama(e.target.value)} required autoComplete="current-password" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Password Baru *</label>
                        <input type="password" className="form-input" value={pwBaru} onChange={(e) => setPwBaru(e.target.value)} required autoComplete="new-password" />
                      </div>
                      <div>
                        <label className="form-label">Konfirmasi Password Baru *</label>
                        <input type="password" className="form-input" value={pwKonfirmasi} onChange={(e) => setPwKonfirmasi(e.target.value)} required autoComplete="new-password" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" disabled={savingPw} className="btn btn-primary btn-sm font-bold">
                        {savingPw ? 'Menyimpan...' : 'Ubah Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: UPLOAD MATERI */}
            {activeTab === 'materi' && (
              <div className="space-y-6 max-w-xl animate-fade-in">
                <div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">Unggah Modul & Materi Pembelajaran</h3>
                  <p className="text-xs text-slate-500">Materi yang diunggah akan otomatis tampil di dashboard peserta</p>
                </div>

                {materiSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold">
                    Modul pembelajaran berhasil diunggah dan dipublikasikan!
                  </div>
                )}

                <form onSubmit={handleUploadMateri} className="space-y-4 text-xs">
                  <div>
                    <label className="form-label">Program Pelatihan Target</label>
                    <select
                      value={materiProgram}
                      onChange={(e) => setMateriProgram(e.target.value)}
                      className="form-input"
                    >
                      {programList.map((p) => (
                        <option key={p.id} value={p.nama}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Judul Modul / Materi Pembelajaran</label>
                    <input
                      type="text"
                      placeholder="Misal: Modul 01 - Dasar Keselamatan Kerja & K3 Industri"
                      value={materiJudul}
                      onChange={(e) => setMateriJudul(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Upload File Dokumentasi / PDF / Slide (Demo)</label>
                    <input type="file" className="form-input bg-white cursor-pointer" />
                  </div>

                  <button type="submit" className="btn btn-primary btn-md bg-blue-600 hover:bg-blue-700 text-white font-bold w-full">
                    Unggah Modul Pelatihan
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: SOAL UJIAN */}
            {activeTab === 'soal_ujian' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Kelola Soal Ujian</h3>
                    <p className="text-xs text-slate-500">Kelola bank soal untuk pretest & posttest peserta</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      className="form-input text-xs py-1.5 px-3 w-auto"
                      value={filterSoalTipe}
                      onChange={(e) => setFilterSoalTipe(e.target.value as any)}
                    >
                      <option value="semua">Semua Tipe</option>
                      <option value="pretest">Pretest</option>
                      <option value="posttest">Posttest</option>
                    </select>
                    <select
                      className="form-input text-xs py-1.5 px-3 w-auto"
                      value={filterSoalStatus}
                      onChange={(e) => setFilterSoalStatus(e.target.value as any)}
                    >
                      <option value="semua">Semua Status</option>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                    <button onClick={handleOpenAddSoal} className="btn btn-primary btn-sm flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Tambah Soal
                    </button>
                  </div>
                </div>

                {/* Filtered Soal List */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">#</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pertanyaan</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Tipe</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Program</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Jawaban Benar</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {soalList
                        .filter((s) => {
                          if (filterSoalTipe !== 'semua' && s.tipe !== filterSoalTipe) return false;
                          const aktif = s.is_active ?? true;
                          if (filterSoalStatus === 'aktif' && !aktif) return false;
                          if (filterSoalStatus === 'nonaktif' && aktif) return false;
                          return true;
                        })
                        .slice((soalPage - 1) * 10, soalPage * 10)
                        .map((soal, idx) => {
                          const soalAktif = soal.is_active ?? true;
                          return (
                          <tr key={soal.id} className={`hover:bg-slate-50/60 transition-colors ${!soalAktif ? 'opacity-70' : ''}`}>
                            <td className="px-4 py-3 font-mono text-slate-400">{(soalPage - 1) * 10 + idx + 1}</td>
                            <td className="px-4 py-3 max-w-[300px]">
                              <div className="font-bold text-slate-800 text-xs line-clamp-2">{soal.pertanyaan}</div>
                              {soal.gambar_soal && (
                                <div className="text-[10px] text-blue-600 mt-1">📷 Ada gambar</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                soal.tipe === 'pretest'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {soal.tipe === 'pretest' ? 'Pretest' : 'Posttest'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleSoalStatus(soal)}
                                title={soalAktif ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                                  soalAktif
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-300'
                                }`}
                              >
                                {soalAktif ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-700 text-xs">
                              {soal.jenis_pelatihan}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {String.fromCharCode(65 + soal.jawaban_benar)} {/* A, B, C, D */}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditSoal(soal)}
                                  className="btn btn-outline btn-sm text-[10px] py-1 px-2 flex items-center gap-1"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSoal(soal.id, soal.pertanyaan.substring(0, 30) + '...')}
                                  className="btn btn-danger btn-sm text-[10px] py-1 px-2 flex items-center gap-1"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/>
                                    <path d="M10 11v6"/>
                                    <path d="M14 11v6"/>
                                  </svg>
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  
                  {soalList.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p className="font-semibold">Belum ada soal ujian</p>
                      <p className="text-xs mt-1">Tambahkan soal untuk pretest & posttest</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        Menampilkan {Math.min((soalPage - 1) * 10 + 1, soalList.length)}-{Math.min(soalPage * 10, soalList.length)} dari {soalList.length} soal
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSoalPage(prev => Math.max(1, prev - 1))}
                          disabled={soalPage === 1}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSoalPage(prev => prev + 1)}
                          disabled={soalPage * 10 >= soalList.length}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Tambah / Edit Soal Ujian */}
      {showSoalModal && (
        <div className="modal-overlay" onClick={() => { if (!isSavingSoal) setShowSoalModal(false); }}>
          <div className="modal-content relative max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isSavingSoal && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
              </div>
            )}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">
                {editingSoal ? 'Edit Soal Ujian' : 'Tambah Soal Ujian Baru'}
              </h3>
              <button
                type="button"
                disabled={isSavingSoal}
                onClick={() => setShowSoalModal(false)}
                className="text-slate-400 hover:text-black disabled:opacity-40"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSoal} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Tipe Ujian</label>
                  <select className="form-input" value={sTipe} onChange={(e) => setSTipe(e.target.value as any)}>
                    <option value="pretest">Pretest</option>
                    <option value="posttest">Posttest</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Program Pelatihan</label>
                  <select className="form-input" value={sJenisPelatihan} onChange={(e) => setSJenisPelatihan(e.target.value)}>
                    <option value="Semua">Semua Program (Umum)</option>
                    {programList.map((p) => (
                      <option key={p.id} value={p.nama}>{p.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Pertanyaan Soal</label>
                <textarea 
                  className="form-input min-h-[70px]" 
                  placeholder="Tuliskan pertanyaan soal..." 
                  value={sPertanyaan} 
                  onChange={(e) => setSPertanyaan(e.target.value)} 
                  required 
                />
              </div>

              {/* Image Upload for Soal */}
              <div>
                <label className="form-label">Gambar Soal <span className="text-slate-500 font-normal">(opsional)</span></label>
                <div
                  className="mt-1 relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSGambarFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setSGambarPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {sGambarPreview ? (
                    <div className="space-y-2 pointer-events-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sGambarPreview} alt="Preview Gambar Soal" className="max-h-36 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain" />
                      <p className="text-xs text-blue-600 font-semibold">Klik untuk ganti gambar</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none">
                      <svg className="w-8 h-8 mx-auto text-slate-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-semibold text-slate-700">Klik untuk upload gambar soal</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, JPEG (Maks. 5 MB)</p>
                    </div>
                  )}
                </div>
                {sGambarPreview && (
                  <button
                    type="button"
                    onClick={() => { setSGambarFile(null); setSGambarPreview(null); }}
                    className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Hapus gambar
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="form-label">Pilihan Jawaban (A - D)</label>
                <input type="text" className="form-input text-xs" placeholder="Opsi A" value={sOpsiA} onChange={(e) => setSOpsiA(e.target.value)} required />
                <input type="text" className="form-input text-xs" placeholder="Opsi B" value={sOpsiB} onChange={(e) => setSOpsiB(e.target.value)} required />
                <input type="text" className="form-input text-xs" placeholder="Opsi C" value={sOpsiC} onChange={(e) => setSOpsiC(e.target.value)} required />
                <input type="text" className="form-input text-xs" placeholder="Opsi D" value={sOpsiD} onChange={(e) => setSOpsiD(e.target.value)} required />
              </div>

              <div>
                <label className="form-label">Jawaban Benar</label>
                <select className="form-input" value={sJawabanBenar} onChange={(e) => setSJawabanBenar(Number(e.target.value))}>
                  <option value={0}>A - {sOpsiA || 'Opsi A'}</option>
                  <option value={1}>B - {sOpsiB || 'Opsi B'}</option>
                  <option value={2}>C - {sOpsiC || 'Opsi C'}</option>
                  <option value={3}>D - {sOpsiD || 'Opsi D'}</option>
                </select>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">Status Soal</div>
                  <div className="text-[11px] text-slate-500">
                    {sIsActive ? 'Aktif — soal muncul pada ujian peserta.' : 'Nonaktif — soal disembunyikan dari ujian peserta.'}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sIsActive}
                  onClick={() => setSIsActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${sIsActive ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${sIsActive ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={isSavingSoal}
                  onClick={() => setShowSoalModal(false)}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSoal}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSavingSoal && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isSavingSoal
                    ? (editingSoal ? 'Memperbarui...' : 'Menyimpan...')
                    : (editingSoal ? 'Simpan Perubahan Soal' : 'Simpan Soal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}