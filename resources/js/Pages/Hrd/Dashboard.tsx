'use client';

import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import HrdInterviewForm from '@/Components/HrdInterviewForm';
import { type Pendaftar, type Interview } from '@/lib/storage';
import { pendaftarApi, interviewApi, authApi } from '@/lib/api';
import { getToken, removeToken, setRoleUser } from '@/lib/axios';

type HrdFilter = 'semua' | 'perlu_jadwal' | 'terjadwal' | 'lulus' | 'tidak_lulus';

export default function HrdDashboardPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [interviewList, setInterviewList] = useState<Interview[]>([]);
  const [filter, setFilter] = useState<HrdFilter>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected state for Modals
  const [selectedInterviewForPenilaian, setSelectedInterviewForPenilaian] = useState<Interview | null>(null);
  const [selectedPendaftarForJadwal, setSelectedPendaftarForJadwal] = useState<Pendaftar | null>(null);

  // Form State for Schedule Interview Modal
  const [iTanggal, setITanggal] = useState('');
  const [iJam, setIJam] = useState('09:00 WIB');
  const [iInterviewer, setIInterviewer] = useState('Tim HRD LPK');
  const [iRuangan, setIRuangan] = useState('Ruang Interview HRD 01');

  const loadData = useCallback(async () => {
    try {
      const pRes = await pendaftarApi.list();
      const pData = (pRes.data?.data || []).filter((p: Pendaftar) => p.status === 'diterima');
      setPendaftarList(pData);
      
      const iRes = await interviewApi.list();
      setInterviewList(iRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('lpk_hrd_logged_in') !== 'true') {
      router.visit('/login');
      return;
    }
    // Identitas HRD WAJIB dari token per-peran (cookie session dipakai
    // bersama antar-tab sehingga tidak bisa dipercaya di sini).
    if (!getToken('HRD')) {
      router.visit('/login');
      return;
    }
    (async () => {
      try {
        const meRes = await authApi.me();
        const meUser = (meRes as any)?.data;
        if (!meRes.success || !meUser || (meUser.role || '').toUpperCase() !== 'HRD') {
          removeToken('HRD');
          sessionStorage.removeItem('lpk_hrd_logged_in');
          router.visit('/login');
          return;
        }
        setRoleUser('HRD', meUser);
        setIsAuthed(true);
        loadData();
      } catch {
        removeToken('HRD');
        sessionStorage.removeItem('lpk_hrd_logged_in');
        router.visit('/login');
      }
    })();
  }, [router, loadData]);

  const handleLogout = () => {
    // Logout HANYA peran HRD — peran lain di tab sebelah tetap login.
    authApi.logout().catch(() => null);
    removeToken('HRD');
    sessionStorage.removeItem('lpk_hrd_logged_in');
    router.visit('/login');
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendaftarForJadwal || !iTanggal) return;

    try {
      await interviewApi.create({
        pendaftar_id: selectedPendaftarForJadwal.id,
        tanggal_interview: `${iTanggal} ${iJam}`,
        pewawancara: iInterviewer,
        skor_komunikasi: 0,
        skor_sikap: 0,
        skor_kesiapan: 0,
        catatan: `Lokasi: ${iRuangan}`,
        status: 'Pertimbangan',
      });

      setSelectedPendaftarForJadwal(null);
      setITanggal('');
      loadData();
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    }
  };

  if (!isAuthed) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  // Combined data for table
  const candidates = pendaftarList.map((p: Pendaftar) => {
    const interview = interviewList.find((i: Interview) => i.pendaftar_id === p.id);
    return {
      pendaftar: p,
      interview,
    };
  });

  // Filtered list
  const filteredCandidates = candidates.filter((item: { pendaftar: Pendaftar; interview: Interview | undefined }) => {
    const p = item.pendaftar;
    const inv = item.interview;

    const matchSearch =
      p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.no_pendaftaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nik.includes(searchQuery);

    if (!matchSearch) return false;

    if (filter === 'perlu_jadwal') return !inv;
    if (filter === 'terjadwal') return inv?.status === 'Pertimbangan';
    if (filter === 'lulus') return inv?.status === 'Lulus';
    if (filter === 'tidak_lulus') return inv?.status === 'Tidak Lulus';
    return true;
  });

  // Stats
  const totalDiterima = pendaftarList.length;
  const perluJadwalCount = candidates.filter((c: { pendaftar: Pendaftar; interview: Interview | undefined }) => !c.interview).length;
  const terjadwalCount = candidates.filter((c: { pendaftar: Pendaftar; interview: Interview | undefined }) => c.interview?.status === 'Pertimbangan').length;
  const lulusCount = candidates.filter((c: { pendaftar: Pendaftar; interview: Interview | undefined }) => c.interview?.status === 'Lulus').length;

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 md:py-10">
        <div className="container-wide space-y-6">
          {/* Header Banner */}
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-teal-100 text-teal-800 border-teal-200">Portal HRD & Seleksi</span>
                <span className="text-xs text-[var(--text-tertiary)] font-mono">• Terverifikasi Admin</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">
                Dashboard Wawancara & Seleksi
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">
                Kelola jadwal interview, penilaian kompetensi, dan status kelulusan seleksi HRD
              </p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm self-start md:self-auto text-slate-600">
              Logout HRD
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="text-2xl font-extrabold text-slate-800">{totalDiterima}</div>
              <div className="text-xs text-slate-500 mt-1">Peserta Terverifikasi</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-2xl font-extrabold text-amber-600">{perluJadwalCount}</div>
              <div className="text-xs text-amber-700/80 mt-1">Belum Dijadwalkan</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-2xl font-extrabold text-indigo-600">{terjadwalCount}</div>
              <div className="text-xs text-indigo-700/80 mt-1">Interview Terjadwal</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-2xl font-extrabold text-emerald-600">{lulusCount}</div>
              <div className="text-xs text-emerald-700/80 mt-1">Lulus Interview HRD</div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="glass-card-static p-6 space-y-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(
                  [
                    { key: 'semua', label: 'Semua Peserta' },
                    { key: 'perlu_jadwal', label: 'Perlu Jadwal' },
                    { key: 'terjadwal', label: 'Terjadwal' },
                    { key: 'lulus', label: 'Lulus' },
                    { key: 'tidak_lulus', label: 'Tidak Lulus' },
                  ] as const
                ).map((tab: { key: string; label: string }) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as HrdFilter)}
                    className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center w-full md:w-72">
                <span className="absolute left-3.5 pointer-events-none text-slate-400 z-10 flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari nama, NIK, no reg..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.25rem' : '0.875rem' }}
                  className="form-input text-xs h-9 w-full font-medium bg-slate-50/80 focus:bg-white border-slate-200 focus:border-indigo-500 rounded-xl transition-all shadow-2xs"
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
            </div>

            {/* Candidate Table */}
            <div className="overflow-x-auto border border-[var(--card-border)] rounded-xl">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Pendaftaran</th>
                    <th>Nama Peserta</th>
                    <th>Program Pelatihan</th>
                    <th>Status Interview</th>
                    <th>Jadwal & Lokasi</th>
                    <th>Skor Total</th>
                    <th>Aksi HRD</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                        Tidak ada data peserta interview yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map(({ pendaftar, interview }) => (
                      <tr key={pendaftar.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="whitespace-nowrap">
                          <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                            {pendaftar.no_pendaftaran}
                          </span>
                        </td>
                        <td>
                          <div className="font-bold text-slate-800 text-xs">{pendaftar.nama_lengkap}</div>
                          <div className="text-[10px] text-slate-400 font-mono">HP: {pendaftar.no_hp}</div>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-700">{pendaftar.jenis_pelatihan}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              interview?.status === 'Lulus'
                                ? 'badge-accepted'
                                : interview?.status === 'Tidak Lulus'
                                ? 'badge-rejected'
                                : interview?.status === 'Pertimbangan'
                                ? 'badge-active'
                                : 'badge-pending'
                            }`}
                          >
                            {interview?.status || 'Belum Dijadwal'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-xs text-slate-600">
                          {interview ? (
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>{interview.tanggal_interview}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{interview.catatan || 'Online/Ruangan'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum diatur</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap font-mono text-xs">
                          {interview?.skor_total !== undefined ? (
                            <span className={`font-bold ${interview.skor_total >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {interview.skor_total} / 100
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {!interview ? (
                              <button
                                onClick={() => setSelectedPendaftarForJadwal(pendaftar)}
                                className="btn btn-primary btn-sm bg-teal-600 hover:bg-teal-700 text-white text-[11px] flex items-center gap-1"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Atur Jadwal</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedPendaftarForJadwal(pendaftar)}
                                  className="btn btn-outline btn-sm text-[11px]"
                                >
                                  Edit Jadwal
                                </button>
                                <button
                                  onClick={() => setSelectedInterviewForPenilaian(interview)}
                                  className="btn btn-accent btn-sm text-[11px] flex items-center gap-1"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span>Penilaian HRD</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Atur Jadwal Interview */}
      {selectedPendaftarForJadwal && (
        <div className="modal-overlay" onClick={() => setSelectedPendaftarForJadwal(null)}>
          <div className="modal-content max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                Atur Jadwal Interview — {selectedPendaftarForJadwal.nama_lengkap}
              </h3>
              <button onClick={() => setSelectedPendaftarForJadwal(null)} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="form-label">Tanggal Wawancara</label>
                <input
                  type="date"
                  value={iTanggal}
                  onChange={(e) => setITanggal(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Jam Pelaksanaan</label>
                <input
                  type="text"
                  value={iJam}
                  onChange={(e) => setIJam(e.target.value)}
                  placeholder="09:00 WIB"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Nama Interviewer</label>
                <input
                  type="text"
                  value={iInterviewer}
                  onChange={(e) => setIInterviewer(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Lokasi Ruangan / Link Online</label>
                <input
                  type="text"
                  value={iRuangan}
                  onChange={(e) => setIRuangan(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedPendaftarForJadwal(null)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm bg-teal-600 hover:bg-teal-700 text-white">
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penilaian Interview HRD */}
      {selectedInterviewForPenilaian && (
        <HrdInterviewForm
          interview={selectedInterviewForPenilaian}
          onClose={() => setSelectedInterviewForPenilaian(null)}
          onSuccess={() => {
            setSelectedInterviewForPenilaian(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
