'use client';

import { useState, useEffect, useCallback } from 'react';
import { angkatanApi, pendaftarApi, programApi, kelulusanApi, jadwalApi, penyelesaianApi } from '@/lib/api';
import type { Angkatan, Pendaftar, AngkatanStatus, Program, JadwalPelatihan, PenyelesaianKelas } from '@/lib/types';
import { isAnggotaAngkatan, getStatusBadgeClass, getStatusLabel } from '@/lib/storage';
import AdminPendaftarDetail from '@/Components/AdminPendaftarDetail';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import ActionToast, { useActionToast } from '@/Components/ActionToast';

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
  const { actionToast, showLoading, showSuccess, showError, hideToast } = useActionToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAngkatanForCompletion, setSelectedAngkatanForCompletion] = useState<Angkatan | null>(null);
  const [completionPeserta, setCompletionPeserta] = useState<Pendaftar[]>([]);
  // Tempat kelas yang sedang diselesaikan (null = mode lama per-angkatan penuh).
  const [completionTempat, setCompletionTempat] = useState<string | null>(null);
  const [completionTanpaTempat, setCompletionTanpaTempat] = useState(0);

  // Jadwal seluruh angkatan + catatan kelas yang sudah selesai.
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>([]);
  const [penyelesaianList, setPenyelesaianList] = useState<PenyelesaianKelas[]>([]);
  const [lulusPesertaIds, setLulusPesertaIds] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);

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
    // Data kelas (jadwal + penyelesaian) selalu dimuat — tidak ikut props awal.
    loadKelasData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAngkatanList, initialPendaftarList, initialProgramList]);

  // Jadwal + status selesai per-kelas (dipakai blok Kelas di tiap kartu).
  const loadKelasData = useCallback(async () => {
    try {
      const [jRes, sRes] = await Promise.all([
        jadwalApi.list().catch(() => null),
        penyelesaianApi.list().catch(() => null),
      ]);
      setJadwalList((jRes as any)?.data || []);
      setPenyelesaianList((sRes as any)?.data || []);
    } catch (err) {
      console.error('Error loading kelas data:', err);
    }
  }, []);

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

  const isTrainingFinished = (ang: Angkatan) => {
    if (!ang.tanggal_selesai || ang.status === 'Selesai') return false;
    const endDate = new Date(`${ang.tanggal_selesai.split('T')[0]}T23:59:59`);
    return endDate.getTime() < Date.now();
  };

  // Lepas peserta dari angkatan secara tuntas (keluar dari kelas):
  // angkatan_id dikosongkan + seluruh pivot sesi dilepas. Riwayat
  // nilai/ujian/pembayaran tetap utuh dan bisa dialokasikan ulang.
  const [lepasTarget, setLepasTarget] = useState<Pendaftar | null>(null);
  const [isLepas, setIsLepas] = useState(false);

  const confirmLepasDariAngkatan = async () => {
    if (!lepasTarget || !selectedAngkatanForViewPeserta) return;
    setIsLepas(true);
    try {
      const res = await pendaftarApi.alokasiAngkatan(lepasTarget.id, null);
      if (!res.success) throw new Error(res.error || 'Gagal melepas peserta dari angkatan.');
      setViewPesertaList((prev) => prev.filter((p) => p.id !== lepasTarget.id));
      setLepasTarget(null);
      await loadData();
      showSuccess('edit', 'Peserta Dilepas!', `${lepasTarget.nama_lengkap} keluar dari angkatan & hilang dari daftar instruktur.`);
    } catch (err: any) {
      showError('Gagal Melepas Peserta', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLepas(false);
    }
  };

  const handleOpenCompletion = async (ang: Angkatan, tempat?: string | null) => {
    setSelectedAngkatanForCompletion(ang);
    setCompletionTempat(tempat ?? null);
    try {
      const res = await angkatanApi.getPendaftar(ang.id);
      const semua = (res.data || []).filter((p: Pendaftar) => p.status === 'diterima');
      if (tempat) {
        const target = normTempat(tempat);
        setCompletionPeserta(semua.filter((p: Pendaftar) => normTempat(p.tempat_pelatihan) === target));
        setCompletionTanpaTempat(semua.filter((p: Pendaftar) => !(p.tempat_pelatihan || '').trim()).length);
      } else {
        setCompletionTanpaTempat(0);
        setCompletionPeserta(semua);
      }
      setLulusPesertaIds(new Set(semua.map((p: Pendaftar) => p.id)));
    } catch {
      const semua = pendaftarList.filter((p) => p.angkatan_id === ang.id && p.status === 'diterima');
      if (tempat) {
        const target = normTempat(tempat);
        setCompletionPeserta(semua.filter((p) => normTempat(p.tempat_pelatihan) === target));
        setCompletionTanpaTempat(semua.filter((p) => !(p.tempat_pelatihan || '').trim()).length);
      } else {
        setCompletionTanpaTempat(0);
        setCompletionPeserta(semua);
      }
      setLulusPesertaIds(new Set(semua.map((p) => p.id)));
    }
  };

  const handleCompleteAngkatan = async () => {
    if (!selectedAngkatanForCompletion) return;
    setIsCompleting(true);
    try {
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const results = await Promise.all(completionPeserta.map((p) => kelulusanApi.create({
        pendaftar_id: p.id, nilai_pretest: 0, nilai_posttest: 0, nilai_kehadiran: 0,
        nilai_tugas: 0, nilai_akhir: 0,
        status_kelulusan: lulusPesertaIds.has(p.id) ? 'Lulus' : 'Tidak_Lulus',
        tanggal_lulus: today,
      })));
      if (results.some((result) => !result.success)) {
        throw new Error(results.find((result) => !result.success)?.error || 'Sebagian data kelulusan gagal disimpan.');
      }
      if (completionTempat) {
        // Selesaikan SATU kelas — backend otomatis menyelesaikan angkatan
        // bila seluruh kelasnya sudah selesai.
        const sel = await penyelesaianApi.selesaikan({
          angkatan_id: selectedAngkatanForCompletion.id,
          tempat_pelatihan: completionTempat,
        });
        if (!sel.success) throw new Error(sel.error || 'Gagal menyimpan penyelesaian kelas.');
        setSelectedAngkatanForCompletion(null);
        setCompletionTempat(null);
        await loadData();
        await loadKelasData();
        showSuccess(
          'edit',
          sel.data?.angkatan_selesai ? 'Angkatan Otomatis Selesai!' : 'Kelas Diselesaikan!',
          sel.message || 'Kelulusan kelas tersimpan.',
        );
      } else {
        await angkatanApi.updateStatus(selectedAngkatanForCompletion.id, 'Selesai');
        setSelectedAngkatanForCompletion(null);
        setCompletionTempat(null);
        await loadData();
        showSuccess('edit', 'Angkatan Diselesaikan', 'Kelulusan tersimpan. Peserta yang lulus otomatis berstatus Lulus dan tetap tercatat di angkatan.');
      }
    } catch (err: any) {
      showError('Gagal Menyelesaikan Angkatan', err?.message || 'Kelulusan peserta belum tersimpan.');
    } finally {
      setIsCompleting(false);
    }
  };

  // Normalisasi nama tempat: "Gedung X (Jl. ...)" -> "gedung x"
  // (pola yang sama dipakai backend saat mencocokkan sesi).
  const normTempat = (t?: string | null) => (t || '').split(' (')[0].trim().toLowerCase();

  const todayLocal = () => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  // Daftar kelas (per tempat) suatu angkatan beserta tanggal sesi terakhir
  // dan status penyelesaiannya.
  const kelasOfAngkatan = (angId: string) => {
    const map = new Map<string, JadwalPelatihan[]>();
    for (const j of jadwalList) {
      if (j.angkatan_id !== angId || !j.tempat_pelatihan) continue;
      const arr = map.get(j.tempat_pelatihan) || [];
      arr.push(j);
      map.set(j.tempat_pelatihan, arr);
    }
    return [...map.entries()].map(([tempat, sessions]) => {
      const dates = sessions
        .map((s) => String(s.tanggal || '').split('T')[0])
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort();
      return {
        tempat,
        sessions,
        lastTanggal: dates.length > 0 ? dates[dates.length - 1] : null as string | null,
        selesai: penyelesaianList.some(
          (s) => s.angkatan_id === angId && s.tempat_pelatihan === tempat,
        ),
      };
    });
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
    setStatus(ang.status || 'On_Going');
    setShowAddModal(true);
  };

  const handleSaveAngkatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode || !nama || !tglMulai || !tglSelesai) return;

    setIsSubmitting(true);
    const isEdit = Boolean(editingAngkatan);
    showLoading(
      isEdit ? 'edit' : 'add',
      isEdit ? 'Memperbarui Data Angkatan...' : 'Membuat Angkatan Baru...',
      'Sedang memproses dan menyimpan ke sistem...'
    );

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
        status,
      };

      if (editingAngkatan) {
        await angkatanApi.update(editingAngkatan.id, payload);
      } else {
        await angkatanApi.create(payload);
      }

      const savedName = nama;
      setShowAddModal(false);
      setEditingAngkatan(null);
      await loadData();
      showSuccess(
        isEdit ? 'edit' : 'add',
        isEdit ? 'Data Angkatan Berhasil Diperbarui!' : 'Angkatan Baru Berhasil Dibuat!',
        `Angkatan "${savedName}" telah tersimpan.`
      );
    } catch (err: any) {
      console.error('Error saving angkatan:', err);
      showError('Gagal Menyimpan Angkatan', err?.message || 'Mohon periksa kembali inputan Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name?: string) => {
    setDeleteTarget({ id, name: name || 'Angkatan' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    showLoading('delete', `Menghapus ${deleteTarget.name}...`, 'Sedang menghapus data dari sistem...');

    try {
      await angkatanApi.destroy(deleteTarget.id);
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      await loadData();
      showSuccess('delete', 'Data Angkatan Berhasil Dihapus!', `"${deletedName}" telah dihapus.`);
    } catch (err: any) {
      console.error('Error deleting angkatan:', err);
      showError('Gagal Menghapus Angkatan', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePesertaInAngkatan = async (pendaftarId: string) => {
    if (!selectedAngkatanForPlotting) return;
    const freshStatus = angkatanList.find((a) => a.id === selectedAngkatanForPlotting.id)?.status;
    if (freshStatus === 'Selesai' || selectedAngkatanForPlotting.status === 'Selesai') {
      showError('Angkatan Selesai', 'Plotting dikunci — angkatan ini sudah diselesaikan.');
      return;
    }

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

  // Hitung jumlah peserta terdaftar secara akurat dari pendaftarList / relasi / pendaftar_count.
  // Lulusan tetap dihitung sebagai anggota angkatan.
  const getFilledCount = (ang: Angkatan) => {
    const listCount = pendaftarList.filter((p) => p.angkatan_id === ang.id && isAnggotaAngkatan(p.status)).length;
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

                {/* Kelas per Tempat + Penyelesaian per-kelas */}
                {(() => {
                  const kelasList = kelasOfAngkatan(ang.id);
                  if (kelasList.length === 0) return null;
                  const today = todayLocal();
                  return (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 overflow-hidden">
                      <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100/70 border-b border-slate-200/70">
                        Kelas Pelatihan ({kelasList.length} tempat)
                      </div>
                      <div className="divide-y divide-slate-200/70">
                        {kelasList.map((k) => {
                          const siap = !k.selesai && ang.status !== 'Selesai' && k.lastTanggal !== null && k.lastTanggal <= today;
                          return (
                            <div key={k.tempat} className="px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate" title={k.tempat}>
                                  {k.tempat}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {k.sessions.length} sesi • terakhir {k.lastTanggal ? formatDateOnly(k.lastTanggal) : '-'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {k.selesai ? (
                                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                                    ✓ Selesai
                                  </span>
                                ) : siap ? (
                                  <button
                                    onClick={() => handleOpenCompletion(ang, k.tempat)}
                                    className="btn btn-sm text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Selesaikan Kelas
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                    {ang.status === 'Selesai' ? 'Selesai' : 'Berjalan'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
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

                  {ang.status !== 'Selesai' && (
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
                  )}
                  {isTrainingFinished(ang) && ang.status !== 'Selesai' && kelasOfAngkatan(ang.id).length === 0 && (
                    <button onClick={() => handleOpenCompletion(ang)} className="btn btn-sm text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                      Selesaikan Angkatan
                    </button>
                  )}
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

      {selectedAngkatanForCompletion && (
        <div className="modal-overlay" onClick={() => { if (!isCompleting) { setSelectedAngkatanForCompletion(null); setCompletionTempat(null); } }}>
          <div className="modal-content max-w-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-800">
                Selesaikan {selectedAngkatanForCompletion.nama_angkatan}
                {completionTempat ? ` — ${completionTempat}` : ''}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {completionTempat
                  ? 'Centang peserta kelas ini yang dinyatakan lulus. Bila seluruh kelas selesai, status angkatan otomatis menjadi Selesai.'
                  : 'Centang peserta yang dinyatakan lulus. Peserta yang tidak dicentang akan disimpan sebagai tidak lulus.'}
              </p>
              {completionTempat && completionTanpaTempat > 0 && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                  {completionTanpaTempat} peserta belum punya tempat pelatihan — tetapkan tempatnya dulu via Detail Profil agar ikut terselesaikan.
                </p>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {completionPeserta.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={lulusPesertaIds.has(p.id)} onChange={(e) => setLulusPesertaIds((current) => {
                    const next = new Set(current); e.target.checked ? next.add(p.id) : next.delete(p.id); return next;
                  })} className="w-4 h-4 accent-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">{p.nama_lengkap}</span>
                  <span className="ml-auto font-mono text-[10px] text-slate-500">{p.no_pendaftaran}</span>
                </label>
              ))}
              {!completionPeserta.length && <p className="text-center text-xs text-slate-500 py-8">Tidak ada peserta diterima pada angkatan ini.</p>}
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <button disabled={isCompleting} onClick={() => { setSelectedAngkatanForCompletion(null); setCompletionTempat(null); }} className="btn btn-outline btn-sm">Batal</button>
              <button disabled={isCompleting || !completionPeserta.length} onClick={handleCompleteAngkatan} className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-60">
                {isCompleting ? 'Menyimpan...' : 'Simpan Kelulusan & Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Angkatan */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { if (!isSubmitting) setShowAddModal(false); }}>
          <div className="modal-content relative max-w-lg p-6 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {isSubmitting && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-progress-infinite" />
              </div>
            )}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingAngkatan ? 'Edit Data Angkatan' : 'Buat Angkatan Pelatihan Baru'}
              </h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-black disabled:opacity-40"
              >
                ✕
              </button>
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
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline btn-sm disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isSubmitting
                    ? (editingAngkatan ? 'Memperbarui...' : 'Menyimpan...')
                    : (editingAngkatan ? 'Simpan Perubahan' : 'Simpan Angkatan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Plotting Peserta ke Angkatan — terkunci otomatis bila Selesai */}
      {selectedAngkatanForPlotting &&
        (angkatanList.find((a) => a.id === selectedAngkatanForPlotting.id)?.status || selectedAngkatanForPlotting.status) !== 'Selesai' && (
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

              {pendaftarList.filter((p) => p.status === 'diterima').map((p) => {
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
        // Status terbaru dari state (bisa berubah otomatis setelah kelas selesai).
        const viewAngStatus = angkatanList.find((a) => a.id === ang.id)?.status || ang.status;

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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                          <span className="font-bold text-slate-800 text-sm">{p.nama_lengkap}</span>
                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {p.no_pendaftaran}
                          </span>
                          <span className={getStatusBadgeClass(p.status)}>{getStatusLabel(p.status)}</span>
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
                          {p.status_pembayaran === 'lunas' ? 'LUNAS' : p.status_pembayaran === 'cicilan_sebagian' ? 'SEBAGIAN' : 'BELUM BAYAR'}
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

                        {viewAngStatus !== 'Selesai' && (
                        <button
                          onClick={() => setLepasTarget(p)}
                          title="Lepas peserta dari angkatan ini (keluar dari kelas)"
                          className="btn btn-outline btn-sm text-xs font-bold flex items-center gap-1 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>Lepas</span>
                        </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                {viewAngStatus !== 'Selesai' ? (
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
                ) : (
                  <span className="text-[11px] italic text-slate-400">Angkatan selesai — plotting dikunci.</span>
                )}

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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Data Angkatan?"
        message="Anda yakin ingin menghapus angkatan pelatihan"
        itemName={deleteTarget?.name || null}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      {/* Konfirmasi Lepas Peserta dari Angkatan */}
      <DeleteConfirmModal
        open={Boolean(lepasTarget)}
        title="Lepas Peserta dari Angkatan?"
        message="Peserta akan keluar dari kelas: angkatan dikosongkan & seluruh sesi dilepas sehingga hilang dari daftar instruktur. Riwayat nilai/ujian/pembayaran tetap tersimpan dan bisa dialokasikan ulang."
        itemName={lepasTarget ? `${lepasTarget.nama_lengkap} (${lepasTarget.no_pendaftaran})` : null}
        loading={isLepas}
        onConfirm={confirmLepasDariAngkatan}
        onCancel={() => {
          if (!isLepas) setLepasTarget(null);
        }}
      />

      {/* Action Toast Feedback */}
      <ActionToast toast={actionToast} onClose={hideToast} />
    </div>
  );
}
