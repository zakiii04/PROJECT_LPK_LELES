'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import AdminPendaftarTable from '@/Components/AdminPendaftarTable';
import AdminPendaftarDetail from '@/Components/AdminPendaftarDetail';
import AngkatanManager from '@/Components/AngkatanManager';
import PelatihanManager from '@/Components/PelatihanManager';
import TempatManager from '@/Components/TempatManager';
import CalendarView from '@/Components/CalendarView';
import GraduationManager from '@/Components/GraduationManager';
import JadwalManager from '@/Components/JadwalManager';
import PaymentMethodManager from '@/Components/PaymentMethodManager';
import {
  type Pendaftar,
  type Cicilan,
  type JadwalPelatihan,
  type SoalUjian,
  type Program,
  type Angkatan,
  JENIS_PELATIHAN,
} from '@/lib/storage';
import {
  pendaftarApi,
  jadwalApi,
  soalApi,
  cicilanApi,
  pembayaranApi,
  programApi,
  angkatanApi,
} from '@/lib/api';
import { getToken } from '@/lib/axios';

type AdminTab =
  | 'overview'
  | 'validasi_peserta'
  | 'semua_peserta'
  | 'validasi_pembayaran'
  | 'kelola_pelatihan'
  | 'kelola_angkatan'
  | 'kelola_tempat'
  | 'kelola_jadwal'
  | 'kelola_metode_pembayaran'
  | 'kelola_ujian'
  | 'kelola_kelulusan';

type FilterStatus = 'semua' | 'menunggu' | 'diterima' | 'ditolak';

