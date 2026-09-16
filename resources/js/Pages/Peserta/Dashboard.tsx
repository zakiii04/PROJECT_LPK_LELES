'use client';

import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import PesertaPembayaranModal from '@/Components/PesertaPembayaranModal';
import CalendarView from '@/Components/CalendarView';
import CertificateView from '@/Components/CertificateView';
import { pendaftarApi, ujianApi } from '@/lib/api';
import { getToken } from '@/lib/axios';
import {
  getStatusPembayaranBadgeClass,
  getStatusPembayaranLabel,
} from '@/lib/storage';
import type { Pendaftar, Cicilan, Kelulusan, JadwalPelatihan, HasilUjian, SoalUjian } from '@/lib/types';

function getCicilanSummary(pendaftar: Pendaftar) {
  const cicilan = pendaftar.cicilan || [];
  const totalDibayar = cicilan.filter(c => c.status === 'lunas').reduce((sum, c) => sum + c.jumlah, 0);
  const terminLunas = cicilan.filter(c => c.status === 'lunas').length;
  const terminTotal = cicilan.length;
  const totalBiaya = pendaftar.program?.harga || pendaftar.biaya_pelatihan || 0;
  const sisaPembayaran = Math.max(0, totalBiaya - totalDibayar);
  const progressPersen = totalBiaya > 0 ? (totalDibayar / totalBiaya) * 100 : 0;

  return {
    totalDibayar, terminLunas, terminTotal, sisaPembayaran, progressPersen
  };
}

type PesertaTab = 'pembayaran' | 'profile_peserta' | 'jadwal' | 'ujian' | 'rincian_program' | 'kelulusan';

interface PesertaDashboardProps {
  initialPendaftar?: Pendaftar | null;
  initialJadwalList?: JadwalPelatihan[];
  initialHasilUjianList?: HasilUjian[];
  initialKelulusanRecord?: Kelulusan | null;
}

