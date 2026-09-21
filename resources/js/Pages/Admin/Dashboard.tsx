'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import AdminPendaftarTable from '@/Components/AdminPendaftarTable';
import AngkatanManager from '@/Components/AngkatanManager';
import PelatihanManager from '@/Components/PelatihanManager';
import TempatManager from '@/Components/TempatManager';
import InstrukturManager from '@/Components/InstrukturManager';
import CalendarView from '@/Components/CalendarView';
import GraduationManager from '@/Components/GraduationManager';
import JadwalManager from '@/Components/JadwalManager';
import PaymentMethodManager from '@/Components/PaymentMethodManager';
import MataPelatihanManager from '@/Components/MataPelatihanManager';
import InstrukturSearchSelect from '@/Components/InstrukturSearchSelect';
import Pagination from '@/Components/Pagination';
import {
  type Pendaftar,
  type JadwalPelatihan,
  type SoalUjian,
  type Program,
  type Angkatan,
  getStatusValidasi,
  getStatusVerifikasi,
  getTahapLabel,
  getTahapBadgeClass,
} from '@/lib/storage';
import {
  pendaftarApi,
  jadwalApi,
  soalApi,
  pembayaranApi,
  programApi,
  angkatanApi,
  instrukturApi,
  authApi,
} from '@/lib/api';
import { getToken, removeToken, setRoleUser } from '@/lib/axios';
import type { Pembayaran, Instruktur } from '@/lib/types';
import { groupJadwalToKelas } from '@/lib/kelas';

type AdminTab =
  | 'overview'
  | 'validasi_peserta'
  | 'verifikasi_peserta'
  | 'semua_peserta'
  | 'histori_pembayaran'
  | 'validasi_pembayaran'
  | 'kelola_program'
  | 'kelola_tempat'
  | 'kelola_instruktur'
  | 'kelola_pelatihan'
  | 'kelola_angkatan'
  | 'kelola_kelas'
  | 'kelola_jadwal'
  | 'kelola_penilaian'
  | 'kelola_metode_pembayaran'
  | 'kelola_ujian'
  | 'kelola_kelulusan'
  | 'mata_pelajaran';

interface SidebarChild {
  id: AdminTab;
  label: string;
  badge?: number | null;
  badgeColor?: string;
}

interface SidebarItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  badge?: number | null;
  badgeColor?: string;
  children?: SidebarChild[];
}

const PELATIHAN_CHILDREN: AdminTab[] = ['kelola_pelatihan', 'kelola_angkatan', 'kelola_kelas', 'kelola_jadwal', 'kelola_penilaian'];

type FilterStatus = 'semua' | 'menunggu' | 'diterima' | 'ditolak' | 'lulus' | 'sudah_bekerja' | 'keluar';

import ManualRegisterModal from '@/Components/ManualRegisterModal';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import AdminPendaftarDetail, { type DetailMode } from '@/Components/AdminPendaftarDetail';
import PaymentDetailModal from '@/Components/PaymentDetailModal';
import ManualPaymentModal from '@/Components/ManualPaymentModal';
import HistoriPembayaran from '@/Components/HistoriPembayaran';
import { RiwayatUjianPanel } from '@/Components/RiwayatUjian';import ActionToast, { useActionToast } from '@/Components/ActionToast';

interface AdminDashboardProps {
  initialPendaftarList?: Pendaftar[];
  initialJadwalList?: JadwalPelatihan[];
  initialSoalList?: SoalUjian[];
  initialProgramList?: Program[];
  initialAngkatanList?: Angkatan[];
  initialTempatList?: TempatPelatihan[];
  initialInstrukturList?: Instruktur[];
  initialPaymentMethods?: PaymentMethod[];
}

