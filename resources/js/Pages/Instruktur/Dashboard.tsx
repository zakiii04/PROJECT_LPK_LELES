'use client';

import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import CalendarView from '@/Components/CalendarView';
import AttendanceTracker from '@/Components/AttendanceTracker';
import { JENIS_PELATIHAN, type JadwalPelatihan, type Pendaftar } from '@/lib/storage';
import { jadwalApi, pendaftarApi } from '@/lib/api';

type InstrukturTab = 'jadwal' | 'presensi' | 'peserta' | 'materi';

export default function InstrukturDashboardPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<InstrukturTab>('jadwal');
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>([]);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('Semua');

  // Material upload state
  const [materiJudul, setMateriJudul] = useState('');
  const [materiProgram, setMateriProgram] = useState('Bahasa Jepang');
  const [materiSuccess, setMateriSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const jadwalRes = await jadwalApi.list();
      setJadwalList(jadwalRes.data || []);
      const pendaftarRes = await pendaftarApi.list();
      const allPendaftar = pendaftarRes.data?.data || [];
      setPendaftarList(allPendaftar.filter((p: Pendaftar) => p.status === 'diterima'));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('lpk_instruktur_logged_in') !== 'true') {
      router.push('/instruktur');
      return;
    }
    setIsAuthed(true);
    loadData();
  }, [router, loadData]);

  const handleLogout = () => {
    sessionStorage.removeItem('lpk_instruktur_logged_in');
    router.push('/instruktur');
  };

  const handleUploadMateri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiJudul) return;
    setMateriSuccess(true);
    setMateriJudul('');
    setTimeout(() => setMateriSuccess(false), 3000);
  };

  if (!isAuthed) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        </main>
      </>
    );
  }

  const filteredPendaftar = pendaftarList.filter(
    (p) => selectedProgramFilter === 'Semua' || p.jenis_pelatihan === selectedProgramFilter
  );

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <Navbar />

      <main className="flex-1 py-8 md:py-10">
        <div className="container-wide space-y-6">
          {/* Header */}
          <div className="card p-6 md:p-8 border-l-4 border-l-blue-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="badge badge-active mb-2 bg-blue-50 text-blue-700 border-blue-200">
                Portal Instruktur / Pengajar
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                Dashboard Instruktur
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Kelola jadwal mengajar, presensi siswa, serta materi pelatihan LPK.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm border-slate-300 text-slate-600 hover:bg-slate-100 self-start md:self-auto"
            >
              Keluar
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-colors ${
                activeTab === 'jadwal'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Calendar & Jadwal Mengajar
            </button>
            <button
              onClick={() => setActiveTab('presensi')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-colors ${
                activeTab === 'presensi'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Presensi Siswa
            </button>
            <button
              onClick={() => setActiveTab('peserta')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-colors ${
                activeTab === 'peserta'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Siswa Terdaftar ({pendaftarList.length})
            </button>
            <button
              onClick={() => setActiveTab('materi')}
              className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-colors ${
                activeTab === 'materi'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload Materi
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="pt-2">
            {/* TAB 1: JADWAL */}
            {activeTab === 'jadwal' && (
              <div className="space-y-4 animate-fade-in">
                <CalendarView schedules={jadwalList} />
              </div>
            )}

            {/* TAB 2: PRESENSI SISWA */}
            {activeTab === 'presensi' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Formulir Presensi Kelas</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Filter Program:</label>
                    <select
                      value={selectedProgramFilter}
                      onChange={(e) => setSelectedProgramFilter(e.target.value)}
                      className="form-input text-xs w-auto"
                    >
                      <option value="Semua">Semua Program</option>
                      {JENIS_PELATIHAN.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <AttendanceTracker programNama={selectedProgramFilter} />
              </div>
            )}

            {/* TAB 3: DATA PESERTA KELAS */}
            {activeTab === 'peserta' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Peserta Aktif di Kelas Anda</h3>
                  <select
                    value={selectedProgramFilter}
                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                    className="form-input text-xs w-auto"
                  >
                    <option value="Semua">Semua Program</option>
                    {JENIS_PELATIHAN.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>No. Pendaftaran</th>
                        <th>Nama Peserta</th>
                        <th>Program Pelatihan</th>
                        <th>Jenis Kelamin</th>
                        <th>Kontak Peserta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendaftar.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                            Tidak ada peserta aktif.
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
                            <td className="text-xs text-slate-600">{p.jenis_kelamin}</td>
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
                      {JENIS_PELATIHAN.map((p) => (
                        <option key={p} value={p}>{p}</option>
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
          </div>
        </div>
      </main>
    </div>
  );
}


