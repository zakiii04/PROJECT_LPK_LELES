'use client';

import { useState, useEffect, useCallback } from 'react';
import { angkatanApi, pendaftarApi, programApi } from '@/lib/api';
import type { Angkatan, Pendaftar, AngkatanStatus, Program } from '@/lib/types';
import AdminPendaftarDetail from '@/Components/AdminPendaftarDetail';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';

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
  } catch (e) {
    console.warn('Date parse error:', e);
  }
  return cleanStr;
};

interface AngkatanManagerProps {
  initialAngkatanList?: Angkatan[];
  initialPendaftarList?: Pendaftar[];
  initialProgramList?: Program[];
}

export default function AngkatanManager({
  initialAngkatanList = [],
  initialPendaftarList = [],
  initialProgramList = [],
}: AngkatanManagerProps) {
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>(initialAngkatanList);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>(initialPendaftarList);
  const [programList, setProgramList] = useState<Program[]>(initialProgramList);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAngkatan, setEditingAngkatan] = useState<Angkatan | null>(null);
  const [selectedAngkatanForPlotting, setSelectedAngkatanForPlotting] = useState<Angkatan | null>(null);
  const [selectedAngkatanForViewPeserta, setSelectedAngkatanForViewPeserta] = useState<Angkatan | null>(null);
  const [viewPesertaList, setViewPesertaList] = useState<Pendaftar[]>([]);
  const [viewingParticipantDetail, setViewingParticipantDetail] = useState<Pendaftar | null>(null);
  const [isLoadingPeserta, setIsLoadingPeserta] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form states for Angkatan
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [program, setProgram] = useState(initialProgramList[0]?.nama || '');
  const [tahun, setTahun] = useState(2026);
  const [periode, setPeriode] = useState('September - November 2026');
  const [tglMulaiReg, setTglMulaiReg] = useState('');
  const [tglSelesaiReg, setTglSelesaiReg] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [kuota, setKuota] = useState(30);
  const [instruktur, setInstruktur] = useState('Instruktur Utama');
  const [status, setStatus] = useState<AngkatanStatus>('On_Going');

  const loadData = useCallback(async () => {
    try {
      const [aRes, pRes, prgRes] = await Promise.all([
        angkatanApi.list(),
        pendaftarApi.list({ per_page: 100 }),
        programApi.list(),
      ]);
      setAngkatanList(aRes.data || []);
      const allPendaftar = pRes.data?.data || (Array.isArray(pRes.data) ? pRes.data : []);
      setPendaftarList(allPendaftar);
      
      const programs = prgRes.data || [];
      setProgramList(programs);
      if (programs.length > 0 && !program) {
        setProgram(programs[0].nama);
      }
    } catch (err) {
      console.error('Error loading angkatan data:', err);
    }
  }, [program]);

  useEffect(() => {
    if (initialAngkatanList.length > 0) setAngkatanList(initialAngkatanList);
    if (initialPendaftarList.length > 0) setPendaftarList(initialPendaftarList);
    if (initialProgramList.length > 0) {
      setProgramList(initialProgramList);
      if (!program) setProgram(initialProgramList[0].nama);
    }

    if (initialAngkatanList.length === 0 || initialProgramList.length === 0) {
      loadData();
    }
  }, [initialAngkatanList, initialPendaftarList, initialProgramList]);

  const handleOpenViewPeserta = async (ang: Angkatan) => {
    setSelectedAngkatanForViewPeserta(ang);
    setIsLoadingPeserta(true);
    try {
      const res = await angkatanApi.getPendaftar(ang.id);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setViewPesertaList(res.data);
      } else if (ang.pendaftar && ang.pendaftar.length > 0) {
        setViewPesertaList(ang.pendaftar);
      } else {
        setViewPesertaList(pendaftarList.filter((p) => p.angkatan_id === ang.id));
      }
    } catch (e) {
      if (ang.pendaftar && ang.pendaftar.length > 0) {
        setViewPesertaList(ang.pendaftar);
      } else {
        setViewPesertaList(pendaftarList.filter((p) => p.angkatan_id === ang.id));
      }
    } finally {
      setIsLoadingPeserta(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAngkatan(null);
    setKode('');
    setNama('');
    setProgram(programList.length > 0 ? programList[0].nama : 'Tata Boga & Pastry');
    setTahun(2026);
    setPeriode('September - November 2026');
    setTglMulaiReg('');
    setTglSelesaiReg('');
    setTglMulai('');
    setTglSelesai('');
    setKuota(30);
    setInstruktur('Instruktur Utama');
    setStatus('On_Going');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (ang: Angkatan) => {
    setEditingAngkatan(ang);
    setKode(ang.kode_angkatan);
    setNama(ang.nama_angkatan);
    setProgram(ang.program_id || ang.program?.nama || (programList[0]?.id || ''));
    setTahun(ang.tahun || 2026);
    setPeriode(ang.periode || '');
    setTglMulaiReg(ang.tgl_mulai_pendaftaran ? ang.tgl_mulai_pendaftaran.split('T')[0] : '');
    setTglSelesaiReg(ang.tgl_selesai_pendaftaran ? ang.tgl_selesai_pendaftaran.split('T')[0] : '');
    setTglMulai(ang.tanggal_mulai ? ang.tanggal_mulai.split('T')[0] : '');
    setTglSelesai(ang.tanggal_selesai ? ang.tanggal_selesai.split('T')[0] : '');
    setKuota(ang.kuota);
    setInstruktur(ang.instruktur_nama);
    setStatus(ang.status || 'On_Going');
    setShowAddModal(true);
  };

  const handleSaveAngkatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode || !nama || !tglMulai || !tglSelesai) return;

    try {
      const payload = {
        kode_angkatan: kode,
        nama_angkatan: nama,
        program_id: program,
        tahun: Number(tahun),
        periode,
        tgl_mulai_pendaftaran: tglMulaiReg || undefined,
        tgl_selesai_pendaftaran: tglSelesaiReg || undefined,
        tanggal_mulai: tglMulai,
        tanggal_selesai: tglSelesai,
        kuota: Number(kuota),
        instruktur_nama: instruktur,
        status,
      };

      if (editingAngkatan) {
        await angkatanApi.update(editingAngkatan.id, payload);
      } else {
        await angkatanApi.create(payload);
      }

      setShowAddModal(false);
      setEditingAngkatan(null);
      await loadData();
    } catch (err) {
      console.error('Error saving angkatan:', err);
      alert('Gagal menyimpan data angkatan. Mohon periksa kembali inputan Anda.');
    }
  };

  const handleDelete = (id: string, name?: string) => {
    setDeleteTarget({ id, name: name || 'Angkatan' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await angkatanApi.destroy(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Error deleting angkatan:', err);
    }
  };

  const handleTogglePesertaInAngkatan = async (pendaftarId: string) => {
    if (!selectedAngkatanForPlotting) return;

    try {
      await pendaftarApi.alokasiAngkatan(pendaftarId, selectedAngkatanForPlotting.id);
      loadData();
    } catch (err) {
      console.error('Error allocating pendaftar:', err);
    }
  };

  // Helper untuk mengekstrak nomor angkatan (misal: "ANG-51" -> 51)
  const getAngkatanNumber = (ang: Angkatan) => {
    const matchKode = (ang.kode_angkatan || '').match(/\d+/);
    if (matchKode) return parseInt(matchKode[0], 10);
    const matchNama = (ang.nama_angkatan || '').match(/\d+/);
    if (matchNama) return parseInt(matchNama[0], 10);
    return 0;
  };

  // Urutkan angkatan terbaru berada paling atas
  const sortedAngkatanList = [...angkatanList].sort((a, b) => {
    const numA = getAngkatanNumber(a);
    const numB = getAngkatanNumber(b);
    if (numA !== numB) return numB - numA;

    const tahunA = a.tahun || 0;
    const tahunB = b.tahun || 0;
    if (tahunA !== tahunB) return tahunB - tahunA;

    const dateA = a.tanggal_mulai ? new Date(a.tanggal_mulai).getTime() : 0;
    const dateB = b.tanggal_mulai ? new Date(b.tanggal_mulai).getTime() : 0;
    return dateB - dateA;
  });

  // Hitung jumlah peserta terdaftar secara akurat dari pendaftarList / relasi / pendaftar_count
  const getFilledCount = (ang: Angkatan) => {
    const listCount = pendaftarList.filter((p) => p.angkatan_id === ang.id).length;
    const relCount = (ang.pendaftar && Array.isArray(ang.pendaftar)) ? ang.pendaftar.length : 0;
    const serverCount = typeof ang.pendaftar_count === 'number' ? ang.pendaftar_count : 0;
    return Math.max(listCount, relCount, serverCount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Manajemen Angkatan Pelatihan</h2>
          <p className="text-xs text-[var(--text-secondary)]">Kelompokkan peserta yang diterima ke dalam angkatan & gelombang pelatihan</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto font-bold"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Buat Angkatan Baru</span>
        </button>
      </div>

      {/* Grid Cards Angkatan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedAngkatanList.map((ang) => {
          const filledCount = getFilledCount(ang);
          const percentage = Math.min(100, Math.round((filledCount / ang.kuota) * 100));

          return (
            <div key={ang.id} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--card-border)] space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-2.5 py-0.5 rounded border border-[rgba(79,70,229,0.15)]">
                    {ang.kode_angkatan}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ang.status === 'On_Going' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        On Going
                      </span>
                    )}
                    {ang.status === 'Pendaftaran' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Pendaftaran Buka
                      </span>
                    )}
                    {ang.status === 'Mendatang' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Mendatang
                      </span>
                    )}
                    {ang.status === 'Selesai' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Selesai
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-base">{ang.nama_angkatan}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Program: <span className="font-semibold text-[var(--text-primary)]">{ang.program?.nama || ang.program_id}</span> • Periode: {ang.periode}
                  </p>
                </div>

                {/* Rentang Tanggal Details Box */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 text-xs text-slate-600 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Rentang Pendaftaran:</span>
                    </span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {ang.tgl_mulai_pendaftaran && ang.tgl_selesai_pendaftaran
                        ? `${formatDateOnly(ang.tgl_mulai_pendaftaran)} s.d. ${formatDateOnly(ang.tgl_selesai_pendaftaran)}`
                        : 'Ditentukan kemudian'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      <span>Rentang Pelatihan:</span>
                    </span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatDateOnly(ang.tanggal_mulai)} s.d. {formatDateOnly(ang.tanggal_selesai)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                  <span>Instruktur Utama:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{ang.instruktur_nama}</span>
                </div>

                {/* Progress Bar Kuota */}
                <div className="pt-1">
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[var(--text-secondary)]">Keterisian Peserta</span>
                    <span className="text-[var(--primary)]">{filledCount} / {ang.kuota} Orang ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)] flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenViewPeserta(ang)}
                    className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold shadow-2xs"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span>Lihat Peserta ({filledCount})</span>
                  </button>

                  <button
                    onClick={() => setSelectedAngkatanForPlotting(ang)}
                    className="btn btn-outline btn-sm text-xs flex items-center gap-1 text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Plotting</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleOpenEditModal(ang)} className="btn btn-outline btn-sm text-xs font-semibold">Edit</button>
                  <button onClick={() => handleDelete(ang.id, ang.nama_angkatan)} className="btn btn-danger btn-sm text-xs">Hapus</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Angkatan */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingAngkatan ? 'Edit Data Angkatan' : 'Buat Angkatan Pelatihan Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-black">✕</button>
            </div>

            <form onSubmit={handleSaveAngkatan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Kode Angkatan</label>
                  <input type="text" className="form-input" placeholder="Misal: ANG-TB-2026-I" value={kode} onChange={(e) => setKode(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Program Pelatihan</label>
                  <select className="form-input" value={program} onChange={(e) => setProgram(e.target.value)}>
                    {programList.length > 0 ? (
                      programList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))
                    ) : (
                      <>
                        <option value="Tata Boga & Pastry">Tata Boga & Pastry</option>
                        <option value="Manajemen Restoran">Manajemen Restoran</option>
                        <option value="Barista & Coffee Shop">Barista & Coffee Shop</option>
                        <option value="Housekeeping Hotel">Housekeeping Hotel</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Nama Angkatan</label>
                <input type="text" className="form-input" placeholder="Misal: Angkatan I - Tata Boga & Pastry 2026" value={nama} onChange={(e) => setNama(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Periode Pelatihan (Teks)</label>
                  <input type="text" className="form-input" placeholder="Mei - Agustus 2026" value={periode} onChange={(e) => setPeriode(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Kuota Peserta</label>
                  <input type="number" className="form-input" value={kuota} onChange={(e) => setKuota(Number(e.target.value))} required />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-semibold text-slate-700">Rentang Tanggal Pendaftaran</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Tanggal Buka Pendaftaran</label>
                    <input type="date" className="form-input" value={tglMulaiReg} onChange={(e) => setTglMulaiReg(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Tutup Pendaftaran</label>
                    <input type="date" className="form-input" value={tglSelesaiReg} onChange={(e) => setTglSelesaiReg(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <div className="font-semibold text-indigo-900">Rentang Tanggal Pelatihan</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Tanggal Mulai Pelatihan</label>
                    <input type="date" className="form-input" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Selesai Pelatihan</label>
                    <input type="date" className="form-input" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Status Angkatan</label>
                  <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Pendaftaran">Pendaftaran Buka</option>
                    <option value="On_Going">On Going (Pelatihan Berjalan)</option>
                    <option value="Mendatang">Mendatang</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Instruktur Utama</label>
                  <input type="text" className="form-input" placeholder="Nama Instruktur" value={instruktur} onChange={(e) => setInstruktur(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline btn-sm">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">Simpan Angkatan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Plotting Peserta ke Angkatan */}
      {selectedAngkatanForPlotting && (
        <div className="modal-overlay" onClick={() => setSelectedAngkatanForPlotting(null)}>
          <div className="modal-content max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Plotting Peserta — {selectedAngkatanForPlotting.nama_angkatan}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedAngkatanForPlotting.program?.nama || selectedAngkatanForPlotting.kode_angkatan} • Terisi: {getFilledCount(selectedAngkatanForPlotting)} / {selectedAngkatanForPlotting.kuota}
                </p>
              </div>
              <button onClick={() => setSelectedAngkatanForPlotting(null)} className="text-slate-400 hover:text-black">✕</button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Pilih peserta terdaftar:
              </div>

              {pendaftarList.map((p) => {
                const isChecked = (selectedAngkatanForPlotting.pendaftar || []).some((peserta) => peserta.id === p.id) || p.angkatan_id === selectedAngkatanForPlotting.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePesertaInAngkatan(p.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'border-[var(--primary)] bg-[var(--primary-bg)] shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">{p.nama_lengkap}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {p.no_pendaftaran} • Status Bayar: {p.status_pembayaran || 'belum_bayar'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingParticipantDetail(p);
                        }}
                        className="btn btn-outline btn-sm text-[11px] py-0.5 px-2 flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>Detail Profil</span>
                      </button>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}

              {pendaftarList.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada peserta terverifikasi.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedAngkatanForPlotting(null)} className="btn btn-primary btn-sm font-bold">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIHAT DAFTAR PESERTA TERDAFTAR ANGKATAN */}
      {selectedAngkatanForViewPeserta && (() => {
        const ang = selectedAngkatanForViewPeserta;

        return (
          <div className="modal-overlay" onClick={() => setSelectedAngkatanForViewPeserta(null)}>
            <div className="modal-content max-w-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {ang.kode_angkatan}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {ang.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mt-1">
                    Daftar Peserta — {ang.nama_angkatan}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Program: <span className="font-semibold text-slate-700">{ang.program?.nama || ang.program_id}</span> • Keterisian: <span className="font-bold text-indigo-700">{viewPesertaList.length} / {ang.kuota} Peserta</span>
                  </p>
                </div>
                <button onClick={() => setSelectedAngkatanForViewPeserta(null)} className="text-slate-400 hover:text-black text-lg">
                  ✕
                </button>
              </div>

              {/* Daftar Tabel / Cards Peserta */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {isLoadingPeserta ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    Memuat daftar peserta angkatan...
                  </div>
                ) : viewPesertaList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl">
                    Belum ada peserta yang dimasukkan ke dalam angkatan ini. Klik tombol <b>"Plotting"</b> untuk menambahkan peserta.
                  </div>
                ) : (
                  viewPesertaList.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                          <span className="font-bold text-slate-800 text-sm">{p.nama_lengkap}</span>
                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {p.no_pendaftaran}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIK: {p.nik} • HP: {p.no_hp}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status_pembayaran === 'lunas'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status_pembayaran === 'cicilan_sebagian'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {p.status_pembayaran === 'lunas' ? 'LUNAS' : p.status_pembayaran === 'cicilan_sebagian' ? 'CICILAN' : 'BELUM BAYAR'}
                        </span>

                        <button
                          onClick={() => setViewingParticipantDetail(p)}
                          className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Detail Profil</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    const target = selectedAngkatanForViewPeserta;
                    setSelectedAngkatanForViewPeserta(null);
                    setSelectedAngkatanForPlotting(target);
                  }}
                  className="btn btn-outline btn-sm text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>Buka Form Plotting Peserta</span>
                </button>

                <button onClick={() => setSelectedAngkatanForViewPeserta(null)} className="btn btn-primary btn-sm font-bold">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DETAIL PESERTA */}
      {viewingParticipantDetail && (
        <AdminPendaftarDetail
          pendaftar={viewingParticipantDetail}
          onClose={() => setViewingParticipantDetail(null)}
          onStatusChange={loadData}
        />
      )}
    </div>
  );
}