export default function AdminDashboardPage(props: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>(props.initialPendaftarList || []);
  const [showManualModal, setShowManualModal] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPendaftar, setSelectedPendaftar] = useState<Pendaftar | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>('semua');
  const openDetail = (p: Pendaftar, mode: DetailMode) => {
    setSelectedPendaftar(p);
    setDetailMode(mode);
  };
  const closeDetail = () => setSelectedPendaftar(null);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<{ pendaftar: Pendaftar; pembayaran: Pembayaran } | null>(null);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'pendaftar' | 'jadwal' | 'soal' } | null>(null);
  const { actionToast, showLoading, showSuccess, showError, hideToast } = useActionToast();
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isSavingJadwal, setIsSavingJadwal] = useState(false);
  const [isSavingSoal, setIsSavingSoal] = useState(false);
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
    setSearchQuery('');
    setFilter('semua');
    setPaymentFilter('semua');
    setDateFilter('semua');
    setStartDate('');
    setEndDate('');
    setAngkatanFilter('semua');
    setShowFilterPopover(false);
  };

  const isFilterActive =
    searchQuery !== '' ||
    filter !== 'semua' ||
    paymentFilter !== 'semua' ||
    angkatanFilter !== 'semua' ||
    dateFilter !== 'semua' ||
    startDate !== '' ||
    endDate !== '';

  // State Filter Pembayaran
  const [filterPaymentType, setFilterPaymentType] = useState<'semua' | 'cash' | 'transfer'>('semua');

  // State Jadwal
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>(props.initialJadwalList || []);
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
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>(props.initialAngkatanList || []);
  const [filterAngkatanJadwal, setFilterAngkatanJadwal] = useState<string>('semua');
  const [jTanggal, setJTanggal] = useState('');
  const [jJam, setJJam] = useState('');
  const [jRuangan, setJRuangan] = useState('');
  const [jTempatPelatihan, setJTempatPelatihan] = useState('Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)');
  const [jPengajar, setJPengajar] = useState('Hj. Siti Rahmah, S.Ds');
  const [jJenisSesi, setJJenisSesi] = useState<'Orientasi' | 'Teori' | 'Praktik' | 'Ujian'>('Teori');
  const [jStatus, setJStatus] = useState<'Wajib' | 'Reguler' | 'Evaluasi'>('Reguler');

  // State Soal Ujian
  const [soalList, setSoalList] = useState<SoalUjian[]>(props.initialSoalList || []);
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
  const [sGambarFile, setSGambarFile] = useState<File | null>(null);
  const [sGambarPreview, setSGambarPreview] = useState<string | null>(null);
  const [sIsActive, setSIsActive] = useState(true);

  const [filterSoalTipe, setFilterSoalTipe] = useState<'semua' | 'pretest' | 'posttest'>('semua');
  const [filterSoalStatus, setFilterSoalStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');

  // Histori pengerjaan ujian per peserta (croschek jawaban)
  const [historiPesertaId, setHistoriPesertaId] = useState('');
  const [historiSearch, setHistoriSearch] = useState('');

  // Pagination state
  const [validasiPage, setValidasiPage] = useState(1);
  const [pembayaranPage, setPembayaranPage] = useState(1);
  const [soalPage, setSoalPage] = useState(1);
  const PAGE_SIZE = 10;

  const handleDeletePendaftar = (id: string, nama: string) => {
    setDeleteTarget({ id, name: nama, type: 'pendaftar' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeletingItem(true);
    showLoading('delete', `Menghapus ${deleteTarget.name}...`, 'Sedang menghapus data dari database...');

    try {
      if (deleteTarget.type === 'pendaftar') {
        await pendaftarApi.destroy(deleteTarget.id);
      } else if (deleteTarget.type === 'jadwal') {
        await jadwalApi.destroy(deleteTarget.id);
      } else if (deleteTarget.type === 'soal') {
        await soalApi.destroy(deleteTarget.id);
      }

      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Data Berhasil Dihapus!', `"${deletedName}" telah berhasil dihapus dari sistem.`);
    } catch (err: any) {
      console.error('Error deleting item:', err);
      showError('Gagal Menghapus Data', err?.message || 'Terjadi kesalahan sistem saat menghapus data.');
    } finally {
      setIsDeletingItem(false);
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
    setSGambarFile(null);
    setSGambarPreview(null);
    setSIsActive(true);
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
    setSGambarFile(null);
    setSGambarPreview(soal.gambar_soal || null);
    setSIsActive(soal.is_active ?? true);
    setShowAddSoalModal(true);
  };

  const handleToggleSoalStatus = async (soal: SoalUjian) => {
    try {
      const next = !(soal.is_active ?? true);
      await soalApi.updateStatus(soal.id, next);
      await loadData();
      showSuccess(
        'edit',
        next ? 'Soal Diaktifkan!' : 'Soal Dinonaktifkan!',
        next
          ? 'Soal akan muncul kembali pada ujian peserta.'
          : 'Soal tidak akan muncul pada ujian peserta.'
      );
    } catch (err: any) {
      console.error('Error toggling soal status:', err);
      showError('Gagal Mengubah Status Soal', err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Handler Submit Soal (Tambah / Edit)
  const handleSaveSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sPertanyaan || !sOpsiA || !sOpsiB || !sOpsiC || !sOpsiD) return;

    setIsSavingSoal(true);
    const isEdit = Boolean(editingSoal);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Memperbarui Soal Ujian...' : 'Menambahkan Soal Baru...',
      'Sedang menyimpan ke bank soal...'
    );

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
      setShowAddSoalModal(false);
      await loadData();
      showSuccess(
        isEdit ? 'edit' : 'add',
        isEdit ? 'Soal Ujian Berhasil Diperbarui!' : 'Soal Ujian Baru Berhasil Ditambahkan!',
        'Bank soal ujian telah diperbarui.'
      );
    } catch (err: any) {
      console.error('Error saving soal:', err);
      showError('Gagal Menyimpan Soal', err?.message || 'Terjadi kesalahan sistem saat menyimpan soal.');
    } finally {
      setIsSavingSoal(false);
    }
  };

  const [programList, setProgramList] = useState<Program[]>(props.initialProgramList || []);
  const [instrukturList, setInstrukturList] = useState<Instruktur[]>(props.initialInstrukturList || []);
  const [expandedPelatihan, setExpandedPelatihan] = useState(false);

  // Auto-buka dropdown saat navigasi masuk ke grup pelatihan (mis. via kartu hub),
  // tapi tetap bisa ditutup manual karena tidak dipaksa terbuka via OR activeTab.
  useEffect(() => {
    if (PELATIHAN_CHILDREN.includes(activeTab)) {
      setExpandedPelatihan(true);
    }
  }, [activeTab]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsDataRefreshing(true);
    try {
      const [pendaftarRes, jadwalRes, soalRes, prgRes, angkRes, insRes] = await Promise.all([
        pendaftarApi.list({ per_page: 1000 }),
        jadwalApi.list(),
        soalApi.list(),
        programApi.list(),
        angkatanApi.list(),
        instrukturApi.list(),
      ]);

      if (pendaftarRes.success && pendaftarRes.data) {
        const rawPendaftar = pendaftarRes.data;
        const pendaftarArray: Pendaftar[] = Array.isArray(rawPendaftar)
          ? rawPendaftar
          : (Array.isArray((rawPendaftar as any)?.data) ? (rawPendaftar as any).data : []);
        pendaftarArray.sort((a: Pendaftar, b: Pendaftar) => new Date(b.tanggal_daftar).getTime() - new Date(a.tanggal_daftar).getTime());
        setPendaftarList(pendaftarArray);
      }

      if (jadwalRes.success && jadwalRes.data) {
        setJadwalList(jadwalRes.data);
      }

      if (soalRes.success && soalRes.data) {
        setSoalList(soalRes.data);
      }

      if (prgRes.success && prgRes.data) {
        setProgramList(prgRes.data);
      }

      if (angkRes.success && angkRes.data) {
        setAngkatanList(angkRes.data);
      }

      if (insRes.success && insRes.data) {
        setInstrukturList(insRes.data);
      }
    } catch (error) {
      console.error('[Admin Dashboard loadData error]:', error);
    } finally {
      if (!silent) setIsDataRefreshing(false);
    }
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);

    // Identitas admin WAJIB dari token per-peran — cookie session dipakai
    // bersama antar-tab sehingga tidak bisa dipercaya di sini.
    (async () => {
      if (!getToken('ADMIN')) {
        router.visit('/login');
        return;
      }
      try {
        const meRes = await authApi.me();
        const meUser = (meRes as any)?.data;
        if (!meRes.success || !meUser || (meUser.role || '').toUpperCase() !== 'ADMIN') {
          removeToken('ADMIN');
          sessionStorage.removeItem('lpk_admin_logged_in');
          router.visit('/login');
          return;
        }
        setRoleUser('ADMIN', meUser);
      } catch {
        removeToken('ADMIN');
        sessionStorage.removeItem('lpk_admin_logged_in');
        router.visit('/login');
        return;
      }
    })();

    setIsAuthed(true);

    if (props.initialPendaftarList && props.initialPendaftarList.length > 0) {
      setPendaftarList(props.initialPendaftarList);
    }
    if (props.initialJadwalList && props.initialJadwalList.length > 0) {
      setJadwalList(props.initialJadwalList);
    }
    if (props.initialSoalList && props.initialSoalList.length > 0) {
      setSoalList(props.initialSoalList);
    }
    if (props.initialProgramList && props.initialProgramList.length > 0) {
      setProgramList(props.initialProgramList);
    }
    if (props.initialAngkatanList && props.initialAngkatanList.length > 0) {
      setAngkatanList(props.initialAngkatanList);
    }
    if (props.initialInstrukturList && props.initialInstrukturList.length > 0) {
      setInstrukturList(props.initialInstrukturList);
    }
  }, [props.initialPendaftarList, props.initialJadwalList, props.initialSoalList, props.initialProgramList, props.initialAngkatanList, props.initialInstrukturList]);

  if (!isMounted) {
    return null;
  }

  const handleStatusChange = async () => {
    showSuccess('edit', 'Data Peserta Diperbarui!', 'Perubahan status dan data peserta berhasil disimpan.');
    await loadData();
    setSelectedPendaftar(null);
  };

  const handleLogout = () => {
    // Logout HANYA peran admin — peran lain di tab sebelah tetap login.
    authApi.logout().catch(() => null);
    removeToken('ADMIN');
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

    setIsSavingJadwal(true);
    const isEdit = Boolean(editingJadwal);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Memperbarui Jadwal...' : 'Menambahkan Jadwal Baru...',
      'Sedang memproses dan menyimpan ke sistem...'
    );

    try {
      const payload = {
        judul: jJudul,
        jenis_pelatihan: jJenisPelatihan,
        tanggal: jTanggal,
        jam: jJam,
        ruangan: jRuangan,
        tempat_pelatihan: jTempatPelatihan,
        pengajar: jPengajar,
        jenis_sesi: jJenisSesi,
        status: jStatus,
      };

      if (editingJadwal) {
        await jadwalApi.update(editingJadwal.id, payload);
      } else {
        await jadwalApi.create(payload);
      }

      const savedJudul = jJudul;
      setEditingJadwal(null);
      setJJudul('');
      setJTanggal('');
      setJJam('');
      setJRuangan('');
      setShowAddJadwalModal(false);
      await loadData();
      showSuccess(
        isEdit ? 'edit' : 'add',
        isEdit ? 'Jadwal Berhasil Diperbarui!' : 'Jadwal Baru Berhasil Ditambahkan!',
        `Jadwal "${savedJudul}" telah tersimpan.`
      );
    } catch (err: any) {
      console.error('Error saving jadwal:', err);
      showError('Gagal Menyimpan Jadwal', err?.message || 'Terjadi kesalahan sistem saat menyimpan jadwal.');
    } finally {
      setIsSavingJadwal(false);
    }
  };

  const handleTogglePesertaInJadwal = async (pendaftarId: string) => {
    if (!selectedJadwalForPlotting) return;

    const currentPeserta = selectedJadwalForPlotting.peserta || [];
    const currentIds = currentPeserta.map((p) => typeof p === 'string' ? p : p.id);
    const isRemoving = currentIds.includes(pendaftarId);

    showLoading(
      isRemoving ? 'delete' : 'add',
      isRemoving ? 'Menghapus Peserta dari Jadwal...' : 'Menambahkan Peserta ke Jadwal...'
    );

    try {
      if (isRemoving) {
        const res = await jadwalApi.removePeserta(selectedJadwalForPlotting.id, pendaftarId);
        if (res.success) {
          await loadData();
          showSuccess('delete', 'Peserta Dihapus dari Jadwal');
        }
      } else {
        const res = await jadwalApi.addPeserta(selectedJadwalForPlotting.id, [pendaftarId]);
        if (res.success) {
          await loadData();
          showSuccess('add', 'Peserta Ditambahkan ke Jadwal');
        }
      }
    } catch (err: any) {
      showError('Gagal Memperbarui Jadwal', err?.message || 'Terjadi kesalahan sistem.');
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

  // Filtered & searched lists — alur 2 tahap
  const pendingValidationList = pendaftarList.filter((p) => getStatusValidasi(p) === 'menunggu' && p.status !== 'ditolak');
  const pendingVerifikasiList = pendaftarList.filter(
    (p) => getStatusValidasi(p) === 'diterima' && (getStatusVerifikasi(p) === 'menunggu' || getStatusVerifikasi(p) === 'belum_proses')
  );
  const pendingPaymentList = pendaftarList.filter(
    (p) => (p.status === 'diterima' || p.status === 'lulus' || p.status === 'sudah_bekerja') && (
      p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi') ||
      p.status_pembayaran === 'menunggu_konfirmasi'
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
    menunggu: pendingValidationList.length + pendingVerifikasiList.length,
    menungguValidasi: pendingValidationList.length,
    menungguVerifikasi: pendingVerifikasiList.length,
    diterima: pendaftarList.filter((p) => p.status === 'diterima').length,
    ditolak: pendaftarList.filter((p) => p.status === 'ditolak').length,
    lulus: pendaftarList.filter((p) => p.status === 'lulus').length,
    sudah_bekerja: pendaftarList.filter((p) => p.status === 'sudah_bekerja').length,
    keluar: pendaftarList.filter((p) => p.status === 'keluar').length,
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
        loading={isDeletingItem}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!isDeletingItem) setDeleteTarget(null);
        }}
      />

      {/* Action Toast Feedback */}
      <ActionToast toast={actionToast} onClose={hideToast} />

      {selectedPaymentDetail && (
        <PaymentDetailModal
          pendaftar={selectedPaymentDetail.pendaftar}
          pembayaran={selectedPaymentDetail.pembayaran}
          onClose={() => setSelectedPaymentDetail(null)}
        />
      )}

      {showManualPayment && (
        <ManualPaymentModal
          pendaftarList={pendaftarList}
          onClose={() => setShowManualPayment(false)}
          onSuccess={() => {
            setShowManualPayment(false);
            showSuccess('add', 'Pembayaran Manual Tercatat!', 'Sisa tagihan peserta otomatis berkurang.');
            loadData();
          }}
        />
      )}

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

          {([
            {
              sectionTitle: 'UTAMA',
              items: [
                {
                  id: 'overview' as AdminTab,
                  label: 'Overview',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  ),
                  badge: null as number | null,
                },
              ] as SidebarItem[],
            },
            {
              sectionTitle: 'MANAJEMEN PESERTA',
              items: [
                {
                  id: 'validasi_peserta' as AdminTab,
                  label: 'Validasi Awal (Tahap 1)',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                  ),
                  badge: stats.menungguValidasi > 0 ? stats.menungguValidasi : null,
                  badgeColor: 'bg-amber-500 text-white',
                },
                {
                  id: 'verifikasi_peserta' as AdminTab,
                  label: 'Verifikasi (Tahap 2)',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  ),
                  badge: stats.menungguVerifikasi > 0 ? stats.menungguVerifikasi : null,
                  badgeColor: 'bg-indigo-600 text-white',
                },
                {
                  id: 'semua_peserta' as AdminTab,
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
              ] as SidebarItem[],
            },
            {
              sectionTitle: 'PEMBAYARAN',
              items: [
                {
                  id: 'validasi_pembayaran' as AdminTab,
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
                {
                  id: 'histori_pembayaran' as AdminTab,
                  label: 'Histori Pembayaran',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  badge: null as number | null,
                },
                {
                  id: 'kelola_metode_pembayaran' as AdminTab,
                  label: 'Metode Pembayaran',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  ),
                  badge: null as number | null,
                },
              ] as SidebarItem[],
            },
            {
              sectionTitle: 'PROGRAM & TEMPAT',
              items: [
                {
                  id: 'kelola_program' as AdminTab,
                  label: 'Kelola Program',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 12 3 12 0v-5" />
                    </svg>
                  ),
                  badge: null as number | null,
                },
                {
                  id: 'kelola_tempat' as AdminTab,
                  label: 'Kelola Tempat',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                  badge: null as number | null,
                },
              ] as SidebarItem[],
            },
            {
              sectionTitle: 'AKADEMIK',
              items: [
                {
                  id: 'kelola_pelatihan' as AdminTab,
                  label: 'Kelola Pelatihan',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  ),
                  badge: null as number | null,
                  children: [
                    { id: 'kelola_angkatan' as AdminTab, label: 'Kelola Angkatan', badge: angkatanList.length > 0 ? angkatanList.length : null, badgeColor: 'bg-slate-200 text-slate-700' },
                    { id: 'kelola_kelas' as AdminTab, label: 'Kelola Kelas', badge: groupJadwalToKelas(jadwalList, angkatanList, props.initialTempatList || []).length || null, badgeColor: 'bg-emerald-100 text-emerald-700' },
                    { id: 'kelola_jadwal' as AdminTab, label: 'Kelola Jadwal', badge: jadwalList.length > 0 ? jadwalList.length : null, badgeColor: 'bg-blue-100 text-blue-700' },
                    { id: 'kelola_penilaian' as AdminTab, label: 'Kelola Penilaian', badge: null as number | null },
                  ],
                },
                {
                  id: 'kelola_ujian' as AdminTab,
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
                  id: 'kelola_kelulusan' as AdminTab,
                  label: 'Kelulusan & Sertifikat',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  ),
                  badge: null as number | null,
                },
                {
                  id: 'mata_pelajaran' as AdminTab,
                  label: 'Mata Pelatihan',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
                      <line x1="9" y1="12" x2="15" y2="12"/>
                      <line x1="9" y1="16" x2="13" y2="16"/>
                    </svg>
                  ),
                  badge: null as number | null,
                },
                {
                  id: 'kelola_instruktur' as AdminTab,
                  label: 'Kelola Instruktur',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  badge: instrukturList.length > 0 ? instrukturList.length : null,
                  badgeColor: 'bg-emerald-100 text-emerald-700',
                },
              ] as SidebarItem[],
            },
          ]).map((group, gIdx) => {
            const isPelatihanGroup = group.items.some((i) => i.id === 'kelola_pelatihan');
            const pelatihanOpen = expandedPelatihan;
            return (
            <div key={gIdx} className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 mt-3">
                <span>{group.sectionTitle}</span>
                <span className="text-slate-300 font-normal">+</span>
              </div>
              {group.items.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const showChildren = hasChildren && (isPelatihanGroup ? pelatihanOpen : true);
                const isParentActive = hasChildren && PELATIHAN_CHILDREN.includes(activeTab);
                return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasChildren && isPelatihanGroup) {
                        // Toggle buka/tutup. Saat menutup, jangan pindah tab
                        // agar tidak langsung terbuka lagi. Saat membuka dari
                        // luar grup, navigasi ke halaman hub pelatihan.
                        if (pelatihanOpen) {
                          setExpandedPelatihan(false);
                          setSidebarOpen(false);
                          return;
                        }
                        setExpandedPelatihan(true);
                        if (!PELATIHAN_CHILDREN.includes(activeTab)) {
                          setActiveTab(item.id);
                          setSelectedPendaftar(null);
                        }
                        setSidebarOpen(false);
                        return;
                      }
                      setActiveTab(item.id);
                      setSelectedPendaftar(null);
                      setSidebarOpen(false);
                    }}
                    className={`sidebar-link ${activeTab === item.id || isParentActive ? 'active' : ''}`}
                  >
                    <div className="icon-box">{item.icon}</div>
                    <span className="flex-1 text-xs">{item.label}</span>
                    {item.badge != null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor ?? 'bg-slate-200 text-slate-700'}`}>
                        {item.badge}
                      </span>
                    )}
                    {hasChildren && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showChildren ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </button>
                  {showChildren && item.children?.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setActiveTab(child.id);
                        setSelectedPendaftar(null);
                        setSidebarOpen(false);
                      }}
                      className={`sidebar-link ml-5 pl-3 border-l-2 ${activeTab === child.id ? 'active border-indigo-500' : 'border-slate-200'}`}
                    >
                      <span className="flex-1 text-xs">{child.label}</span>
                      {child.badge != null && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${child.badgeColor ?? 'bg-slate-200 text-slate-700'}`}>
                          {child.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                );
              })}
            </div>
            );
          })}
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
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-20 relative">
          {/* Top Refreshing Indeterminate Line */}
          {isDataRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-100 overflow-hidden z-30">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
            </div>
          )}

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

            {/* Syncing Badge */}
            {isDataRefreshing && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full animate-fade-in shadow-xs">
                <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <span>Menyinkronkan data...</span>
              </div>
            )}
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
          {selectedPendaftar ? (
            <AdminPendaftarDetail
              pendaftar={selectedPendaftar}
              mode={detailMode}
              backLabel={
                detailMode === 'validasi'
                  ? 'Kembali ke Validasi Awal'
                  : detailMode === 'verifikasi'
                    ? 'Kembali ke Verifikasi'
                    : 'Kembali ke Daftar Peserta'
              }
              onClose={closeDetail}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                      label="Tahap 1: Validasi"
                      value={stats.menungguValidasi}
                      color="#d97706"
                      bgColor="rgba(217,119,6,0.1)"
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      }
                    />
                    <StatCard
                      label="Tahap 2: Verifikasi"
                      value={stats.menungguVerifikasi}
                      color="#4f46e5"
                      bgColor="rgba(79,70,229,0.1)"
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      }
                    />
                    <StatCard
                      label="Peserta Diterima"
                      value={stats.diterima}
                      color="#059669"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <span>Tahap 1: Validasi Awal ({stats.menungguValidasi})</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          Ada {stats.menungguValidasi} pendaftar baru menunggu filter awal: cek jenis kelamin khusus perempuan & keaslian data. Lolos → masuk Tahap 2 Verifikasi.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('validasi_peserta')}
                        className="btn btn-primary btn-sm mt-4 self-start flex items-center gap-1.5"
                      >
                        Buka Validasi Awal
                      </button>
                    </div>

                    <div className="glass-card-static p-6 flex flex-col justify-between border-l-4 border-l-indigo-600">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 11l3 3L22 4" />
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                          </div>
                          <span>Tahap 2: Verifikasi ({stats.menungguVerifikasi})</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          Ada {stats.menungguVerifikasi} pendaftar lolos validasi dan menunggu verifikasi berkas + fisik. Diterima → masuk angkatan, jadwal, status diterima.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('verifikasi_peserta')}
                        className="btn btn-accent btn-sm mt-4 self-start flex items-center gap-1.5"
                      >
                        Buka Verifikasi
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
                        Buka Validasi Pembayaran
                      </button>
                    </div>
                  </div>

                  {/* Table Recent Pendaftar */}
                  <div className="glass-card-static p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[var(--text-primary)] text-base">Pendaftaran Terbaru</h3>
                      <button
                        onClick={() => setActiveTab('semua_peserta')}
                        className="text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        Lihat Semua ({stats.total})
                      </button>
                    </div>
                    <AdminPendaftarTable data={pendaftarList.slice(0, 5)} onViewDetail={(p) => openDetail(p, 'semua')} />
                  </div>
                </div>
              )}

              {/* TAB 2: TAHAP 1 — VALIDASI AWAL */}
              {activeTab === 'validasi_peserta' && (
                <div className="glass-card-static p-6 animate-fade-in space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Tahap 1 — Validasi Awal</h2>
                      <p className="text-xs text-[var(--text-secondary)]">Filter pendaftar baru: khusus perempuan & pastikan bukan asal daftar. Lolos → masuk Tahap 2 Verifikasi.</p>
                    </div>
                    <span className="badge badge-pending">{pendingValidationList.length} Menunggu validasi</span>
                  </div>

                  {pendingValidationList.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                      Tidak ada pendaftar menunggu validasi. Semua data tahap awal telah diproses.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                              <th className="py-3.5 px-4">No. Registrasi</th>
                              <th className="py-3.5 px-4">Nama & NIK</th>
                              <th className="py-3.5 px-4">Jenis Kelamin</th>
                              <th className="py-3.5 px-4">Program & HP</th>
                              <th className="py-3.5 px-4 text-center">Tahap</th>
                              <th className="py-3.5 px-4 text-right">Aksi Validasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {pendingValidationList.slice((validasiPage - 1) * PAGE_SIZE, validasiPage * PAGE_SIZE).map((pendaftar) => (
                              <tr key={pendaftar.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3.5 px-4">
                                  <span className="font-mono font-bold text-indigo-600 block text-xs">{pendaftar.no_pendaftaran}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {new Date(pendaftar.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-bold text-slate-800 text-sm block">{pendaftar.nama_lengkap}</span>
                                  <span className="font-mono text-[11px] text-slate-500">NIK: {pendaftar.nik}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pendaftar.jenis_kelamin === 'Laki-laki' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    {pendaftar.jenis_kelamin || '-'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1 border border-indigo-100">
                                    {pendaftar.jenis_pelatihan}
                                  </span>
                                  <span className="block text-[11px] text-slate-500 font-medium">HP: {pendaftar.no_hp}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={getTahapBadgeClass(pendaftar)}>{getTahapLabel(pendaftar)}</span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openDetail(pendaftar, 'validasi')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                                    >
                                      Buka Detail Validasi
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination currentPage={validasiPage} totalItems={pendingValidationList.length} pageSize={PAGE_SIZE} onPageChange={setValidasiPage} />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2b: TAHAP 2 — VERIFIKASI BERKAS */}
              {activeTab === 'verifikasi_peserta' && (
                <div className="glass-card-static p-6 animate-fade-in space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Tahap 2 — Verifikasi Berkas & Fisik</h2>
                      <p className="text-xs text-[var(--text-secondary)]">Pendaftar lolos validasi. Cek fisik + berkas, lalu masukkan ke angkatan & jadwal (status menjadi diterima).</p>
                    </div>
                    <span className="badge badge-processing">{pendingVerifikasiList.length} Menunggu verifikasi</span>
                  </div>

                  {pendingVerifikasiList.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                      Tidak ada pendaftar menunggu verifikasi. Semua yang lolos validasi sudah diproses.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                              <th className="py-3.5 px-4">No. Registrasi</th>
                              <th className="py-3.5 px-4">Nama & NIK Peserta</th>
                              <th className="py-3.5 px-4">Program & HP</th>
                              <th className="py-3.5 px-4 text-center">Tahap</th>
                              <th className="py-3.5 px-4 text-right">Aksi Verifikasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {pendingVerifikasiList.slice((validasiPage - 1) * PAGE_SIZE, validasiPage * PAGE_SIZE).map((pendaftar) => (
                              <tr key={pendaftar.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3.5 px-4">
                                  <span className="font-mono font-bold text-indigo-600 block text-xs">{pendaftar.no_pendaftaran}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {new Date(pendaftar.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-bold text-slate-800 text-sm block">{pendaftar.nama_lengkap}</span>
                                  <span className="font-mono text-[11px] text-slate-500">NIK: {pendaftar.nik}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1 border border-indigo-100">
                                    {pendaftar.jenis_pelatihan}
                                  </span>
                                  <span className="block text-[11px] text-slate-500 font-medium">HP: {pendaftar.no_hp}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={getTahapBadgeClass(pendaftar)}>{getTahapLabel(pendaftar)}</span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openDetail(pendaftar, 'verifikasi')}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 11l3 3L22 4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                      </svg>
                                      Buka Detail Verifikasi
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination currentPage={validasiPage} totalItems={pendingVerifikasiList.length} pageSize={PAGE_SIZE} onPageChange={setValidasiPage} />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SEMUA PESERTA (TERFILTER) */}
              {activeTab === 'semua_peserta' && (
                <div className="glass-card-static p-6 animate-fade-in space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Data Seluruh Peserta</h2>
                      <p className="text-xs text-[var(--text-secondary)]">Kelola, cari, dan kustomisasi filter peserta LPK Leles</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search Bar Input */}
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 pointer-events-none text-slate-400 z-10 flex items-center justify-center">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Cari nama, NIK, registrasi..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.25rem' : '0.875rem' }}
                          className="form-input text-xs h-9 w-60 sm:w-72 font-medium bg-slate-50/80 focus:bg-white border-slate-200 focus:border-indigo-500 rounded-xl transition-all shadow-2xs"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors z-10"
                            title="Bersihkan pencarian"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Popover Filter Lanjutan */}
                      <div className="relative" ref={filterPopoverRef}>
                        <button
                          ref={filterButtonRef}
                          type="button"
                          onClick={() => setShowFilterPopover((prev) => !prev)}
                          className={`btn btn-sm flex items-center gap-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            paymentFilter !== 'semua' || angkatanFilter !== 'semua' || dateFilter !== 'semua'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-2xs'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <span>Filter Lanjutan</span>
                          {(paymentFilter !== 'semua' || angkatanFilter !== 'semua' || dateFilter !== 'semua') && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse ml-0.5" />
                          )}
                        </button>

                        {showFilterPopover && (
                          <div className="absolute right-0 top-full z-30 mt-2 w-[340px] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl space-y-3.5 animate-scale-in">
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">Filter Peserta Lanjutan</span>
                                {isFilterActive && (
                                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowFilterPopover(false)}
                                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                Tutup
                              </button>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status Pembayaran</label>
                              <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as any)}
                                className="form-input text-xs py-1.5 w-full rounded-lg border-slate-200"
                              >
                                <option value="semua">Semua Pembayaran</option>
                                <option value="belum_bayar">Belum Bayar</option>
                                <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
                                <option value="lunas">Lunas</option>
                                <option value="cicilan_sebagian">Sebagian</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Angkatan</label>
                              <select
                                value={angkatanFilter}
                                onChange={(e) => setAngkatanFilter(e.target.value)}
                                className="form-input text-xs py-1.5 w-full rounded-lg border-slate-200"
                              >
                                <option value="semua">Semua Angkatan</option>
                                {angkatanList.map((angkatan) => (
                                  <option key={angkatan.id} value={angkatan.id}>{angkatan.nama_angkatan}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rentang Waktu Pendaftaran</label>
                              <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as any)}
                                className="form-input text-xs py-1.5 w-full rounded-lg border-slate-200"
                              >
                                <option value="semua">Semua Tanggal</option>
                                <option value="7">7 Hari Terakhir</option>
                                <option value="30">30 Hari Terakhir</option>
                                <option value="90">90 Hari Terakhir</option>
                                <option value="custom">Rentang Tanggal Kustom</option>
                              </select>

                              {dateFilter === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 pt-1.5">
                                  <div>
                                    <label className="text-[9px] font-medium text-slate-500">Dari Tanggal</label>
                                    <input
                                      type="date"
                                      value={startDate}
                                      onChange={(e) => setStartDate(e.target.value)}
                                      className="form-input text-[11px] py-1 px-2 w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-medium text-slate-500">Sampai Tanggal</label>
                                    <input
                                      type="date"
                                      value={endDate}
                                      onChange={(e) => setEndDate(e.target.value)}
                                      className="form-input text-[11px] py-1 px-2 w-full"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={resetParticipantFilter}
                                disabled={!isFilterActive}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                  <path d="M3 3v5h5" />
                                </svg>
                                Reset Filter
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowFilterPopover(false)}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all"
                              >
                                Terapkan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tombol Reset Filter Utama jika ada filter aktif */}
                      {isFilterActive && (
                        <button
                          type="button"
                          onClick={resetParticipantFilter}
                          className="btn btn-sm flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-all shadow-2xs"
                          title="Reset semua pencarian & filter"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                          </svg>
                          <span>Reset Filter</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowManualModal(true)}
                        className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Tambah Peserta</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {(
                      [
                        { key: 'semua', label: 'Semua' },
                        { key: 'menunggu', label: 'Menunggu' },
                        { key: 'diterima', label: 'Diterima' },
                        { key: 'ditolak', label: 'Ditolak' },
                        { key: 'lulus', label: 'Lulus' },
                        { key: 'sudah_bekerja', label: 'Sudah Bekerja' },
                        { key: 'keluar', label: 'Keluar' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={`px-3.5 py-1 text-xs font-semibold rounded-full border transition-all ${
                          filter === t.key
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {t.label}
                        <span className="ml-1 text-[11px] opacity-75">
                          ({t.key === 'semua' ? stats.total : stats[t.key]})
                        </span>
                      </button>
                    ))}
                  </div>

                  <AdminPendaftarTable
                    data={searchedPendaftarList}
                    onViewDetail={(p) => openDetail(p, 'semua')}
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
                  <p className="text-xs text-[var(--text-secondary)]">Daftar bukti pembayaran yang dikirim peserta untuk diperiksa (terima, tolak, atau lunaskan)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowManualPayment(true)}
                    className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                    title="Catat pembayaran yang diterima langsung (cash/transfer offline)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Catat Manual
                  </button>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(
                      [
                        { key: 'semua', label: 'Semua' },
                        { key: 'cash', label: 'Cash' },
                        { key: 'transfer', label: 'Transfer' },
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
                if (filterPaymentType === 'cash') return p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi' && payment.tipe_pembayaran === 'cash');
                if (filterPaymentType === 'transfer') return p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi' && payment.tipe_pembayaran === 'transfer');
                return true;
              }).length === 0 ? (
                <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                  Tidak ada pembayaran yang sesuai filter saat ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[var(--card-border)]">
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] w-8">#</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Peserta</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Program</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Jenis Bayar</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Nominal</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Tanggal</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Bukti</th>
                        <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Status</th>
                        <th className="text-center px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {(() => {
                        const filteredPayments = pendingPaymentList.filter((p) => {
                          if (filterPaymentType === 'cash') return p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi' && payment.tipe_pembayaran === 'cash');
                          if (filterPaymentType === 'transfer') return p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi' && payment.tipe_pembayaran === 'transfer');
                          return true;
                        });
                        return filteredPayments.slice((pembayaranPage - 1) * PAGE_SIZE, pembayaranPage * PAGE_SIZE)
                        .map((p, rowIdx) => {
                          const totalBiaya = p.program?.harga || p.biaya_pelatihan || 0;
                          const sisaTagihan = Number(p.tagihan?.nominal ?? totalBiaya);
                          const pendingList = (p.tagihan?.pembayarans || [])
                            .filter((payment) => payment.status === 'menunggu_verifikasi')
                            .filter((payment) => filterPaymentType === 'semua' || payment.tipe_pembayaran === filterPaymentType)
                            .sort((a, b) => new Date(b.tanggal_bayar).getTime() - new Date(a.tanggal_bayar).getTime());
                          if (pendingList.length === 0) return null;

                          // Satu baris per pembayaran menunggu (tanpa skema cicilan termin)
                          return (
                              <>
                                {pendingList.map((payment) => (
                                  <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 font-mono text-[var(--text-tertiary)]">{rowIdx + 1}</td>
                                    <td className="px-4 py-3">
                                      <div className="font-bold text-[var(--text-primary)]">{p.nama_lengkap}</div>
                                      <div className="text-[10px] font-mono text-[var(--primary)]">{p.no_pendaftaran}</div>
                                      <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Sisa: Rp {sisaTagihan.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">{p.jenis_pelatihan}</td>
                                    <td className="px-4 py-3">
                                      <span className="badge badge-pending text-[10px]">{payment.tipe_pembayaran === 'cash' ? 'Cash' : 'Transfer'}</span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-[var(--text-primary)] font-mono whitespace-nowrap">
                                      Rp {Number(payment.nominal).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                                      {payment.tanggal_bayar ? new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                      {(payment.nama_pengirim || payment.nama_penerima || payment.metode_pembayaran) && (
                                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                                          {payment.tipe_pembayaran === 'transfer'
                                            ? `${payment.nama_pengirim || '-'} (${payment.jenis_pengirim || '-'})`
                                            : payment.nama_penerima || payment.metode_pembayaran}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {payment.bukti_pembayaran ? (
                                        <img
                                          src={payment.bukti_pembayaran}
                                          alt="Bukti"
                                          className="w-12 h-12 rounded-lg object-cover border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition shadow-sm"
                                          onClick={() => openDetail(p, 'semua')}
                                          title="Lihat bukti transfer"
                                        />
                                      ) : (
                                        <span className="text-[var(--text-tertiary)] italic">Tidak ada</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                                        Menunggu Validasi
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                        <button
                                          onClick={() => setSelectedPaymentDetail({ pendaftar: p, pembayaran: payment })}
                                          className="btn btn-outline btn-sm text-[10px] py-1 px-2 whitespace-nowrap"
                                          title="Lihat detail"
                                        >
                                          Detail
                                        </button>
                                        <button
                                          onClick={async () => { await pembayaranApi.verifikasiTransaksi(payment.id, false); loadData(); }}
                                          className="btn btn-accent btn-sm text-[10px] py-1 px-2 flex items-center gap-1 whitespace-nowrap"
                                          title="Terima pembayaran, sisa tagihan berkurang"
                                        >
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                          Validasi
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!window.confirm(`Validasi Rp ${Number(payment.nominal).toLocaleString('id-ID')} sekaligus LUNASKAN sisa tagihan ${p.nama_lengkap}?`)) return;
                                            await pembayaranApi.verifikasiTransaksi(payment.id, true);
                                            loadData();
                                          }}
                                          className="btn btn-sm text-[10px] py-1 px-2 flex items-center gap-1 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
                                          title="Terima pembayaran dan tandai tagihan lunas"
                                        >
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                          Validasi & Lunas
                                        </button>
                                        <button
                                          onClick={async () => {
                                            const catatan = window.prompt('Alasan penolakan (opsional):');
                                            if (catatan === null) return;
                                            await pembayaranApi.tolakTransaksi(payment.id, catatan || undefined);
                                            loadData();
                                          }}
                                          className="btn btn-danger btn-sm text-[10px] py-1 px-2 whitespace-nowrap"
                                          title="Tolak pembayaran"
                                        >
                                          Tolak
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </>
                            );
                          });

                      })()}
                    </tbody>
                  </table>
                  <Pagination currentPage={pembayaranPage} totalItems={pendingPaymentList.filter((p) => { if (filterPaymentType === 'cash') return p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi' && payment.tipe_pembayaran === 'cash'); if (filterPaymentType === 'transfer') return p.tagihan?.pembayarans?.some((payment) => payment.status === 'menunggu_verifikasi' && payment.tipe_pembayaran === 'transfer'); return true; }).length} pageSize={PAGE_SIZE} onPageChange={setPembayaranPage} />
                </div>
              )}
            </div>
          )}

          {/* TAB: KELOLA PROGRAM */}
          {activeTab === 'kelola_program' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <PelatihanManager initialProgramList={programList} />
            </div>
          )}

          {/* TAB: KELOLA PELATIHAN (overview anak menu) */}
          {activeTab === 'kelola_pelatihan' && (
            <div className="glass-card-static p-6 animate-fade-in space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Kelola Pelatihan</h2>
                <p className="text-xs text-[var(--text-secondary)]">Pilih alur kerja akademik: angkatan, kelas, jadwal sesi, atau penilaian.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { id: 'kelola_angkatan' as AdminTab, title: 'Kelola Angkatan', desc: 'Buat dan atur angkatan pelatihan per program.', count: `${angkatanList.length} angkatan`, color: 'bg-indigo-600' },
                  { id: 'kelola_kelas' as AdminTab, title: 'Kelola Kelas', desc: 'Daftar kelas (angkatan + tempat). Klik kelas untuk melihat peserta.', count: `${groupJadwalToKelas(jadwalList, angkatanList, props.initialTempatList || []).length} kelas`, color: 'bg-emerald-600' },
                  { id: 'kelola_jadwal' as AdminTab, title: 'Kelola Jadwal', desc: 'Pilih kelas, lalu susun sesi hari 1–10.', count: `${jadwalList.length} sesi`, color: 'bg-blue-600' },
                  { id: 'kelola_penilaian' as AdminTab, title: 'Kelola Penilaian', desc: 'Pilih kelas untuk mengisi nilai peserta.', count: `${pendaftarList.filter((p) => p.status === 'diterima').length} peserta aktif`, color: 'bg-amber-500' },
                ]).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveTab(c.id)}
                    className="text-left p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${c.color} text-white flex items-center justify-center font-extrabold text-xs mb-3`}>
                      {c.count.split(' ')[0]}
                    </div>
                    <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-700">{c.title} →</div>
                    <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
                    <div className="text-[11px] font-bold text-slate-400 mt-2 font-mono">{c.count}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB: KELOLA ANGKATAN */}
          {activeTab === 'kelola_angkatan' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <AngkatanManager
                initialAngkatanList={angkatanList}
                initialPendaftarList={pendaftarList}
                initialProgramList={programList}
              />
            </div>
          )}

          {/* TAB: KELOLA KELAS (angkatan + tempat → peserta) */}
          {activeTab === 'kelola_kelas' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <JadwalManager
                mode="kelas"
                initialAngkatanList={angkatanList}
                initialPendaftarList={pendaftarList}
                initialJadwalList={jadwalList}
                initialTempatList={props.initialTempatList || []}
                initialInstrukturList={instrukturList}
              />
            </div>
          )}

          {/* TAB: KELOLA TEMPAT */}
          {activeTab === 'kelola_tempat' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <TempatManager initialTempatList={props.initialTempatList || []} />
            </div>
          )}

          {/* TAB: KELOLA INSTRUKTUR */}
          {activeTab === 'kelola_instruktur' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <InstrukturManager initialInstrukturList={instrukturList} />
            </div>
          )}

          {/* TAB: KELOLA JADWAL (kelas → sesi hari 1-10) */}
          {activeTab === 'kelola_jadwal' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <JadwalManager
                mode="jadwal"
                initialAngkatanList={angkatanList}
                initialPendaftarList={pendaftarList}
                initialJadwalList={jadwalList}
                initialTempatList={props.initialTempatList || []}
                initialInstrukturList={instrukturList}
              />
            </div>
          )}

          {/* TAB: KELOLA PENILAIAN (kelas → peserta → isi nilai) */}
          {activeTab === 'kelola_penilaian' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <JadwalManager
                mode="penilaian"
                initialAngkatanList={angkatanList}
                initialPendaftarList={pendaftarList}
                initialJadwalList={jadwalList}
                initialTempatList={props.initialTempatList || []}
                initialInstrukturList={instrukturList}
              />
            </div>
          )}

          {/* TAB 6: KELOLA METODE PEMBAYARAN */}
          {activeTab === 'kelola_metode_pembayaran' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <PaymentMethodManager initialPaymentMethods={props.initialPaymentMethods || []} />
            </div>
          )}

          {/* TAB HISTORI PEMBAYARAN */}
          {activeTab === 'histori_pembayaran' && (
            <HistoriPembayaran />
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

              {/* Histori Pengerjaan Peserta — croschek jawaban pretest/posttest */}
              <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">Histori Pengerjaan Peserta (Croschek Jawaban)</h3>
                  <p className="text-xs text-indigo-800/70 mt-0.5">
                    Pilih peserta untuk melihat seluruh percobaan pretest/posttest beserta rincian jawaban per soal
                    (jawaban peserta vs kunci) — untuk verifikasi ulang kesesuaian nilai.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={historiSearch}
                    onChange={(e) => setHistoriSearch(e.target.value)}
                    placeholder="Cari nama / no. pendaftaran..."
                    className="form-input text-xs bg-white"
                  />
                  <select
                    value={historiPesertaId}
                    onChange={(e) => setHistoriPesertaId(e.target.value)}
                    className="form-input text-xs font-semibold bg-white"
                  >
                    <option value="">— Pilih peserta —</option>
                    {pendaftarList
                      .filter((p) => {
                        if (!historiSearch.trim()) return true;
                        const q = historiSearch.trim().toLowerCase();
                        return (
                          p.nama_lengkap.toLowerCase().includes(q) ||
                          (p.no_pendaftaran || '').toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 100)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama_lengkap} • {p.no_pendaftaran}
                        </option>
                      ))}
                  </select>
                </div>
                {historiPesertaId ? (
                  (() => {
                    const hp = pendaftarList.find((p) => p.id === historiPesertaId);
                    return (
                      <div className="rounded-xl bg-white border border-indigo-100 p-4">
                        <RiwayatUjianPanel
                          key={historiPesertaId}
                          pendaftarId={historiPesertaId}
                          pendaftarNama={hp ? `${hp.nama_lengkap} (${hp.no_pendaftaran})` : undefined}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[11px] text-indigo-800/60 italic">
                    Belum ada peserta dipilih. Percobaan lama (sebelum fitur ini aktif) hanya menampilkan nilai
                    agregat tanpa rincian per soal.
                  </p>
                )}
              </div>

              {/* Filter Tipe + Status Soal */}
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
                <span className="text-xs text-slate-500 font-semibold ml-3 mr-1">Status:</span>
                {(['semua', 'aktif', 'nonaktif'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterSoalStatus(t)}
                    className={`btn btn-sm text-xs capitalize ${filterSoalStatus === t ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Grid Soal */}
              <div className="space-y-4">
                {(() => {
                  const filteredSoal = soalList.filter((s) => {
                    if (filterSoalTipe !== 'semua' && s.tipe !== filterSoalTipe) return false;
                    const aktif = s.is_active ?? true;
                    if (filterSoalStatus === 'aktif' && !aktif) return false;
                    if (filterSoalStatus === 'nonaktif' && aktif) return false;
                    return true;
                  });
                  const paginatedSoal = filteredSoal.slice((soalPage - 1) * PAGE_SIZE, soalPage * PAGE_SIZE);
                  return paginatedSoal.map((soal, idx) => {
                    const soalAktif = soal.is_active ?? true;
                    return (
                    <div
                      key={soal.id}
                      className={`p-4 rounded-xl bg-[var(--surface)] border space-y-3 ${soalAktif ? 'border-[var(--card-border)]' : 'border-slate-300 opacity-75'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${soal.tipe === 'pretest' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                              {soal.tipe}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${soalAktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-300'}`}>
                              {soalAktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                            <span className="text-xs font-semibold text-[var(--text-tertiary)] font-mono">
                              Program: {soal.jenis_pelatihan}
                            </span>
                            {soal.gambar_soal && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                Ada Gambar
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">
                            {idx + 1}. {soal.pertanyaan}
                          </h4>
                          {!soalAktif && (
                            <p className="text-[11px] text-slate-500 italic">Soal nonaktif — tidak muncul pada ujian peserta.</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {soal.gambar_soal && (
                            <img
                              src={soal.gambar_soal}
                              alt="Thumbnail Soal"
                              className="w-12 h-12 rounded-lg object-cover border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition"
                              onClick={() => window.open(soal.gambar_soal!, '_blank')}
                              title="Lihat gambar soal"
                            />
                          )}
                          <button
                            onClick={() => handleToggleSoalStatus(soal)}
                            className={`btn btn-sm text-xs py-1 ${soalAktif ? 'btn-outline' : 'btn-primary'}`}
                            title={soalAktif ? 'Nonaktifkan soal' : 'Aktifkan soal'}
                          >
                            {soalAktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
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
                    );
                  });
                })()}
                <Pagination currentPage={soalPage} totalItems={soalList.filter((s) => {
                  if (filterSoalTipe !== 'semua' && s.tipe !== filterSoalTipe) return false;
                  const aktif = s.is_active ?? true;
                  if (filterSoalStatus === 'aktif' && !aktif) return false;
                  if (filterSoalStatus === 'nonaktif' && aktif) return false;
                  return true;
                }).length} pageSize={PAGE_SIZE} onPageChange={setSoalPage} />
              </div>
            </div>
          )}

          {/* TAB 10: KELOLA KELULUSAN & SERTIFIKAT */}
          {activeTab === 'kelola_kelulusan' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <GraduationManager />
            </div>
          )}

           {/* TAB 11: MATA PELATIHAN */}
          {activeTab === 'mata_pelajaran' && (
            <div className="glass-card-static p-6 animate-fade-in">
              <MataPelatihanManager angkatanList={angkatanList} programList={programList} />
            </div>
          )}
            </>
          )}
        </main>
      </div>



      {/* Modal Buat / Edit Jadwal Baru */}
      {showAddJadwalModal && (
        <div className="modal-overlay" onClick={() => { if (!isSavingJadwal) { setShowAddJadwalModal(false); setEditingJadwal(null); } }}>
          <div className="modal-content relative max-w-lg p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isSavingJadwal && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
              </div>
            )}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingJadwal ? 'Edit Jadwal Pelatihan' : 'Buat Jadwal Pelatihan Baru'}
              </h3>
              <button
                type="button"
                disabled={isSavingJadwal}
                onClick={() => { setShowAddJadwalModal(false); setEditingJadwal(null); }}
                className="text-slate-400 hover:text-black disabled:opacity-40"
              >
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
                    {programList.map((p) => (
                      <option key={p.id} value={p.nama}>{p.nama}</option>
                    ))}
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
                  {(props.initialTempatList || tempatList).map((t) => {
                    const fullLabel = `${t.nama_tempat} (${t.alamat_lengkap})`;
                    return (
                      <option key={t.id} value={fullLabel}>
                        {t.nama_tempat}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="form-label">Pengajar / Instruktur Sesi</label>
                <InstrukturSearchSelect
                  value={jPengajar}
                  onChange={setJPengajar}
                  instrukturList={instrukturList}
                  placeholder="Ketik untuk cari instruktur..."
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Ketik untuk mencari, pilih dari daftar, atau isi nama manual.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={isSavingJadwal}
                  onClick={() => { setShowAddJadwalModal(false); setEditingJadwal(null); }}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingJadwal}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSavingJadwal && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isSavingJadwal
                    ? (editingJadwal ? 'Memperbarui...' : 'Menyimpan...')
                    : (editingJadwal ? 'Simpan Perubahan Jadwal' : 'Simpan Jadwal Baru')}
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
                    programList.some((pr) => pr.nama === p.jenis_pelatihan && pr.nama === selectedJadwalForPlotting.jenis_pelatihan)
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
                  programList.some((pr) => pr.nama === p.jenis_pelatihan && pr.nama === selectedJadwalForPlotting.jenis_pelatihan)
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
        <div className="modal-overlay" onClick={() => { if (!isSavingSoal) setShowAddSoalModal(false); }}>
          <div className="modal-content relative max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isSavingSoal && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
              </div>
            )}
            <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] text-base">
                {editingSoal ? 'Edit Soal Ujian' : 'Tambah Soal Ujian Baru'}
              </h3>
              <button
                type="button"
                disabled={isSavingSoal}
                onClick={() => setShowAddSoalModal(false)}
                className="text-[var(--text-tertiary)] hover:text-black disabled:opacity-40"
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
                <textarea className="form-input min-h-[70px]" placeholder="Tuliskan pertanyaan soal..." value={sPertanyaan} onChange={(e) => setSPertanyaan(e.target.value)} required />
              </div>

              {/* Image Upload for Soal */}
              <div>
                <label className="form-label">Gambar Soal <span className="text-[var(--text-tertiary)] font-normal">(opsional)</span></label>
                <div
                  className="mt-1 relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--input-border)] rounded-xl bg-[var(--surface)] text-center cursor-pointer hover:bg-[var(--card-bg)] transition-colors"
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
                      <img src={sGambarPreview} alt="Preview Gambar Soal" className="max-h-36 mx-auto rounded-lg shadow-sm border border-[var(--card-border)] object-contain" />
                      <p className="text-xs text-[var(--accent)] font-semibold">Klik untuk ganti gambar</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none">
                      <svg className="w-8 h-8 mx-auto text-[var(--text-tertiary)] mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Klik untuk upload gambar soal</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">PNG, JPG, JPEG (Maks. 5 MB)</p>
                    </div>
                  )}
                </div>
                {sGambarPreview && (
                  <button
                    type="button"
                    onClick={() => { setSGambarFile(null); setSGambarPreview(null); }}
                    className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

              <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Status Soal</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
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
                  onClick={() => setShowAddSoalModal(false)}
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

      {/* MODAL PENDAFTARAN PESERTA MANUAL */}
      <ManualRegisterModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={async () => {
          showSuccess('add', 'Peserta Berhasil Didaftarkan!', 'Data peserta baru telah masuk ke sistem.');
          await loadData();
        }}
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