import ManualRegisterModal from '@/Components/ManualRegisterModal';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPendaftar, setSelectedPendaftar] = useState<Pendaftar | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'pendaftar' | 'jadwal' | 'soal' } | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'semua' | 'belum_bayar' | 'menunggu_konfirmasi' | 'lunas' | 'cicilan_sebagian'>('semua');
  const [dateFilter, setDateFilter] = useState<'semua' | '7' | '30' | '90' | 'custom'>('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [angkatanFilter, setAngkatanFilter] = useState<string>('semua');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showFilterPopover) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsidePopover = filterPopoverRef.current?.contains(target);
      const clickedInsideButton = filterButtonRef.current?.contains(target);

      if (!clickedInsidePopover && !clickedInsideButton) {
        setShowFilterPopover(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showFilterPopover]);

  const resetParticipantFilter = () => {
    setPaymentFilter('semua');
    setDateFilter('semua');
    setStartDate('');
    setEndDate('');
    setAngkatanFilter('semua');
    setShowFilterPopover(false);
  };

  // State Filter Pembayaran
  const [filterPaymentType, setFilterPaymentType] = useState<'semua' | 'lunas' | 'cicilan'>('semua');

  // State Jadwal
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>([]);
  const [adminJadwalViewMode, setAdminJadwalViewMode] = useState<'list' | 'calendar'>('calendar');
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalPelatihan | null>(null);
  const [selectedJadwalForPlotting, setSelectedJadwalForPlotting] = useState<JadwalPelatihan | null>(null);
  const [selectedJadwalDetail, setSelectedJadwalDetail] = useState<JadwalPelatihan | null>(null);
  const [searchPesertaJadwal, setSearchPesertaJadwal] = useState('');
  const [jJudul, setJJudul] = useState('');
  const [jJenisPelatihan, setJJenisPelatihan] = useState('Semua');
  const [jAngkatanId, setJAngkatanId] = useState('');
  const [jHariKe, setJHariKe] = useState<number>(1);
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [filterAngkatanJadwal, setFilterAngkatanJadwal] = useState<string>('semua');
  const [jTanggal, setJTanggal] = useState('');
  const [jJam, setJJam] = useState('');
  const [jRuangan, setJRuangan] = useState('');
  const [jTempatPelatihan, setJTempatPelatihan] = useState('Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)');
  const [jPengajar, setJPengajar] = useState('Hj. Siti Rahmah, S.Ds');
  const [jJenisSesi, setJJenisSesi] = useState<'Orientasi' | 'Teori' | 'Praktik' | 'Ujian'>('Teori');
  const [jStatus, setJStatus] = useState<'Wajib' | 'Reguler' | 'Evaluasi'>('Reguler');

  // State Soal Ujian
  const [soalList, setSoalList] = useState<SoalUjian[]>([]);
  const [showAddSoalModal, setShowAddSoalModal] = useState(false);
  const [editingSoal, setEditingSoal] = useState<SoalUjian | null>(null);
  const [sJenisPelatihan, setSJenisPelatihan] = useState('Semua');
  const [sTipe, setSTipe] = useState<'pretest' | 'posttest'>('pretest');
  const [sPertanyaan, setSPertanyaan] = useState('');
  const [sOpsiA, setSOpsiA] = useState('');
  const [sOpsiB, setSOpsiB] = useState('');
  const [sOpsiC, setSOpsiC] = useState('');
  const [sOpsiD, setSOpsiD] = useState('');
  const [sJawabanBenar, setSJawabanBenar] = useState(0);

  const [filterSoalTipe, setFilterSoalTipe] = useState<'semua' | 'pretest' | 'posttest'>('semua');

  const handleDeletePendaftar = (id: string, nama: string) => {
    setDeleteTarget({ id, name: nama, type: 'pendaftar' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'pendaftar') {
        await pendaftarApi.destroy(deleteTarget.id);
      } else if (deleteTarget.type === 'jadwal') {
        await jadwalApi.destroy(deleteTarget.id);
      } else if (deleteTarget.type === 'soal') {
        await soalApi.destroy(deleteTarget.id);
      }

      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

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
    setShowAddSoalModal(true);
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
    setShowAddSoalModal(true);
  };

  // Handler Submit Soal (Tambah / Edit)
  const handleSaveSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sPertanyaan || !sOpsiA || !sOpsiB || !sOpsiC || !sOpsiD) return;

    if (editingSoal) {
      await soalApi.update(editingSoal.id, {
        jenis_pelatihan: sJenisPelatihan,
        tipe: sTipe as any,
        pertanyaan: sPertanyaan,
        opsi: [sOpsiA, sOpsiB, sOpsiC, sOpsiD],
        jawaban_benar: Number(sJawabanBenar),
      });
    } else {
      await soalApi.create({
        jenis_pelatihan: sJenisPelatihan,
        tipe: sTipe as any,
        pertanyaan: sPertanyaan,
        opsi: [sOpsiA, sOpsiB, sOpsiC, sOpsiD],
        jawaban_benar: Number(sJawabanBenar),
      });
    }

    setEditingSoal(null);
    setSPertanyaan('');
    setSOpsiA('');
    setSOpsiB('');
    setSOpsiC('');
    setSOpsiD('');
    setShowAddSoalModal(false);
    loadData();
  };

  const [programList, setProgramList] = useState<Program[]>([]);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      sessionStorage.removeItem('lpk_admin_logged_in');
      router.visit('/admin');
      return;
    }

    try {
      const pendaftarRes = await pendaftarApi.list();
      if (pendaftarRes.success && pendaftarRes.data?.data) {
        const pendaftar = pendaftarRes.data.data;
        pendaftar.sort((a: Pendaftar, b: Pendaftar) => new Date(b.tanggal_daftar).getTime() - new Date(a.tanggal_daftar).getTime());
        setPendaftarList(pendaftar);
      }

      const jadwalRes = await jadwalApi.list();
      if (jadwalRes.success && jadwalRes.data) {
        setJadwalList(jadwalRes.data);
      }

      const soalRes = await soalApi.list();
      if (soalRes.success && soalRes.data) {
        setSoalList(soalRes.data);
      }

      const prgRes = await programApi.list();
      if (prgRes.success && prgRes.data) {
        setProgramList(prgRes.data);
      }

      const angkRes = await angkatanApi.list();
      if (angkRes.success && angkRes.data) {
        setAngkatanList(angkRes.data);
      }
    } catch (error) {
      console.error('[Admin Dashboard loadData error]:', error);
      sessionStorage.removeItem('lpk_admin_logged_in');
      router.visit('/admin');
    }
  }, [router]);

  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // 1. Tandai bahwa komponen sudah terpasang di browser
    setIsMounted(true);

    const loggedIn = sessionStorage.getItem('lpk_admin_logged_in');
    if (loggedIn !== 'true') {
      router.visit('/admin');
      return;
    }
    setIsAuthed(true);
    loadData();

    // 2. Baca token dari localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('lpk_auth_token');

    // 3. Ambil data dari Backend
    if (token) {
      fetch('/api/v1/dashboard/summary', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data) {
            setDashboardData(resData.data);
          }
        })
        .catch(err => console.error('[Dashboard API Summary Error]:', err));
    }
  }, [router, loadData]);

  if (!isMounted) {
    return null;
  }

  const handleStatusChange = () => {
    loadData();
    setSelectedPendaftar(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lpk_admin_logged_in');
    router.visit('/admin');
  };

  const handleOpenEditJadwal = (jadwal: JadwalPelatihan) => {
    setEditingJadwal(jadwal);
    setJJudul(jadwal.judul);
    setJJenisPelatihan(jadwal.jenis_pelatihan);
    setJTanggal(jadwal.tanggal);
    setJJam(jadwal.jam);
    setJRuangan(jadwal.ruangan);
    setJTempatPelatihan(jadwal.tempat_pelatihan || 'Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)');
    setJPengajar(jadwal.pengajar || 'Hj. Siti Rahmah, S.Ds');
    setJJenisSesi(jadwal.jenis_sesi as 'Orientasi' | 'Teori' | 'Praktik' | 'Ujian');
    setJStatus((jadwal.status || 'Reguler') as 'Wajib' | 'Reguler' | 'Evaluasi');
    setShowAddJadwalModal(true);
  };

  // Handler Submit / Edit Jadwal
  const handleSaveJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jJudul || !jTanggal || !jJam || !jRuangan) return;

    if (editingJadwal) {
      await jadwalApi.update(editingJadwal.id, {
        judul: jJudul,
        jenis_pelatihan: jJenisPelatihan,
        tanggal: jTanggal,
        jam: jJam,
        ruangan: jRuangan,
        tempat_pelatihan: jTempatPelatihan,
        pengajar: jPengajar,
        jenis_sesi: jJenisSesi,
        status: jStatus,
      });
    } else {
      await jadwalApi.create({
        judul: jJudul,
        jenis_pelatihan: jJenisPelatihan,
        tanggal: jTanggal,
        jam: jJam,
        ruangan: jRuangan,
        tempat_pelatihan: jTempatPelatihan,
        pengajar: jPengajar,
        jenis_sesi: jJenisSesi,
        status: jStatus,
      });
    }

    setEditingJadwal(null);
    setJJudul('');
    setJTanggal('');
    setJJam('');
    setJRuangan('');
    setShowAddJadwalModal(false);
    loadData();
  };

  const handleTogglePesertaInJadwal = async (pendaftarId: string) => {
    if (!selectedJadwalForPlotting) return;

    const currentPeserta = selectedJadwalForPlotting.peserta || [];
    const currentIds = currentPeserta.map((p) => typeof p === 'string' ? p : p.id);
    let updatedIds: string[];

    if (currentIds.includes(pendaftarId)) {
      updatedIds = currentIds.filter((id) => id !== pendaftarId);
    } else {
      updatedIds = [...currentIds, pendaftarId];
    }

    const res = await jadwalApi.addPeserta(selectedJadwalForPlotting.id, updatedIds);
    if (res.success) {
      loadData();
    }
  };

  const handleDeleteJadwal = (id: string, name: string = 'jadwal ini') => {
    setDeleteTarget({ id, name, type: 'jadwal' });
  };

  const handleDeleteSoal = (id: string, name: string = 'soal ini') => {
    setDeleteTarget({ id, name, type: 'soal' });
  };

  if (!isAuthed) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
        </main>
      </>
    );
  }

  // Filtered & searched lists
  const pendingValidationList = pendaftarList.filter((p) => p.status === 'menunggu');
  const pendingPaymentList = pendaftarList.filter(
    (p) => p.status === 'diterima' && (
      p.status_pembayaran === 'menunggu_konfirmasi' ||
      (p.status_pembayaran === 'cicilan_sebagian' && p.cicilan?.some(c => c.status === 'menunggu_konfirmasi'))
    )
  );

  const searchedPendaftarList = pendaftarList.filter((p) => {
    const matchSearch =
      p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.no_pendaftaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nik.includes(searchQuery);

    const matchStatus = filter === 'semua' ? true : p.status === filter;
    const paymentValue = p.status_pembayaran || 'belum_bayar';
    const matchPayment = paymentFilter === 'semua' ? true : paymentValue === paymentFilter;

    const matchAngkatan = angkatanFilter === 'semua'
      ? true
      : (p.angkatan_id || p.angkatan?.id || '') === angkatanFilter;

    let matchDate = true;
    if (dateFilter !== 'semua') {
      const daftarDate = new Date(p.tanggal_daftar);
      const today = new Date();
      const diffDays = (today.getTime() - daftarDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dateFilter === 'custom') {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && daftarDate < start) matchDate = false;
        if (end) {
          const endAt = new Date(end);
          endAt.setHours(23, 59, 59, 999);
          if (daftarDate > endAt) matchDate = false;
        }
      } else if (dateFilter === '7') {
        matchDate = diffDays <= 7;
      } else if (dateFilter === '30') {
        matchDate = diffDays <= 30;
      } else if (dateFilter === '90') {
        matchDate = diffDays <= 90;
      }
    }

    return matchSearch && matchStatus && matchPayment && matchAngkatan && matchDate;
  });

  const filteredSoalList = soalList.filter((s) => {
    if (filterSoalTipe === 'semua') return true;
    return s.tipe === filterSoalTipe;
  });

  const stats = {
    total: pendaftarList.length,
    menunggu: pendingValidationList.length,
    diterima: pendaftarList.filter((p) => p.status === 'diterima').length,
    ditolak: pendaftarList.filter((p) => p.status === 'ditolak').length,
    menungguBayar: pendingPaymentList.length,
    lunas: pendaftarList.filter((p) => p.status_pembayaran === 'lunas').length,
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col lg:flex-row">
      {sidebarOpen && <button type="button" aria-label="Tutup menu" className="admin-sidebar-backdrop lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'pendaftar'
            ? 'Hapus Peserta?'
            : deleteTarget?.type === 'jadwal'
              ? 'Hapus Jadwal?'
              : 'Hapus Soal?'
        }
        message={
          deleteTarget?.type === 'pendaftar'
            ? 'Anda yakin ingin menghapus data pendaftar'
            : deleteTarget?.type === 'jadwal'
              ? 'Anda yakin ingin menghapus jadwal'
              : 'Anda yakin ingin menghapus soal'
        }
        itemName={deleteTarget?.name || null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <aside className={`admin-sidebar w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm overflow-y-auto ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="space-y-4">
          {/* Brand Header inside Sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-extrabold flex items-center justify-center text-xs shadow-md">
                LPK
              </div>
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)] leading-tight">LPK Admin</div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Kerja Profesional</div>
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

          {[
            {
              sectionTitle: 'UTAMA',
              items: [
                {
                  id: 'overview',
                  label: 'Overview',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  ),
                  badge: null,
                },
              ],
            },
            {
              sectionTitle: 'MANAJEMEN PESERTA',
              items: [
                {
                  id: 'validasi_peserta',
                  label: 'Validasi Peserta',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                  ),
                  badge: stats.menunggu > 0 ? stats.menunggu : null,
                  badgeColor: 'bg-amber-500 text-white',
                },
                {
                  id: 'semua_peserta',
                  label: 'Semua Peserta',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  badge: stats.total,
                  badgeColor: 'bg-slate-200 text-slate-700',
                },
                {
                  id: 'validasi_pembayaran',
                  label: 'Validasi Pembayaran',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  ),
                  badge: stats.menungguBayar > 0 ? stats.menungguBayar : null,
                  badgeColor: 'bg-indigo-600 text-white',
                },
              ],
            },
            {
              sectionTitle: 'AKADEMIK & EVALUASI',
              items: [
                {
                  id: 'kelola_pelatihan',
                  label: 'Kelola Pelatihan',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 12 3 12 0v-5" />
                    </svg>
                  ),
                  badge: null,
                },
                {
                  id: 'kelola_angkatan',
                  label: 'Kelola Angkatan',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  badge: null,
                },
                {
                  id: 'kelola_tempat',
                  label: 'Kelola Tempat',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                  badge: null,
                },
                {
                  id: 'kelola_jadwal',
                  label: 'Kelola Jadwal',
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
                {
                  id: 'kelola_metode_pembayaran',
                  label: 'Metode Pembayaran',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  ),
                  badge: null,
                },
                {
                  id: 'kelola_ujian',
                  label: 'Pretest & Posttest',
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
                {
                  id: 'kelola_kelulusan',
                  label: 'Kelulusan & Sertifikat',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  ),
                  badge: null,
                },
              ],
            },
          ].map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 mt-3">
                <span>{group.sectionTitle}</span>
                <span className="text-slate-300 font-normal">+</span>
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
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
          <a href="/" className="sidebar-link text-slate-500 hover:text-slate-800">
            <div className="icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-xs">Lihat Halaman Utama</span>
          </a>
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

          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="btn btn-outline btn-sm flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Content Body according to Active Tab */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Pendaftar"
                  value={stats.total}
                  color="#1a365d"
                  bgColor="var(--primary-bg)"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                />
                <StatCard
                  label="Menunggu Validasi"
                  value={stats.menunggu}
                  color="#b45309"
                  bgColor="rgba(217,119,6,0.1)"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  }
                />
                <StatCard
                  label="Pendaftaran ACC"
                  value={stats.diterima}
                  color="#047857"
                  bgColor="rgba(5,150,105,0.1)"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  }
                />
                <StatCard
                  label="Pembayaran Lunas"
                  value={stats.lunas}
                  color="#2563eb"
                  bgColor="rgba(37,99,235,0.1)"
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  }
                />
              </div>

              {/* Quick Action Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card-static p-6 flex flex-col justify-between border-l-4 border-l-amber-500">
                  <div>
                    <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
                      <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <span>Validasi Peserta Baru ({stats.menunggu})</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Ada {stats.menunggu} calon peserta yang baru mendaftar dan membutuhkan peninjauan berkas serta persetujuan status pendaftaran.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('validasi_peserta')}
                    className="btn btn-primary btn-sm mt-4 self-start flex items-center gap-1.5"
                  >
                    Buka Validasi Peserta
                  </button>
                </div>

                <div className="glass-card-static p-6 flex flex-col justify-between border-l-4 border-l-indigo-600">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      </div>
                      <span>Verifikasi Bukti Bayar ({stats.menungguBayar})</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Ada {stats.menungguBayar} peserta yang telah mengunggah bukti transfer pembayaran dan menunggu pemeriksaan konfirmasi Lunas dari Admin.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('validasi_pembayaran')}
                    className="btn btn-accent btn-sm mt-4 self-start flex items-center gap-1.5"
                  >
                    Periksa Bukti Transfer
                  </button>
                </div>
              </div>

              {/* Recent Activity Table Preview */}
              <div className="glass-card-static p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--text-primary)] text-base">
                    Pendaftaran Terbaru
                  </h3>
                  <button
                    onClick={() => setActiveTab('semua_peserta')}
                    className="text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    Lihat Semua ({stats.total})
                  </button>
                </div>
                <AdminPendaftarTable data={pendaftarList.slice(0, 5)} onViewDetail={setSelectedPendaftar} />
              </div>
            </div>
          )}

          {/* TAB 2: VALIDASI PESERTA (MENUNGGU) */}
          {activeTab === 'validasi_peserta' && (
            <div className="glass-card-static p-6 animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Validasi Peserta Baru</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Daftar calon peserta yang menunggu persetujuan Admin</p>
                </div>
                <span className="badge badge-pending">{pendingValidationList.length} Menunggu</span>
              </div>

              {pendingValidationList.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                  Tidak ada peserta yang menunggu validasi. Semua data telah diproses.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingValidationList.map((pendaftar) => (
                    <div key={pendaftar.id} className="p-4 rounded-xl bg-[var(--surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--card-border)]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-[var(--primary)]">{pendaftar.no_pendaftaran}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">({new Date(pendaftar.tanggal_daftar).toLocaleDateString('id-ID')})</span>
                        </div>
                        <h4 className="font-bold text-[var(--text-primary)] text-base">{pendaftar.nama_lengkap}</h4>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          <div>Program: <span className="font-semibold text-[var(--text-primary)]">{pendaftar.jenis_pelatihan}</span></div>
                          <div className="text-[11px] text-slate-500 font-mono">NIK: {pendaftar.nik} | HP: {pendaftar.no_hp}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedPendaftar(pendaftar)} className="btn btn-outline btn-sm">
                          Lihat Detail
                        </button>
                        <button
                          onClick={async () => {
                            await pendaftarApi.updateStatus(pendaftar.id, 'diterima');
                            loadData();
                          }}
                          className="btn btn-accent btn-sm"
                        >
                          Terima
                        </button>
                        <button
                          onClick={async () => {
                            await pendaftarApi.updateStatus(pendaftar.id, 'ditolak');
                            loadData();
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEMUA PESERTA */}
          {activeTab === 'semua_peserta' && (
            <div className="glass-card-static animate-fade-in space-y-4">
              <div className="p-4 border-b border-[var(--card-border)] space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {(
                      [
                        { key: 'semua', label: 'Semua' },
                        { key: 'menunggu', label: 'Menunggu' },
                        { key: 'diterima', label: 'Diterima' },
                        { key: 'ditolak', label: 'Ditolak' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                        onClick={() => setFilter(tab.key)}
                      >
                        {tab.label}
                        <span className="ml-1 text-[11px] opacity-75">
                          ({tab.key === 'semua' ? stats.total : stats[tab.key]})
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-60 md:w-64 flex-shrink-0">
                      <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="form-input text-xs pr-3 py-1.5 border-slate-200 rounded-lg focus:border-slate-400"
                        style={{ paddingLeft: '1.85rem' }}
                        placeholder="Cari Nama, No, atau NIK..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 relative" ref={filterPopoverRef}>
                      <button
                        ref={filterButtonRef}
                        type="button"
                        onClick={() => setShowFilterPopover((prev) => !prev)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Buka filter peserta"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 6h16" />
                          <path d="M7 12h10" />
                          <path d="M10 18h4" />
                        </svg>
                      </button>

                      {showFilterPopover && (
                        <div className="absolute right-0 top-full z-30 mt-2 w-[330px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-700">Filter Peserta</div>
                            <button
                              type="button"
                              onClick={() => setShowFilterPopover(false)}
                              className="text-[11px] text-slate-400 hover:text-slate-700"
                            >
                              Tutup
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status Pembayaran</label>
                              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="form-input text-xs py-2">
                                <option value="semua">Semua Pembayaran</option>
                                <option value="belum_bayar">Belum Bayar</option>
                                <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                                <option value="lunas">Lunas</option>
                                <option value="cicilan_sebagian">Cicilan</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tanggal Pendaftaran</label>
                              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="form-input text-xs py-2">
                                <option value="semua">Semua Tanggal</option>
                                <option value="7">7 Hari Terakhir</option>
                                <option value="30">30 Hari Terakhir</option>
                                <option value="90">90 Hari Terakhir</option>
                                <option value="custom">Rentang Tanggal</option>
                              </select>
                            </div>

                            {dateFilter === 'custom' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Dari</label>
                                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input text-xs py-2" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sampai</label>
                                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input text-xs py-2" />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Angkatan</label>
                              <select value={angkatanFilter} onChange={(e) => setAngkatanFilter(e.target.value)} className="form-input text-xs py-2">
                                <option value="semua">Semua Angkatan</option>
                                {angkatanList.map((angkatan) => (
                                  <option key={angkatan.id} value={angkatan.id}>{angkatan.nama_angkatan}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={resetParticipantFilter}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                        title="Reset filter"
                        aria-label="Reset filter peserta"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 3-6.7" />
                          <path d="M3 4v5h5" />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowManualModal(true)}
                      className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 flex-shrink-0"
                    >
                      <span>+ Tambah Peserta Manual</span>
                    </button>
                  </div>
                </div>
              </div>

              <AdminPendaftarTable
                data={searchedPendaftarList}
                onViewDetail={setSelectedPendaftar}
                onDeletePendaftar={handleDeletePendaftar}
              />
            </div>
          )}

          {/* TAB 4: VALIDASI PEMBAYARAN */}
          {activeTab === 'validasi_pembayaran' && (
            <div className="glass-card-static p-6 animate-fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Validasi Pembayaran Peserta</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Daftar bukti transfer yang dikirim peserta untuk diperiksa (Lunas / Cicilan 3x)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(
                      [
                        { key: 'semua', label: 'Semua' },
                        { key: 'lunas', label: 'Bayar Lunas' },
                        { key: 'cicilan', label: 'Cicilan 3x' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setFilterPaymentType(t.key)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${filterPaymentType === t.key ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <span className="badge badge-pending">{pendingPaymentList.length} Perlu Konfirmasi</span>
                </div>
              </div>

              {pendingPaymentList.filter((p) => {
                if (filterPaymentType === 'lunas') return p.jenis_pembayaran !== 'cicilan';
                if (filterPaymentType === 'cicilan') return p.jenis_pembayaran === 'cicilan';
                return true;
              }).length === 0 ? (
                <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                  Tidak ada pembayaran yang sesuai filter saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPaymentList
                    .filter((p) => {
                      if (filterPaymentType === 'lunas') return p.jenis_pembayaran !== 'cicilan';
                      if (filterPaymentType === 'cicilan') return p.jenis_pembayaran === 'cicilan';
                      return true;
                    })
                    .map((p) => {
                      const isCicilan = p.jenis_pembayaran === 'cicilan' && p.cicilan;
                      const allCicilan = isCicilan ? p.cicilan! : [];

                      return (
                        <div key={p.id} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-mono text-xs font-bold text-[var(--primary)]">{p.no_pendaftaran}</span>
                                <h4 className="font-bold text-[var(--text-primary)] text-base">{p.nama_lengkap}</h4>
                                <p className="text-[11px] text-slate-500">Program: {p.jenis_pelatihan}</p>
                              </div>
                              <span className={isCicilan ? 'badge badge-processing' : 'badge badge-pending'}>
                                {isCicilan ? 'Cicilan 3x' : 'Pembayaran Lunas'}
                              </span>
                            </div>

                            {/* Regular Payment */}
                            {!isCicilan && (
                              <>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  Metode: <span className="font-semibold text-[var(--text-primary)]">{p.metode_pembayaran || 'Transfer Bank'}</span> • Tanggal: {new Date(p.tanggal_bayar || '').toLocaleString('id-ID')}
                                </p>
                                {p.bukti_pembayaran && (
                                  <div className="mt-3">
                                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Bukti Transfer:</p>
                                    <img
                                      src={p.bukti_pembayaran}
                                      alt="Bukti Transfer"
                                      className="max-h-40 rounded-lg border border-[var(--card-border)] bg-white p-1 cursor-pointer hover:opacity-90"
                                      onClick={() => setSelectedPendaftar(p)}
                                    />
                                  </div>
                                )}
                              </>
                            )}

                            {/* Cicilan Payment */}
                            {isCicilan && (
                              <div className="space-y-3 mt-3">
                                {(() => {
                                  const cArr = p.cicilan || [];
                                  const lunasArr = cArr.filter((c: Cicilan) => c.status === 'lunas');
                                  const terminLunas = lunasArr.length;
                                  const totalDibayar = lunasArr.reduce((acc: number, cur: Cicilan) => acc + (cur.jumlah || 0), 0);
                                  const sisaPembayaran = (p.biaya_pelatihan || 3000000) - totalDibayar;
                                  const progressPersen = Math.round((terminLunas / 3) * 100);
                                  const summary = { terminLunas, terminTotal: 3, totalDibayar, sisaPembayaran, progressPersen };
                                  return (
                                    <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100">
                                      <div className="flex justify-between text-xs mb-1.5 font-bold">
                                        <span className="text-indigo-700">Cicilan Terbayar: {summary.terminLunas} / {summary.terminTotal} Termin</span>
                                        <span className="text-indigo-600">{summary.progressPersen}%</span>
                                      </div>
                                      <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-indigo-100">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" style={{ width: `${summary.progressPersen}%` }} />
                                      </div>
                                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-1">
                                        <span>Sudah Bayar: Rp {summary.totalDibayar.toLocaleString('id-ID')}</span>
                                        <span>Sisa: Rp {summary.sisaPembayaran.toLocaleString('id-ID')}</span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Per-Termin Breakdown */}
                                <div className="space-y-2">
                                  {allCicilan.map((c: Cicilan) => (
                                    <div
                                      key={c.id}
                                      className={`p-3 rounded-xl border space-y-2 ${c.status === 'menunggu_konfirmasi'
                                          ? 'bg-amber-50/60 border-amber-200'
                                          : c.status === 'lunas'
                                            ? 'bg-emerald-50/40 border-emerald-200'
                                            : 'bg-white border-slate-200'
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-[var(--text-primary)]">Termin {c.termin} — Rp {c.jumlah.toLocaleString('id-ID')}</span>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'lunas'
                                              ? 'bg-emerald-100 text-emerald-700'
                                              : c.status === 'menunggu_konfirmasi'
                                                ? 'bg-amber-100 text-amber-700 animate-pulse'
                                                : c.status === 'ditolak'
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                          {c.status === 'lunas' ? 'Diverifikasi Lunas' : c.status === 'menunggu_konfirmasi' ? 'Menunggu Konfirmasi' : c.status === 'ditolak' ? 'Ditolak' : 'Belum Bayar'}
                                        </span>
                                      </div>

                                      {c.metode_pembayaran && (
                                        <div className="text-[11px] text-slate-600">
                                          Metode: <span className="font-semibold">{c.metode_pembayaran}</span> • {new Date(c.tanggal_bayar || '').toLocaleString('id-ID')}
                                        </div>
                                      )}

                                      {c.bukti_pembayaran && (
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bukti Transfer Cicilan:</p>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={c.bukti_pembayaran}
                                            alt={`Bukti Cicilan ${c.termin}`}
                                            className="max-h-32 rounded-lg border border-slate-200 bg-white p-1 cursor-pointer hover:opacity-90"
                                            onClick={() => setSelectedPendaftar(p)}
                                          />
                                        </div>
                                      )}

                                      {/* Actions per termin if pending */}
                                      {c.status === 'menunggu_konfirmasi' && (
                                        <div className="flex gap-2 pt-1 border-t border-amber-200/60">
                                          <button
                                            onClick={async () => {
                                              await cicilanApi.verifikasi(c.id);
                                              loadData();
                                            }}
                                            className="btn btn-accent btn-sm flex-1 text-xs flex items-center justify-center gap-1"
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Konfirmasi Lunas</span>
                                          </button>
                                          <button
                                            onClick={async () => {
                                              const catatan = prompt('Alasan penolakan (opsional):');
                                              await cicilanApi.tolak(c.id, catatan || undefined);
                                              loadData();
                                            }}
                                            className="btn btn-danger btn-sm text-xs flex items-center justify-center gap-1"
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                              <line x1="18" y1="6" x2="6" y2="18" />
                                              <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                            <span>Tolak</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions for regular payment */}
                          {!isCicilan && (
                            <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                              <button onClick={() => setSelectedPendaftar(p)} className="btn btn-outline btn-sm">
                                Lihat Detail
                              </button>
                              <button
                                onClick={async () => {
                                  await pembayaranApi.verifikasi(p.id);
                                  loadData();
                                }}
                                className="btn btn-accent btn-sm flex items-center gap-1"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Konfirmasi Lunas</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB: KELOLA PELATIHAN */}
          {activeTab === 'kelola_pelatihan' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <PelatihanManager />
            </div>
          )}

          {/* TAB: KELOLA ANGKATAN */}
          {activeTab === 'kelola_angkatan' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <AngkatanManager />
            </div>
          )}

          {/* TAB: KELOLA TEMPAT */}
          {activeTab === 'kelola_tempat' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <TempatManager />
            </div>
          )}

          {/* TAB 5: KELOLA JADWAL */}
          {activeTab === 'kelola_jadwal' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <JadwalManager />
            </div>
          )}

          {/* TAB 6: KELOLA METODE PEMBAYARAN */}
          {activeTab === 'kelola_metode_pembayaran' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <PaymentMethodManager />
            </div>
          )}

          {/* TAB 7: KELOLA PRETEST & POSTTEST */}
          {activeTab === 'kelola_ujian' && (
            <div className="glass-card-static p-6 animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Kelola Soal Pretest & Posttest</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Buat dan kelola bank soal evaluasi pilihan ganda untuk peserta pelatihan</p>
                </div>
                <button
                  onClick={handleOpenAddSoal}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambah Soal Ujian Baru
                </button>
              </div>

              {/* Filter Tipe Soal */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-semibold mr-1">Filter Tipe:</span>
                {(['semua', 'pretest', 'posttest'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterSoalTipe(t)}
                    className={`btn btn-sm text-xs capitalize ${filterSoalTipe === t ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Grid Soal */}
              <div className="space-y-4">
                {soalList
                  .filter((s) => filterSoalTipe === 'semua' || s.tipe === filterSoalTipe)
                  .map((soal, idx) => (
                    <div
                      key={soal.id}
                      className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${soal.tipe === 'pretest' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                              {soal.tipe}
                            </span>
                            <span className="text-xs font-semibold text-[var(--text-tertiary)] font-mono">
                              Program: {soal.jenis_pelatihan}
                            </span>
                          </div>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">
                            {idx + 1}. {soal.pertanyaan}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenEditSoal(soal)}
                            className="btn btn-outline btn-sm text-xs py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSoal(soal.id)}
                            className="btn btn-danger btn-sm text-xs py-1"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-[var(--card-border)]">
                        {soal.opsi.map((opsi, oIdx) => {
                          const isCorrect = oIdx === soal.jawaban_benar;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border flex items-center justify-between ${isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600'
                                }`}
                            >
                              <span>
                                {String.fromCharCode(65 + oIdx)}. {opsi}
                              </span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                  Jawaban Benar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 7: KELOLA KELULUSAN & SERTIFIKAT */}
          {activeTab === 'kelola_kelulusan' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <GraduationManager />
            </div>
          )}
        </main>
      </div>

      {selectedPendaftar && (
        <AdminPendaftarDetail
          pendaftar={selectedPendaftar}
          onClose={() => setSelectedPendaftar(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal Buat / Edit Jadwal Baru */}
      {showAddJadwalModal && (
        <div className="modal-overlay" onClick={() => { setShowAddJadwalModal(false); setEditingJadwal(null); }}>
          <div className="modal-content max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingJadwal ? 'Edit Jadwal Pelatihan' : 'Buat Jadwal Pelatihan Baru'}
              </h3>
              <button onClick={() => { setShowAddJadwalModal(false); setEditingJadwal(null); }} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Judul Sesi / Materi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Praktik Jahit Lurus / Pretest Modul 1"
                  value={jJudul}
                  onChange={(e) => setJJudul(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Pilih Angkatan Pelatihan</label>
                  <select
                    className="form-input text-xs font-medium"
                    value={jAngkatanId}
                    onChange={(e) => setJAngkatanId(e.target.value)}
                  >
                    <option value="">-- Pilih Angkatan --</option>
                    {angkatanList.map((a) => (
                      <option key={a.id} value={a.id}>{a.nama_angkatan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Pelaksanaan Hari Ke-</label>
                  <select
                    className="form-input text-xs font-bold text-indigo-700"
                    value={jHariKe}
                    onChange={(e) => setJHariKe(Number(e.target.value))}
                  >
                    <option value={1}>Hari 1 (Pre-test & Orientasi)</option>
                    <option value={2}>Hari 2 (Materi Teori & K3)</option>
                    <option value={3}>Hari 3 (Teori Pola Busana)</option>
                    <option value={4}>Hari 4 (Praktik Jahit Lurus)</option>
                    <option value={5}>Hari 5 (Pemotongan & Obras)</option>
                    <option value={6}>Hari 6 (Praktik Kerah & Saku)</option>
                    <option value={7}>Hari 7 (Praktik Busana Wanita)</option>
                    <option value={8}>Hari 8 (Finishing & QC)</option>
                    <option value={9}>Hari 9 (Review Karya & Eval)</option>
                    <option value={10}>Hari 10 (Post-test Ujian Akhir)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Program Pelatihan</label>
                  <select className="form-input" value={jJenisPelatihan} onChange={(e) => setJJenisPelatihan(e.target.value)}>
                    <option value="Semua">Semua Program</option>
                    {programList.length > 0 ? (
                      programList.map((p) => (
                        <option key={p.id} value={p.nama}>{p.nama}</option>
                      ))
                    ) : (
                      JENIS_PELATIHAN.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="form-label">Jenis Sesi</label>
                  <select className="form-input" value={jJenisSesi} onChange={(e) => setJJenisSesi(e.target.value as any)}>
                    <option value="Orientasi">Orientasi</option>
                    <option value="Teori">Teori</option>
                    <option value="Praktik">Praktik</option>
                    <option value="Ujian">Ujian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Hari / Tanggal</label>
                <input type="text" className="form-input" placeholder="Misal: Senin, 01 September 2026 / Setiap Selasa" value={jTanggal} onChange={(e) => setJTanggal(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Jam Pelaksanaan</label>
                  <input type="text" className="form-input" placeholder="08:00 - 11:30 WIB" value={jJam} onChange={(e) => setJJam(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Ruangan / Kelas</label>
                  <input type="text" className="form-input" placeholder="Ruang Teori A / Lab 01" value={jRuangan} onChange={(e) => setJRuangan(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="form-label">Opsi Tempat Pelatihan</label>
                <select
                  className="form-input text-xs"
                  value={jTempatPelatihan}
                  onChange={(e) => setJTempatPelatihan(e.target.value)}
                >
                  <option value="Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)">Gedung LPK Leles Utama</option>
                  <option value="Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)">Workshop Menjahit Leles</option>
                  <option value="Kampus Cabang Garut Kota (Jl. Ahmad Yani No. 88, Garut)">Kampus Cabang Garut Kota</option>
                </select>
              </div>

              <div>
                <label className="form-label">Pengajar / Instruktur Sesi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Hj. Siti Rahmah, S.Ds / Sri Wahyuni, S.Pd"
                  value={jPengajar}
                  onChange={(e) => setJPengajar(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => { setShowAddJadwalModal(false); setEditingJadwal(null); }} className="btn btn-outline btn-sm">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingJadwal ? 'Simpan Perubahan Jadwal' : 'Simpan Jadwal Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tarik / Plotting Peserta ke dalam Jadwal */}
      {selectedJadwalForPlotting && (
        <div className="modal-overlay" onClick={() => setSelectedJadwalForPlotting(null)}>
          <div className="modal-content max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Tarik / Masukkan Peserta ke Jadwal — {selectedJadwalForPlotting.judul}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedJadwalForPlotting.jenis_pelatihan} • {selectedJadwalForPlotting.tanggal} ({selectedJadwalForPlotting.jam}) • Terdaftar: {(selectedJadwalForPlotting.peserta || []).length} Peserta
                </p>
              </div>
              <button onClick={() => setSelectedJadwalForPlotting(null)} className="text-slate-400 hover:text-black">✕</button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Pilih peserta terdaftar yang akan diikutsertakan ke dalam sesi jadwal ini:
              </div>

              {pendaftarList
                .filter(
                  (p) =>
                    selectedJadwalForPlotting.jenis_pelatihan === 'Semua' ||
                    p.jenis_pelatihan === selectedJadwalForPlotting.jenis_pelatihan ||
                    JENIS_PELATIHAN.find((jp) => jp === p.jenis_pelatihan) === selectedJadwalForPlotting.jenis_pelatihan
                )
                .map((p) => {
                  const isChecked = (selectedJadwalForPlotting.peserta || []).some((peserta: any) => typeof peserta === 'string' ? peserta === p.id : peserta.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleTogglePesertaInJadwal(p.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isChecked
                          ? 'border-[var(--primary)] bg-[var(--primary-bg)] shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800">{p.nama_lengkap}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {p.no_pendaftaran} • Program: {p.jenis_pelatihan}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        className="w-4 h-4 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer"
                      />
                    </div>
                  );
                })}

              {pendaftarList.filter(
                (p) =>
                  selectedJadwalForPlotting.jenis_pelatihan === 'Semua' ||
                  p.jenis_pelatihan === selectedJadwalForPlotting.jenis_pelatihan ||
                  JENIS_PELATIHAN.find((jp) => jp === p.jenis_pelatihan) === selectedJadwalForPlotting.jenis_pelatihan
              ).length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Belum ada peserta terverifikasi untuk program ini.
                  </div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedJadwalForPlotting(null)} className="btn btn-primary btn-sm">
                Selesai Plotting Peserta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Jadwal & Tarik Peserta */}
      {selectedJadwalDetail && (
        <div className="modal-overlay" onClick={() => setSelectedJadwalDetail(null)}>
          <div className="modal-content max-w-3xl p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            {/* Header Detail */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedJadwalDetail.jenis_sesi}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">
                    Program: {selectedJadwalDetail.jenis_pelatihan}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {(selectedJadwalDetail.peserta || []).length} Peserta Terdaftar
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedJadwalDetail.judul}</h3>
              </div>
              <button onClick={() => setSelectedJadwalDetail(null)} className="text-slate-400 hover:text-slate-800 text-lg font-bold">✕</button>
            </div>

            {/* Info Lokasi & Pengajar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Waktu Pelaksanaan</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {selectedJadwalDetail.tanggal} ({selectedJadwalDetail.jam})
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Tempat & Ruangan</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {selectedJadwalDetail.tempat_pelatihan ? selectedJadwalDetail.tempat_pelatihan.split('(')[0] : 'Gedung LPK Leles Utama'} ({selectedJadwalDetail.ruangan})
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block text-[11px] mb-0.5">Pengajar / Instruktur</span>
                <span className="font-bold text-indigo-700 flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {selectedJadwalDetail.pengajar || 'Hj. Siti Rahmah, S.Ds'}
                </span>
              </div>
            </div>

            {/* Section Tarik / Plotting Peserta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  Tarik Peserta ke Sesi Ini
                </h4>
                <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {(selectedJadwalDetail.peserta || []).length} Peserta Terpilih
                </div>
              </div>

              {/* Search Bar Peserta */}
              <input
                type="text"
                className="form-input text-xs"
                placeholder="Cari nama peserta atau NIK..."
                value={searchPesertaJadwal}
                onChange={(e) => setSearchPesertaJadwal(e.target.value)}
              />

              {/* List Checkbox Peserta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {pendaftarList
                  .filter((p) => {
                    const matchProg =
                      selectedJadwalDetail.jenis_pelatihan === 'Semua' ||
                      p.jenis_pelatihan === selectedJadwalDetail.jenis_pelatihan ||
                      JENIS_PELATIHAN.find((jp) => jp === p.jenis_pelatihan) === selectedJadwalDetail.jenis_pelatihan;
                    const matchSearch =
                      !searchPesertaJadwal ||
                      p.nama_lengkap.toLowerCase().includes(searchPesertaJadwal.toLowerCase()) ||
                      p.nik.includes(searchPesertaJadwal) ||
                      p.no_pendaftaran.toLowerCase().includes(searchPesertaJadwal.toLowerCase());
                    return matchProg && matchSearch;
                  })
                  .map((p) => {
                    const isChecked = (selectedJadwalDetail.peserta || []).some(
                      (peserta: any) => (typeof peserta === 'string' ? peserta === p.id : peserta.id === p.id)
                    );
                    return (
                      <div
                        key={p.id}
                        onClick={async () => {
                          const currentPeserta = selectedJadwalDetail.peserta || [];
                          const currentIds = currentPeserta.map((x: any) => typeof x === 'string' ? x : x.id);
                          const updatedIds = isChecked
                            ? currentIds.filter((id) => id !== p.id)
                            : [...currentIds, p.id];
                          
                          await jadwalApi.addPeserta(selectedJadwalDetail.id, updatedIds);
                          
                          // Sync local state
                          setSelectedJadwalDetail((prev) => {
                            if (!prev) return null;
                            const cur = prev.peserta || [];
                            const isPresent = cur.some((x: any) => (typeof x === 'string' ? x === p.id : x.id === p.id));
                            const nextPeserta = isPresent
                              ? cur.filter((x: any) => (typeof x === 'string' ? x !== p.id : x.id !== p.id))
                              : [...cur, p];
                            return { ...prev, peserta: nextPeserta };
                          });
                          loadData();
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 shadow-2xs font-medium'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs truncate">{p.nama_lengkap}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.no_pendaftaran} • {p.tempat_pelatihan ? p.tempat_pelatihan.split('(')[0] : 'LPK Utama'}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-indigo-600 rounded accent-indigo-600 cursor-pointer shrink-0"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedJadwalDetail(null)}
                className="btn btn-primary btn-sm font-bold"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Soal Ujian */}
      {showAddSoalModal && (
        <div className="modal-overlay" onClick={() => setShowAddSoalModal(false)}>
          <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] text-base">
                {editingSoal ? 'Edit Soal Ujian' : 'Tambah Soal Ujian Baru'}
              </h3>
              <button onClick={() => setShowAddSoalModal(false)} className="text-[var(--text-tertiary)] hover:text-black">✕</button>
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
                    {JENIS_PELATIHAN.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Pertanyaan Soal</label>
                <textarea className="form-input min-h-[70px]" placeholder="Tuliskan pertanyaan soal..." value={sPertanyaan} onChange={(e) => setSPertanyaan(e.target.value)} required />
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

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddSoalModal(false)} className="btn btn-outline btn-sm">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">Simpan Soal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENDAFTARAN PESERTA MANUAL */}
      <ManualRegisterModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bgColor,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bgColor, color }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-extrabold text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-secondary)] mt-1">{label}</div>
    </div>
  );
}



