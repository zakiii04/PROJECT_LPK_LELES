'use client';

import { useState, useEffect, useCallback } from 'react';
import { pendaftarApi, kehadiranApi } from '@/lib/api';
import type { Pendaftar, Kehadiran, StatusKehadiran } from '@/lib/types';
import Pagination from '@/Components/Pagination';

interface AttendanceTrackerProps {
  programNama: string;
}

export default function AttendanceTracker({ programNama }: AttendanceTrackerProps) {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: StatusKehadiran; catatan: string }>
  >({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pRes = await pendaftarApi.list();
      const allPendaftar = pRes.data?.data || [];
      const filtered = allPendaftar.filter(
        (p: Pendaftar) =>
          p.status === 'diterima' &&
          (programNama === 'Semua' || p.jenis_pelatihan === programNama)
      );
      setPendaftarList(filtered);
      setCurrentPage(1);

      const kRes = await kehadiranApi.list({ tanggal });
      const allKehadiran = kRes.data || [];

      const existingMap: Record<string, { status: StatusKehadiran; catatan: string }> = {};
      filtered.forEach((p) => {
        const match = allKehadiran.find((k: Kehadiran) => k.pendaftar_id === p.id);
        existingMap[p.id] = {
          status: match ? match.status_kehadiran : 'Hadir',
          catatan: match?.catatan || '',
        };
      });
      setAttendanceState(existingMap);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [programNama, tanggal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (pendaftarId: string, status: StatusKehadiran) => {
    setAttendanceState((prev) => ({
      ...prev,
      [pendaftarId]: {
        ...prev[pendaftarId],
        status,
      },
    }));
  };

  const handleCatatanChange = (pendaftarId: string, catatan: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [pendaftarId]: {
        ...prev[pendaftarId],
        catatan,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const bulkData = pendaftarList.map((p) => ({
        pendaftar_id: p.id,
        status_kehadiran: attendanceState[p.id]?.status || 'Hadir',
        catatan: attendanceState[p.id]?.catatan || '',
      }));

      await kehadiranApi.createBulk({
        tanggal,
        data: bulkData,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save attendance:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Presensi Kehadiran Peserta</h3>
          <p className="text-xs text-slate-500">Program: {programNama}</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="form-input text-xs w-auto"
          />
          <button onClick={handleSaveAll} className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>Simpan Presensi</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Data presensi kehadiran tanggal {tanggal} berhasil disimpan!</span>
        </div>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Pendaftaran</th>
              <th>Nama Peserta</th>
              <th>Status Kehadiran</th>
              <th>Catatan Instruktur</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                  Memuat data...
                </td>
              </tr>
            ) : pendaftarList.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                  Belum ada peserta terdaftar untuk program ini.
                </td>
              </tr>
            ) : (
              pendaftarList.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => {
                const current = attendanceState[p.id] || { status: 'Hadir', catatan: '' };

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {p.no_pendaftaran}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-800 text-xs">{p.nama_lengkap}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(p.id, st)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                              current.status === st
                                ? st === 'Hadir'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : st === 'Izin'
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : st === 'Sakit'
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-rose-600 text-white border-rose-600'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Keterangan (opsional)..."
                        value={current.catatan}
                        onChange={(e) => handleCatatanChange(p.id, e.target.value)}
                        className="form-input text-xs max-w-xs"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalItems={pendaftarList.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