export default function PesertaDashboardPage(props: PesertaDashboardProps) {
  const [activeTab, setActiveTab] = useState<PesertaTab>('pembayaran');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(props.initialPendaftar || null);
  const [kelulusanRecord, setKelulusanRecord] = useState<Kelulusan | null>(props.initialKelulusanRecord || null);
  const [isLoading, setIsLoading] = useState(!props.initialPendaftar);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Jadwal & Ujian State
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>(props.initialJadwalList || []);
  const [jadwalViewMode, setJadwalViewMode] = useState<'list' | 'calendar'>('calendar');
  const [hasilUjianList, setHasilUjianList] = useState<HasilUjian[]>(props.initialHasilUjianList || []);
  const [examViewMode, setExamViewMode] = useState<'pretest' | 'posttest'>('pretest');
  const [activeExamType, setActiveExamType] = useState<'pretest' | 'posttest' | null>(null);

  const loadPesertaData = useCallback(async () => {
    const rawSession = sessionStorage.getItem('lpk_peserta_session');
    const token = getToken();

    if (!rawSession || !token) {
      sessionStorage.removeItem('lpk_peserta_session');
      router.visit('/peserta/login');
      return;
    }

    try {
      const res = await pendaftarApi.me();
      const data = res.data;
      if (!data) {
        sessionStorage.removeItem('lpk_peserta_session');
        router.visit('/peserta/login');
        return;
      }
      setPendaftar(data);

      const resJadwal = await pendaftarApi.meJadwal();
      if (resJadwal.success && resJadwal.data) setJadwalList(resJadwal.data);

      const resUjian = await pendaftarApi.meUjian();
      if (resUjian.success && resUjian.data) setHasilUjianList(resUjian.data);

      const resKelulusan = await pendaftarApi.meKelulusan();
      if (resKelulusan.success && resKelulusan.data) setKelulusanRecord(resKelulusan.data);
    } catch {
      router.visit('/peserta/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (props.initialPendaftar) {
      setPendaftar(props.initialPendaftar);
      if (props.initialJadwalList) {
        setJadwalList(props.initialJadwalList);
      }
      setIsLoading(false);
    } else {
      loadPesertaData();
    }
  }, [props.initialPendaftar, props.initialJadwalList, loadPesertaData]);

  const handleLogout = () => {
    sessionStorage.removeItem('lpk_peserta_session');
    router.visit('/peserta/login');
  };

  const openExamModal = (tipe: 'pretest' | 'posttest') => {
    if (!pendaftar?.program_id && !pendaftar?.jenis_pelatihan) {
      return;
    }
    const attempts = hasilUjianList.filter((h) => h.tipe === tipe).length;
    if (attempts >= 3) {
      alert(`Batas maksimal pengerjaan ulang (3 kali) untuk ujian ${tipe.toUpperCase()} telah tercapai.`);
      return;
    }
    router.visit(`/peserta/ujian?tipe=${tipe}`);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!pendaftar) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Sesi Peserta Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Silakan login kembali untuk mengakses portal peserta.</p>
          <button
            onClick={() => router.visit('/peserta/login')}
            className="btn btn-primary btn-sm w-full"
          >
            Menuju Halaman Login
          </button>
        </div>
      </div>
    );
  }

  const program = pendaftar.program;
  const totalBiayaPelatihan = program?.harga || pendaftar.biaya_pelatihan || 0;
  const totalHargaFormatted =
    program?.harga_formatted ||
    (totalBiayaPelatihan > 0 ? `Rp ${totalBiayaPelatihan.toLocaleString('id-ID')}` : 'Rp 0');
  const tagihanNominal = Number(pendaftar.tagihan?.nominal || totalBiayaPelatihan);
  const pembayaranBaru = pendaftar.tagihan?.pembayarans || [];
  const pembayaranDiterima = pembayaranBaru.filter((payment) => payment.status === 'diterima');
  const pembayaranMenunggu = pembayaranBaru.filter((payment) => payment.status === 'menunggu_verifikasi');
  const totalDibayarBaru = pembayaranDiterima.reduce((sum, payment) => sum + Number(payment.nominal || 0), 0);
  const sisaTagihanBaru = Math.max(0, tagihanNominal - totalDibayarBaru);
  const statusTagihanBaru = pendaftar.tagihan?.status === 'lunas' || sisaTagihanBaru <= 0 ? 'lunas' : 'belum_lunas';
  const progressTagihanBaru = tagihanNominal > 0 ? Math.min(100, (totalDibayarBaru / tagihanNominal) * 100) : 0;
  const filteredJadwal = jadwalList.filter((j) => {
    // 1. Jadwal harus sesuai dengan angkatan peserta saat ini (mencegah jadwal angkatan lama tampil)
    if (pendaftar.angkatan_id && j.angkatan_id && j.angkatan_id !== pendaftar.angkatan_id) {
      return false;
    }
    // 2. Jika jadwal memiliki relasi peserta termuat, pastikan peserta masih terdaftar (jika dikeluarkan admin, ikut hilang)
    if (j.peserta && Array.isArray(j.peserta) && j.peserta.length > 0) {
      const isEnrolled = j.peserta.some((p) =>
        typeof p === 'string' ? p === pendaftar.id : p.id === pendaftar.id
      );
      if (!isEnrolled) {
        return false;
      }
    }
    return true;
  });

  const pretestList = hasilUjianList.filter((h) => h.tipe === 'pretest');
  const posttestList = hasilUjianList.filter((h) => h.tipe === 'posttest');

  // Nilai Tertinggi (Best score wins)
  const pretestHasil = pretestList.length > 0
    ? [...pretestList].sort((a, b) => b.nilai - a.nilai)[0]
    : undefined;

  const posttestHasil = posttestList.length > 0
    ? [...posttestList].sort((a, b) => b.nilai - a.nilai)[0]
    : undefined;

  const pretestAttempts = pretestList.length;
  const posttestAttempts = posttestList.length;

  const isUnverified = pendaftar.status !== 'diterima';

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col lg:flex-row text-[var(--text-primary)]">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Exact Admin Dashboard Size & Structure */}
      <aside className={`admin-sidebar w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm overflow-y-auto ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="space-y-4">
          {/* Brand Header inside Sidebar matching Admin */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-extrabold flex items-center justify-center text-xs shadow-md">
                LPK
              </div>
              <div>
                <div className="font-bold text-sm text-[var(--text-primary)] leading-tight">LPK Alkautsar</div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-medium">Portal Peserta</div>
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

          {/* Navigation Items matching Admin section titles */}
          <div className="space-y-1">
            <div>
              <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 mt-3">
                <span>UTAMA</span>
                <span className="text-slate-300 font-normal">+</span>
              </div>
              <button
                onClick={() => { setActiveTab('pembayaran'); setSidebarOpen(false); }}
                className={`sidebar-link ${activeTab === 'pembayaran' ? 'active' : ''}`}
              >
                <div className="icon-box shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <span className="flex-1 text-xs">Pembayaran</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pendaftar.status_pembayaran === 'lunas' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {pendaftar.status_pembayaran === 'lunas' ? 'LUNAS' : 'ACTION'}
                </span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 mt-3">
                <span>AKADEMIK & EVALUASI</span>
                <span className="text-slate-300 font-normal">+</span>
              </div>
              <div className="space-y-1">
                {[
                  {
                    id: 'profile_peserta',
                    label: 'Profile Peserta',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ),
                    badge: null,
                  },
                  {
                    id: 'jadwal',
                    label: 'Jadwal Pelatihan',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    ),
                    badge: isUnverified ? 'TERKUNCI' : filteredJadwal.length,
                    badgeColor: isUnverified ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-slate-200 text-slate-700',
                    isLocked: isUnverified,
                  },
                  {
                    id: 'ujian',
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
                    badge: isUnverified ? 'TERKUNCI' : (pretestHasil && posttestHasil ? 'SELESAI' : 'UJIAN'),
                    badgeColor: isUnverified ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : (pretestHasil && posttestHasil ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'),
                    isLocked: isUnverified,
                  },
                  {
                    id: 'rincian_program',
                    label: 'Rincian Program',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 12 3 12 0v-5" />
                      </svg>
                    ),
                    badge: null,
                    isLocked: false,
                  },
                  {
                    id: 'kelulusan',
                    label: 'Kelulusan & Sertifikat',
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    ),
                    badge: isUnverified ? 'TERKUNCI' : (kelulusanRecord?.status_kelulusan === 'Lulus' ? 'SERTIFIKAT' : null),
                    badgeColor: isUnverified ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-amber-500 text-white',
                    isLocked: isUnverified,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as PesertaTab);
                      setSidebarOpen(false);
                    }}
                    className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                  >
                    <div className="icon-box shrink-0">{item.icon}</div>
                    <span className="flex-1 text-left flex items-center gap-1.5 text-xs">
                      {item.label}
                      {item.isLocked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </span>
                    {item.badge !== null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Info & Logout matching Admin */}
        <div className="pt-4 border-t border-slate-100">
          <div className="px-2 mb-3">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{pendaftar.nama_lengkap}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] truncate">{pendaftar.no_pendaftaran}</div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <div className="icon-box shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="text-xs">Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar matching Admin Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500">
              <span className="font-extrabold text-[var(--primary)]">LPK Alkautsar</span>
              <span>|</span>
              <span className="text-slate-800 capitalize font-bold">
                {activeTab === 'pembayaran' ? 'Dasbor Pembayaran' : activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 space-y-6">
          {/* Top Unverified Banner */}
          {pendaftar.status === 'menunggu' && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs text-amber-950 flex items-start gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1 text-xs sm:text-sm space-y-1">
                <div className="font-extrabold text-amber-950 text-base flex items-center gap-2 flex-wrap">
                  <span>Pendaftaran Anda Masih Menunggu Verifikasi Admin</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Status: Menunggu Validasi
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Akun Anda sudah aktif. Namun, menu <strong>Jadwal Pelatihan</strong>, <strong>Pretest/Posttest</strong>, serta <strong>Kelulusan & Sertifikat</strong> masih <strong>terkunci (🔒)</strong> sampai data fisik dan berkas Anda divalidasi oleh Admin LPK Alkautsar. Silakan datang ke kantor LPK untuk cek ulang fisik & verifikasi dokumen.
                </p>
              </div>
            </div>
          )}

          {/* Welcome Banner Card - Clean Light Theme, rendered ONLY on first tab (Pembayaran) */}
          {activeTab === 'pembayaran' && (
            <div className="glass-card-static p-6 md:p-8 border border-slate-200 shadow-xs bg-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                  Selamat Datang
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {pendaftar.nama_lengkap}
                </h1>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">
                  Peserta Program Pelatihan {program?.nama || pendaftar.jenis_pelatihan} | LPK Alkautsar
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                  No: {pendaftar.no_pendaftaran}
                </span>
                <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${pendaftar.status === 'diterima' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : pendaftar.status === 'ditolak' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                  Status: {pendaftar.status === 'diterima' ? 'Diterima' : pendaftar.status === 'ditolak' ? 'Ditolak' : 'Menunggu Verifikasi'}
                </span>
              </div>
            </div>
          )}
          {/* TAB 1: PEMBAYARAN */}
          {activeTab === 'pembayaran' && (
            <div className="glass-card-static p-6 md:p-8 animate-fade-in space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                  Status & Pembayaran Pelatihan
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Lakukan pembayaran biaya pendaftaran untuk mengaktifkan sesi kelas pelatihan Anda
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--surface)]">
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Program Pelatihan</div>
                  <div className="font-bold text-[var(--text-primary)] text-base">{program?.nama || pendaftar.jenis_pelatihan}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">Durasi: {program?.durasi}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Total Biaya Pelatihan</div>
                  <div className="font-extrabold text-[var(--primary)] text-xl">{totalHargaFormatted}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">Status: {getStatusPembayaranLabel(pendaftar.status_pembayaran)}</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[var(--card-border)] space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs text-slate-500">Status Tagihan</div>
                    <div className={`text-lg font-extrabold ${statusTagihanBaru === 'lunas' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {statusTagihanBaru === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Sisa Tagihan</div>
                    <div className="text-xl font-extrabold text-indigo-600">Rp {sisaTagihanBaru.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>Terbayar Rp {totalDibayarBaru.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                    <span>{Math.round(progressTagihanBaru)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressTagihanBaru}%` }} />
                  </div>
                </div>
                {pembayaranMenunggu.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    {pembayaranMenunggu.length} pembayaran sedang menunggu validasi admin.
                  </div>
                )}
                {statusTagihanBaru !== 'lunas' && (
                  <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary btn-md w-full font-bold">
                    Bayar Tagihan / Cicilan
                  </button>
                )}
                {pembayaranBaru.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <div className="text-xs font-bold text-slate-700">Riwayat Pembayaran</div>
                    {pembayaranBaru.slice().reverse().map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-lg bg-slate-50">
                        <span className="font-semibold capitalize">{payment.tipe_pembayaran} • Rp {Number(payment.nominal).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                        <span className={payment.status === 'diterima' ? 'text-emerald-600' : payment.status === 'ditolak' ? 'text-red-600' : 'text-amber-600'}>
                          {payment.status === 'diterima' ? 'Diterima' : payment.status === 'ditolak' ? 'Ditolak' : 'Menunggu Validasi'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* If Belum Bayar */}
              {false && (!pendaftar.status_pembayaran || pendaftar.status_pembayaran === 'belum_bayar') && (
                <div className="p-6 rounded-2xl bg-[var(--primary-bg)] border border-[rgba(26,54,93,0.15)] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[var(--primary)] text-base mb-1">
                      Selesaikan Pembayaran Pelatihan
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md">
                      Pilih metode pembayaran: <span className="font-bold text-[var(--text-primary)]">Bayar Lunas</span> atau <span className="font-bold text-[var(--text-primary)]">Cicilan 3x</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="btn btn-primary btn-md flex-shrink-0 flex items-center gap-1.5 font-bold"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span>Bayar Sekarang</span>
                  </button>
                </div>
              )}

              {/* If Menunggu Konfirmasi (bayar lunas) */}
              {false && pendaftar.status_pembayaran === 'menunggu_konfirmasi' && (
                <div className="p-6 rounded-2xl bg-[var(--warning-bg)] border border-[rgba(221,107,32,0.2)] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-800 text-base">
                        Bukti Pembayaran Sedang Diverifikasi
                      </h3>                          <p className="text-xs text-amber-700">
                        Metode Pembayaran: <span className="font-bold">{pendaftar.metode_pembayaran || 'Transfer Bank'}</span> • Dikirim pada: {new Date(pendaftar.tanggal_bayar || '').toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  {pendaftar.bukti_pembayaran && (
                    <div className="pt-2">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1 font-semibold">Lampiran Bukti Transfer Anda:</p>
                      <img
                        src={pendaftar.bukti_pembayaran}
                        alt="Bukti Transfer"
                        className="max-h-48 rounded-lg border border-[var(--card-border)] bg-white p-1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* If Cicilan Sebagian — NEW */}
              {false && pendaftar.status_pembayaran === 'cicilan_sebagian' && (() => {
                const cicilanList: Cicilan[] = pendaftar.cicilan || [];
                const summary = getCicilanSummary(pendaftar);

                const getCicilanStatusIcon = (status: Cicilan['status']) => {
                  switch (status) {
                    case 'lunas': return 'OK';
                    case 'menunggu_konfirmasi': return 'WAIT';
                    case 'ditolak': return 'ERR';
                    default: return 'PAY';
                  }
                };

                const getCicilanStatusColor = (status: Cicilan['status']) => {
                  switch (status) {
                    case 'lunas': return 'bg-emerald-500 text-white border-emerald-500';
                    case 'menunggu_konfirmasi': return 'bg-amber-400 text-white border-amber-400';
                    case 'ditolak': return 'bg-red-500 text-white border-red-500';
                    default: return 'bg-white text-slate-400 border-slate-300';
                  }
                };

                const getCicilanStatusLabel = (status: Cicilan['status']) => {
                  switch (status) {
                    case 'lunas': return 'Lunas (Diverifikasi)';
                    case 'menunggu_konfirmasi': return 'Menunggu Konfirmasi Admin';
                    case 'ditolak': return 'Bukti Ditolak';
                    default: return 'Belum Dibayar';
                  }
                };

                const hasPayable = cicilanList.some(c => c.status === 'belum_bayar' || c.status === 'ditolak');

                return (
                  <div className="p-6 rounded-2xl bg-white border border-[var(--card-border)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <span className="badge badge-processing mb-1">Skema Cicilan 3x</span>
                        <h3 className="font-bold text-slate-800 text-lg">Status Pembayaran Angsuran</h3>
                        <p className="text-xs text-slate-500">
                          Terbayar {summary.terminLunas} dari {summary.terminTotal} termin • Total Terbayar: Rp {summary.totalDibayar.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right sm:text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Sisa Tagihan:</div>
                        <div className="text-xl font-extrabold text-indigo-600">Rp {summary.sisaPembayaran.toLocaleString('id-ID')}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${summary.progressPersen}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline 3 Termin */}
                    <div className="space-y-3 pt-2">
                      {cicilanList.map((c) => (
                        <div
                          key={c.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${c.status === 'menunggu_konfirmasi'
                            ? 'bg-amber-50/50 border-amber-200'
                            : c.status === 'lunas'
                              ? 'bg-emerald-50/30 border-emerald-200'
                              : c.status === 'ditolak'
                                ? 'bg-red-50/40 border-red-200'
                                : 'bg-slate-50/50 border-slate-200'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold border ${getCicilanStatusColor(c.status)}`}>
                              {getCicilanStatusIcon(c.status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-slate-800">Termin {c.termin}</h4>
                                <span className="text-[10px] font-bold text-slate-500 font-mono">
                                  ({getCicilanStatusLabel(c.status)})
                                </span>
                              </div>
                              <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                                <div>Nominal: <span className="font-bold text-[var(--text-primary)]">Rp {c.jumlah.toLocaleString('id-ID')}</span></div>
                                <div>Jatuh tempo: {new Date(c.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                {c.tanggal_bayar && (
                                  <div className="text-[10px]">Dibayar: {new Date(c.tanggal_bayar).toLocaleString('id-ID')}</div>
                                )}
                                {c.catatan_admin && (
                                  <div className="mt-1 p-2 rounded bg-red-50 text-red-700 text-[10px] border border-red-200">
                                    <span className="font-bold">Catatan Admin:</span> {c.catatan_admin}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasPayable && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="btn btn-primary btn-md w-full flex items-center justify-center gap-1.5 font-bold"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span>Bayar Cicilan Berikutnya</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* If Lunas */}
              {false && pendaftar.status_pembayaran === 'lunas' && (
                <div className="p-6 rounded-2xl bg-[var(--accent-bg)] border border-[rgba(43,108,176,0.2)] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-2xl">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg">
                          Pembayaran Lunas
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Pembayaran Anda telah dikonfirmasi oleh Admin. Anda resmi menjadi peserta pelatihan LPK!
                        </p>
                      </div>
                    </div>
                    <button onClick={() => window.print()} className="btn btn-outline btn-sm flex items-center gap-1.5 font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      <span>Cetak Kwitansi</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[var(--card-border)] text-xs space-y-2 font-mono">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-[var(--text-tertiary)]">No. Kwitansi</span>
                      <span className="font-bold text-[var(--primary)]">KW-{pendaftar.no_pendaftaran.replace('LPK-', '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Nama Peserta</span>
                      <span className="font-semibold">{pendaftar.nama_lengkap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Program Pelatihan</span>
                      <span className="font-semibold">{program?.nama || pendaftar.jenis_pelatihan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Jenis Pembayaran</span>
                      <span className="font-semibold">{pendaftar.jenis_pembayaran === 'cicilan' ? 'Cicilan 3x' : 'Lunas'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-tertiary)]">Metode Bayar</span>
                      <span>{pendaftar.metode_pembayaran || 'Transfer Bank'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-sm">
                      <span className="font-bold">TOTAL DIBAYAR</span>
                      <span className="font-bold text-emerald-600">{totalHargaFormatted}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE PESERTA */}
          {activeTab === 'profile_peserta' && (
            <div className="glass-card-static p-6 md:p-8 animate-fade-in space-y-6">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Profile Peserta</h2>
                <p className="text-xs text-[var(--text-secondary)]">Informasi lengkap data identitas dan fisik Anda yang terdaftar</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 rounded-full bg-[var(--primary)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Data Diri & Akun</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <ProfileItem label="Nama Lengkap" value={pendaftar.nama_lengkap} />
                  <ProfileItem label="Username" value={pendaftar.user?.email || '-'} />
                  <ProfileItem label="NIK" value={pendaftar.nik} />
                  <ProfileItem label="Tempat, Tanggal Lahir" value={`${pendaftar.tempat_lahir || '-'}, ${pendaftar.tanggal_lahir ? new Date(pendaftar.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`} />
                  <ProfileItem label="Alamat Lengkap" value={pendaftar.alamat} />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <div className="w-1.5 h-4 rounded-full bg-[var(--accent)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Data Fisik & Kontak</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <ProfileItem label="Tinggi / Berat Badan" value={`${pendaftar.tinggi_badan} cm / ${pendaftar.berat_badan} kg`} />
                  <ProfileItem label="Lingkar Pinggang" value={pendaftar.lingkar_pinggang} />
                  <ProfileItem label="Email" value={pendaftar.email} />
                  <ProfileItem label="Nomor HP" value={pendaftar.no_hp} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JADWAL PELATIHAN */}
          {activeTab === 'jadwal' && (
            isUnverified ? (
              <LockedTabCard title="Jadwal Pelatihan" tabName="Jadwal Pelatihan & Sesi Kelas" />
            ) : (
              <div className="glass-card-static p-6 md:p-8 animate-fade-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Jadwal Pelatihan & Sesi Kelas</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Sesi orientasi, teori, praktik, dan ujian untuk program {program?.nama || pendaftar.jenis_pelatihan}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setJadwalViewMode('calendar')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${jadwalViewMode === 'calendar' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      Tampilan Kalender
                    </button>
                    <button
                      onClick={() => setJadwalViewMode('list')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${jadwalViewMode === 'list' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      Tampilan List
                    </button>
                  </div>
                </div>

                {jadwalViewMode === 'calendar' ? (
                  <CalendarView events={filteredJadwal} />
                ) : (
                  <div className="space-y-4">
                    {filteredJadwal.length === 0 ? (
                      <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                        Belum ada jadwal khusus yang dipublikasikan oleh Admin untuk program Anda.
                      </div>
                    ) : (
                      filteredJadwal.map((j) => (
                        <div key={j.id} className="p-4 rounded-xl bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[var(--card-border)]">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[var(--primary-bg)] text-[var(--primary)] border border-[rgba(79,70,229,0.2)]">
                                {j.jenis_sesi}
                              </span>
                              <span className="text-xs text-[var(--text-tertiary)]">Ruangan: {j.ruangan}</span>
                            </div>
                            <h4 className="font-bold text-[var(--text-primary)] text-sm">{j.judul}</h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{j.tanggal} • {j.jam}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB 4: PRETEST & POSTTEST */}
          {activeTab === 'ujian' && (
            isUnverified ? (
              <LockedTabCard title="Evaluasi Pretest & Posttest" tabName="Pengerjaan Ujian Online (CBT)" />
            ) : (
              <div className="glass-card-static p-6 md:p-8 animate-fade-in space-y-6">
                <div className="pb-4 border-b border-[var(--card-border)]">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Pengerjaan Ujian (Pretest & Posttest)</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Kerjakan evaluasi awal (Pretest) sebelum kelas dimulai dan evaluasi akhir (Posttest) untuk pengujian kompetensi Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pretest Card */}
                  <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                          Evaluasi Awal
                        </span>
                        <span className={`text-xs font-bold ${pretestHasil ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {pretestHasil ? (pretestAttempts >= 3 ? 'Selesai (3/3x)' : `Sudah Dikerjakan (${pretestAttempts}/3x)`) : 'Belum Dikerjakan'}
                        </span>
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">Pretest Pelatihan</h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Ujian kemampuan awal mengenai K3, etika kerja, dan pengetahuan umum industri untuk mengukur baseline Anda.
                      </p>
                    </div>

                    {pretestHasil ? (
                      <div className="p-4 rounded-xl bg-white border border-[var(--card-border)] space-y-1">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-tertiary)]">
                          <span>Nilai Tertinggi Pretest:</span>
                          <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Percobaan {pretestAttempts}/3</span>
                        </div>
                        <div className="text-3xl font-extrabold text-[var(--primary)]">{pretestHasil.nilai} <span className="text-xs font-normal text-[var(--text-tertiary)]">/ 100</span></div>
                        <p className="text-xs text-[var(--text-secondary)]">Benar {pretestHasil.benar} dari {pretestHasil.total_soal} Soal • {new Date(pretestHasil.tanggal).toLocaleDateString('id-ID')}</p>
                        {pretestAttempts < 3 ? (
                          <button
                            onClick={() => openExamModal('pretest')}
                            className="btn btn-outline btn-sm w-full mt-2 cursor-pointer"
                          >
                            Ulangi Pretest (Sisa {3 - pretestAttempts}x)
                          </button>
                        ) : (
                          <div className="mt-2 py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-500">
                            🔒 Batas Pengerjaan Terpenuhi (3/3 Percobaan)
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => openExamModal('pretest')}
                        className="btn btn-primary btn-md w-full font-bold cursor-pointer"
                      >
                        Kerjakan Pretest Sekarang
                      </button>
                    )}
                  </div>

                  {/* Posttest Card */}
                  <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                          Evaluasi Akhir
                        </span>
                        <span className={`text-xs font-bold ${posttestHasil ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {posttestHasil ? (posttestAttempts >= 3 ? 'Selesai (3/3x)' : `Sudah Dikerjakan (${posttestAttempts}/3x)`) : 'Belum Dikerjakan'}
                        </span>
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1">Posttest Kelulusan</h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Ujian pemahaman materi pelatihan akhir sebagai syarat penerbitan sertifikat kompetensi resmi LPK.
                      </p>
                    </div>

                    {posttestHasil ? (
                      <div className="p-4 rounded-xl bg-white border border-[var(--card-border)] space-y-1">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-tertiary)]">
                          <span>Nilai Tertinggi Posttest:</span>
                          <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Percobaan {posttestAttempts}/3</span>
                        </div>
                        <div className="text-3xl font-extrabold text-emerald-600">{posttestHasil.nilai} <span className="text-xs font-normal text-[var(--text-tertiary)]">/ 100</span></div>
                        <p className="text-xs text-[var(--text-secondary)]">Benar {posttestHasil.benar} dari {posttestHasil.total_soal} Soal • {new Date(posttestHasil.tanggal).toLocaleDateString('id-ID')}</p>
                        {posttestAttempts < 3 ? (
                          <button
                            onClick={() => openExamModal('posttest')}
                            className="btn btn-outline btn-sm w-full mt-2 cursor-pointer"
                          >
                            Ulangi Posttest (Sisa {3 - posttestAttempts}x)
                          </button>
                        ) : (
                          <div className="mt-2 py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-500">
                            🔒 Batas Pengerjaan Terpenuhi (3/3 Percobaan)
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => openExamModal('posttest')}
                        className="btn btn-accent btn-md w-full font-bold cursor-pointer"
                      >
                        Kerjakan Posttest Sekarang
                      </button>
                    )}
                  </div>
                </div>

                {activeExamType && (
                  <div className="pt-6 border-t border-[var(--card-border)]">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(['pretest', 'posttest'] as const).map((tipe) => (
                        <button
                          key={tipe}
                          type="button"
                          onClick={() => setExamViewMode(tipe)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${examViewMode === tipe
                            ? 'bg-[var(--primary)] text-white shadow-sm'
                            : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                          {tipe === 'pretest' ? 'Tab Pretest' : 'Tab Posttest'}
                        </button>
                      ))}
                    </div>

                    {activeExamType && (
                      <ExamRunnerModal
                        tipe={examViewMode}
                        pendaftar={pendaftar}
                        onClose={() => {
                          setActiveExamType(null);
                          loadPesertaData();
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB 5: RINCIAN PROGRAM */}
          {activeTab === 'rincian_program' && (
            <div className="glass-card-static p-6 md:p-8 animate-fade-in space-y-6">
              <div className="pb-4 border-b border-[var(--card-border)] flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-[var(--primary-bg)] text-[var(--primary)] flex-shrink-0">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{program?.nama || pendaftar.jenis_pelatihan}</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{program?.deskripsi}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[var(--surface)] text-center">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">Durasi</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{program?.durasi}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface)] text-center">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">Sertifikasi</span>
                  <span className="text-sm font-bold text-[var(--primary)]">BNSP / Resmi LPK</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface)] text-center">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block">Biaya Pelatihan</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{totalHargaFormatted}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3">Modul Pembelajaran Utama</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: 'MODUL 01', title: 'Keselamatan & Kesehatan Kerja (K3)' },
                    { code: 'MODUL 02', title: 'Fondasi Teori & Standar Kompetensi' },
                    { code: 'MODUL 03', title: 'Simulasi & Praktik Langsung Lapangan' },
                    { code: 'MODUL 04', title: 'Persiapan Ujian & Penyaluran Kerja' },
                  ].map((m, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--card-border)]">
                      <span className="text-[10px] font-bold text-[var(--accent)] font-mono">{m.code}</span>
                      <p className="font-semibold text-xs text-[var(--text-primary)]">{m.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: KELULUSAN & SERTIFIKAT */}
          {activeTab === 'kelulusan' && (
            isUnverified ? (
              <LockedTabCard title="Kelulusan & Sertifikat" tabName="Status Kelulusan & Unduh Sertifikat" />
            ) : (
              <div className="glass-card-static p-6 md:p-8 animate-fade-in space-y-6">
                {kelulusanRecord && kelulusanRecord.status_kelulusan === 'Lulus' ? (
                  <CertificateView kelulusan={kelulusanRecord} />
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-3xl mx-auto">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">
                      {kelulusanRecord?.status_kelulusan === 'Tidak_Lulus'
                        ? 'Belum Memenuhi Syarat Kelulusan'
                        : 'Status Kelulusan Dalam Proses Penilaian'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                      {kelulusanRecord?.status_kelulusan === 'Tidak_Lulus'
                        ? 'Nilai evaluasi Anda belum mencapai passing grade (70). Silakan hubungi admin / instruktur untuk sesi perbaikan.'
                        : 'Admin dan instruktur sedang melakukan proses verifikasi nilai ujian, presensi, dan tugas Anda. Sertifikat digital akan diterbitkan otomatis jika Anda dinyatakan LULUS.'}
                    </p>
                  </div>
                )}
              </div>
            ))}

          {/* Modal Pembayaran */}
          {showPaymentModal && (
            <PesertaPembayaranModal
              pendaftar={pendaftar}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={() => {
                setShowPaymentModal(false);
                loadPesertaData();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg p-3">
      <div className="text-xs text-[var(--text-tertiary)] mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

// ----------------------------------------------------
// EXAM RUNNER COMPONENT
// ----------------------------------------------------
function ExamRunnerModal({
  tipe,
  pendaftar,
  onClose,
}: {
  tipe: 'pretest' | 'posttest';
  pendaftar: Pendaftar;
  onClose: () => void;
}) {
  const [soalList, setSoalList] = useState<SoalUjian[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [soalId: string]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasilSummary, setHasilSummary] = useState<HasilUjian | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadSoal = async () => {
      const programId = pendaftar.program_id || (pendaftar.jenis_pelatihan ? 'program-default' : '');
      const res = await ujianApi.mulai({ tipe, program_id: programId });
      if (res.success && res.data) {
        setSoalList(res.data);
        setCurrentIndex(0);
      }
    };
    loadSoal();
  }, [tipe, pendaftar]);

  const handleSelectOption = (soalId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [soalId]: optionIndex }));
  };

  const currentSoal = soalList[currentIndex];
  const currentSelected = currentSoal ? userAnswers[currentSoal.id] : undefined;
  const answeredCount = soalList.filter((soal) => userAnswers[soal.id] !== undefined).length;

  const handleSubmitExam = async () => {
    let correctCount = 0;
    const jawaban = soalList.map((soal) => {
      if (userAnswers[soal.id] === soal.jawaban_benar) {
        correctCount += 1;
      }
      return { soal_id: soal.id, jawaban: userAnswers[soal.id] ?? -1 };
    });

    const res = await ujianApi.submit({
      tipe: tipe,
      program_id: pendaftar.program_id || '',
      jawaban,
      pendaftar_id: pendaftar.id,
    });

    if (res.success && res.data) {
      setHasilSummary(res.data);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="w-full rounded-3xl border border-[var(--card-border)] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--surface)]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--primary-bg)] text-[var(--primary)]">
            Lembar Ujian Peserta
          </span>
          <h3 className="font-bold text-[var(--text-primary)] text-lg mt-0.5">
            {tipe === 'pretest' ? 'Pretest Evaluasi Awal' : 'Posttest Kelulusan akhir'} - {pendaftar.jenis_pelatihan}
          </h3>
        </div>
        <button onClick={onClose} className="btn btn-outline btn-sm">
          Tutup
        </button>
      </div>

      <div className="p-4 md:p-6 bg-slate-50/60">
        {soalList.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            Belum ada soal ujian yang tersedia untuk modul ini. Silakan hubungi instruktur/admin.
          </div>
        ) : isSubmitted && hasilSummary ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mx-auto font-bold">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-extrabold text-[var(--text-primary)]">Ujian Selesai!</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Hasil ujian Anda telah tercatat secara otomatis di sistem LPK.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] max-w-md mx-auto space-y-3">
              <div className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">NILAI AKHIR ANDA</div>
              <div className="text-5xl font-black text-[var(--primary)]">{hasilSummary.nilai} <span className="text-base font-normal text-[var(--text-tertiary)]">/ 100</span></div>
              <div className="text-xs text-[var(--text-secondary)] font-medium">
                Jawaban Benar: <span className="font-bold text-emerald-600">{hasilSummary.benar}</span> dari {hasilSummary.total_soal} Soal
              </div>
            </div>

            <button onClick={onClose} className="btn btn-primary btn-md">
              Kembali ke Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] font-bold">
                  Progress Ujian
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1">
                  {answeredCount} dari {soalList.length} soal terjawab
                </div>
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Soal {currentIndex + 1} / {soalList.length}
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${((answeredCount + (currentSoal ? 0.2 : 0)) / soalList.length) * 100}%` }}
              />
            </div>

            <div className="bg-white rounded-3xl border border-[var(--card-border)] p-5 md:p-7 shadow-sm">
              <div className="mb-5">
                <span className="inline-flex items-center rounded-full bg-[var(--primary-bg)] px-3 py-1 text-[11px] font-bold text-[var(--primary)]">
                  Soal Nomor {currentIndex + 1}
                </span>
              </div>

              <h4 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] leading-relaxed mb-6">
                {currentSoal?.pertanyaan}
              </h4>

              <div className="space-y-3">
                {currentSoal?.opsi.map((opt, oIdx) => {
                  const isChosen = currentSelected === oIdx;
                  const letter = String.fromCharCode(65 + oIdx);

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentSoal.id, oIdx)}
                      className={`w-full text-left rounded-2xl border p-4 md:p-5 transition-all flex items-center gap-4 ${isChosen
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                        : 'bg-slate-50 text-[var(--text-primary)] border-slate-200 hover:border-[var(--primary)]/50 hover:bg-[var(--primary-bg)]'
                        }`}
                    >
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${isChosen
                        ? 'bg-white/20 border-white/20 text-white'
                        : 'bg-white border-slate-200 text-[var(--text-secondary)]'
                        }`}>
                        {letter}
                      </span>
                      <span className="flex-1 text-base leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="btn btn-outline btn-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>

              <div className="flex gap-3">
                {currentIndex < soalList.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(soalList.length - 1, prev + 1))}
                    className="btn btn-primary btn-md"
                  >
                    Selanjutnya
                  </button>
                ) : (
                  <button onClick={handleSubmitExam} className="btn btn-primary btn-md">
                    Kirim Ujian
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LockedTabCard({ title, tabName }: { title: string; tabName: string }) {
  return (
    <div className="glass-card-static p-8 md:p-12 text-center max-w-xl mx-auto my-6 space-y-4 border border-amber-200/80 bg-amber-50/50 rounded-2xl shadow-xs animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-extrabold text-amber-950">Menu {title} Terkunci</h3>
        <p className="text-xs sm:text-sm text-amber-800 leading-relaxed max-w-md mx-auto">
          Status pendaftaran Anda saat ini <strong>Masih Menunggu Verifikasi Admin</strong>. Fitur <strong>{tabName}</strong> ini akan otomatis terbuka setelah data fisik dan berkas Anda divalidasi & diterima oleh Admin LPK Leles.
        </p>
      </div>
      <div className="pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Status: Menunggu Verifikasi Admin
        </div>
      </div>
    </div>
  );
}




