'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { angkatanApi, pendaftarApi, jadwalApi, tempatApi } from '@/lib/api';
import type { Angkatan, Pendaftar, JadwalPelatihan, TempatPelatihan, JenisSesi } from '@/lib/types';
import AdminPendaftarDetail from '@/Components/AdminPendaftarDetail';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';

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

export default function JadwalManager() {
  // Master data
  const [angkatanList, setAngkatanList] = useState<Angkatan[]>([]);
  const [pendaftarList, setPendaftarList] = useState<Pendaftar[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelatihan[]>([]);
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>([]);

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form State: Buat Paket Jadwal Baru (Milih Angkatan + Milih Tempat)
  const [cAngkatanId, setCAngkatanId] = useState<string>('');
  const [cTempatName, setCTempatName] = useState<string>('');
  const [cRuangan, setCRuangan] = useState<string>('Ruang Teori A');
  const [cPengajar, setCPengajar] = useState<string>('Hj. Siti Rahmah, S.Ds');
  const [autoGenerate10Days, setAutoGenerate10Days] = useState<boolean>(true);

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

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [aRes, pRes, jRes, tRes] = await Promise.all([
        angkatanApi.list(),
        pendaftarApi.list({ per_page: 100 }),
        jadwalApi.list(),
        tempatApi.list(),
      ]);

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
    } catch (err) {
      console.error('Error loading schedule data:', err);
    }
  }, [cAngkatanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load candidate participants for specific Angkatan when opening detail
  const handleOpenDetailPanel = async (ang: Angkatan) => {
    setSelectedAngkatanForDetail(ang);
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
  };

  // Group schedules by Angkatan ID
  const schedulesByAngkatan = useMemo(() => {
    const map = new Map<string, JadwalPelatihan[]>();
    for (const j of jadwalList) {
      if (j.angkatan_id) {
        const list = map.get(j.angkatan_id) || [];
        list.push(j);
        map.set(j.angkatan_id, list);
      }
    }
    return map;
  }, [jadwalList]);

  const matchesTempat = (venue: string, filter: string) => {
    if (!filter || filter === 'semua') return true;
    if (!venue) return false;
    const normVenue = venue.toLowerCase();
    const normFilter = filter.toLowerCase();

    // Gedung LPK Leles Utama -> Match "utama"
    if (normFilter.includes('utama')) {
      return normVenue.includes('utama');
    }

    // Workshop Menjahit Leles -> Match "workshop" or "menjahit"
    if (normFilter.includes('workshop') || normFilter.includes('menjahit')) {
      return normVenue.includes('workshop') || normVenue.includes('menjahit');
    }

    // Kampus Cabang Garut Kota -> Match "garut" or "cabang" or "kampus"
    if (normFilter.includes('garut') || normFilter.includes('cabang') || normFilter.includes('kampus')) {
      return normVenue.includes('garut') || normVenue.includes('cabang') || normVenue.includes('kampus');
    }

    return normVenue.includes(normFilter) || normFilter.includes(normVenue);
  };

  // Filtered Cards by Tempat & Search
  const filteredAngkatanCards = useMemo(() => {
    return angkatanList.filter((ang) => {
      const angSchedules = schedulesByAngkatan.get(ang.id) || [];
      const venueName = angSchedules[0]?.tempat_pelatihan || tempatList[0]?.nama_tempat || 'Gedung LPK Leles Utama';

      if (!matchesTempat(venueName, filterTempat)) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNama = ang.nama_angkatan.toLowerCase().includes(q);
        const matchKode = ang.kode_angkatan.toLowerCase().includes(q);
        const matchTempat = venueName.toLowerCase().includes(q);
        return matchNama || matchKode || matchTempat;
      }

      return true;
    });
  }, [angkatanList, schedulesByAngkatan, filterTempat, searchQuery]);

  // Handler: Buat Paket Jadwal Baru (Form Milih Angkatan + Tempat)
  const handleCreateJadwalPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cAngkatanId || !cTempatName) return;

    try {
      setIsGenerating(true);
      const targetAngkatan = angkatanList.find((a) => a.id === cAngkatanId);
      const programNama = targetAngkatan?.program?.nama || targetAngkatan?.program_id || 'Tata Boga & Pastry';

      if (autoGenerate10Days) {
        const startDate = targetAngkatan?.tanggal_mulai
          ? new Date(targetAngkatan.tanggal_mulai)
          : new Date();

        for (const tmpl of TEMPLATE_10_HARI) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + (tmpl.hari - 1));
          const dateStr = currentDate.toISOString().split('T')[0];

          await jadwalApi.create({
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
        }
      } else {
        await jadwalApi.create({
          judul: `Sesi Perdana Pelatihan - ${targetAngkatan?.kode_angkatan}`,
          jenis_pelatihan: programNama,
          angkatan_id: cAngkatanId,
          hari_ke: 1,
          tanggal: targetAngkatan?.tanggal_mulai ? targetAngkatan.tanggal_mulai.split('T')[0] : new Date().toISOString().split('T')[0],
          jam: '08:00 - 12:00',
          ruangan: cRuangan,
          tempat_pelatihan: cTempatName,
          pengajar: cPengajar,
          jenis_sesi: 'Teori',
          status: 'akan_datang',
        });
      }

      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      console.error('Error creating jadwal package:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Tarik Peserta Massal ke Paket Jadwal (Hari 1 - 10)
  const handleBulkPullParticipants = async (ang: Angkatan) => {
    const angSchedules = schedulesByAngkatan.get(ang.id) || [];
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
      const participantIds = angkatanCandidates.map((p) => p.id);

      for (const sched of angSchedules) {
        await jadwalApi.addPeserta(sched.id, participantIds);
      }

      await loadData();
    } catch (err) {
      console.error('Error bulk pulling participants:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Tarik / Keluarkan Peserta Satu Per Satu (Granular)
  const handleToggleSingleParticipant = async (ang: Angkatan, pendaftarId: string, isCurrentlyAdded: boolean) => {
    const angSchedules = schedulesByAngkatan.get(ang.id) || [];
    if (angSchedules.length === 0) {
      alert('Belum ada sesi harian. Silakan buat/generate sesi harian terlebih dahulu.');
      return;
    }

    try {
      setIsGenerating(true);
      for (const sched of angSchedules) {
        if (isCurrentlyAdded) {
          await jadwalApi.removePeserta(sched.id, pendaftarId);
        } else {
          await jadwalApi.addPeserta(sched.id, [pendaftarId]);
        }
      }
      await loadData();
    } catch (err) {
      console.error('Error toggling single participant:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Generate 10-Hari Otomatis dari Dalam Detail
  const handleGenerate10DaysForDetail = async (ang: Angkatan, venueName: string) => {
    try {
      setIsGenerating(true);
      const programNama = ang.program?.nama || ang.program_id || 'Tata Boga & Pastry';
      const startDate = ang.tanggal_mulai ? new Date(ang.tanggal_mulai) : new Date();

      for (const tmpl of TEMPLATE_10_HARI) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (tmpl.hari - 1));
        const dateStr = currentDate.toISOString().split('T')[0];

        await jadwalApi.create({
          judul: `${tmpl.judul} - ${ang.kode_angkatan}`,
          jenis_pelatihan: programNama,
          angkatan_id: ang.id,
          hari_ke: tmpl.hari,
          tanggal: dateStr,
          jam: tmpl.jam,
          ruangan: tmpl.ruangan,
          tempat_pelatihan: venueName,
          pengajar: ang.instruktur_nama || 'Hj. Siti Rahmah, S.Ds',
          jenis_sesi: tmpl.sesi,
          status: 'akan_datang',
        });
      }

      await loadData();
    } catch (err) {
      console.error('Error generating 10 days:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Simpan / Update Single Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAngkatanForDetail || !sJudul || !sTanggal) return;

    try {
      const ang = selectedAngkatanForDetail;
      const angSchedules = schedulesByAngkatan.get(ang.id) || [];
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

      if (editingSession) {
        await jadwalApi.update(editingSession.id, payload);
      } else {
        await jadwalApi.create(payload);
      }

      setShowAddSessionModal(false);
      setEditingSession(null);
      await loadData();
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const handleDeleteSession = (id: string, name: string = 'sesi harian ini') => {
    setDeleteTarget({ id, name });
  };

  const confirmDeleteSession = async () => {
    if (!deleteTarget) return;
    await jadwalApi.destroy(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  // =========================================================================
  // VIEW MODE 2: INLINE DETAIL VIEW PANEL (Bukan Popup Modal Floating)
  // =========================================================================
  if (selectedAngkatanForDetail) {
    const ang = selectedAngkatanForDetail;
    const angSchedules = schedulesByAngkatan.get(ang.id) || [];
    const venue = angSchedules[0]?.tempat_pelatihan || cTempatName;
    const room = angSchedules[0]?.ruangan || cRuangan;

    // ID Peserta yang saat ini sudah ditarik di paket jadwal ini
    const pulledParticipants = angSchedules[0]?.peserta || [];
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
            <span>Kembali ke Daftar Paket Jadwal</span>
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
              <div className="font-bold text-slate-800 text-sm mt-0.5">{angSchedules[0]?.pengajar || ang.instruktur_nama}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Rentang Pelatihan</div>
              <div className="font-bold font-mono text-slate-800 text-xs mt-0.5">
                {formatDateOnly(ang.tanggal_mulai)} s.d. {formatDateOnly(ang.tanggal_selesai)}
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 1: PESERTA YANG SUDAH DITARIK KE PAKET JADWAL INI */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-base">Bagian 1: Peserta Terdaftar Di Paket Jadwal Ini</h4>
              <p className="text-xs text-slate-500">
                Daftar peserta yang dialokasikan mengikuti sesi pelatihan di tempat <b>{venue}</b> ({pulledParticipants.length} orang)
              </p>
            </div>

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
          </div>

          {/* List Peserta yang Sudah Ditarik */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {pulledParticipants.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl space-y-1">
                <div className="font-semibold text-slate-600">Belum ada peserta yang ditarik ke paket jadwal ini.</div>
                <div>Klik tombol <b>"+ Tarik / Pilih Peserta Angkatan"</b> di atas untuk menarik peserta dari {ang.nama_angkatan}.</div>
              </div>
            ) : (
              pulledParticipants.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all"
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
                      NIK: {p.nik} • {p.jenis_kelamin} • HP: {p.no_hp}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => setViewingParticipantDetail(p)}
                      className="btn btn-outline btn-sm text-[11px] py-1 px-2.5 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => handleToggleSingleParticipant(ang, p.id, true)}
                      disabled={isGenerating}
                      className="btn btn-danger btn-sm text-[11px] py-1 px-2.5 font-semibold"
                    >
                      Keluarkkan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BAGIAN 2: PENYUSUNAN JADWAL SESI HARI 1 S.D. 10 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-base">Bagian 2: Penyusunan Jadwal Sesi Hari 1 s.d. 10</h4>
              <p className="text-xs text-slate-500">Kelola dan susun sesi harian (Hari 1 s.d 10) di {venue}</p>
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
                  setSJudul('');
                  setSHariKe(angSchedules.length + 1);
                  setSTanggal(ang.tanggal_mulai ? ang.tanggal_mulai.split('T')[0] : new Date().toISOString().split('T')[0]);
                  setSJam('08:00 - 12:00');
                  setSRuangan(room);
                  setSPengajar(angSchedules[0]?.pengajar || ang.instruktur_nama || 'Hj. Siti Rahmah, S.Ds');
                  setSJenisSesi('Teori');
                  setShowAddSessionModal(true);
                }}
                className="btn btn-primary btn-sm text-xs font-bold"
              >
                + Tambah Sesi Harian
              </button>
            </div>
          </div>

          {/* List Sesi Harian */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {angSchedules.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl">
                Belum ada sesi harian. Klik <b>"Generate Hari 1-10 Otomatis"</b> atau <b>"+ Tambah Sesi Harian"</b>.
              </div>
            ) : (
              angSchedules.map((s) => {
                const countPeserta = (s.peserta || []).length;
                const isPretest = s.hari_ke === 1 || s.judul.toLowerCase().includes('pretest');
                const isPosttest = s.hari_ke === 10 || s.judul.toLowerCase().includes('posttest');

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.hari_ke && (
                          <span className="font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px]">
                            Hari {s.hari_ke}
                          </span>
                        )}
                        <span className="font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]">
                          {s.jenis_sesi}
                        </span>
                        {isPretest && (
                          <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                            Pre-test
                          </span>
                        )}
                        {isPosttest && (
                          <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                            Post-test Ujian
                          </span>
                        )}
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                          {countPeserta} Peserta
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{s.judul}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatDateOnly(s.tanggal)} • {s.jam} • Ruang: {s.ruangan} • Pengajar: {s.pengajar}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                      <button
                        onClick={() => {
                          setEditingSession(s);
                          setSJudul(s.judul);
                          setSHariKe(s.hari_ke || 1);
                          setSTanggal(s.tanggal ? s.tanggal.split('T')[0] : '');
                          setSJam(s.jam);
                          setSRuangan(s.ruangan);
                          setSPengajar(s.pengajar);
                          setSJenisSesi(s.jenis_sesi);
                          setShowAddSessionModal(true);
                        }}
                        className="btn btn-outline btn-sm text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="btn btn-danger btn-sm text-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
              {angkatanCandidates.length > 0 && (
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
                            NIK: {p.nik} • {p.jenis_kelamin} • HP: {p.no_hp}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <button
                            onClick={() => setViewingParticipantDetail(p)}
                            className="btn btn-outline btn-sm text-[11px] py-1 px-2.5 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                          >
                            Detail
                          </button>

                          {isPulled ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                Terdaftar Di Jadwal
                              </span>
                              <button
                                onClick={() => handleToggleSingleParticipant(ang, p.id, true)}
                                disabled={isGenerating}
                                className="btn btn-danger btn-sm text-[11px] py-1 px-2 font-semibold"
                              >
                                Keluarkkan
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleSingleParticipant(ang, p.id, false)}
                              disabled={isGenerating}
                              className="btn btn-accent btn-sm text-[11px] py-1 px-3 font-bold"
                            >
                              + Tarik Peserta Ini
                            </button>
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
          <div className="modal-overlay" onClick={() => setShowAddSessionModal(false)}>
            <div className="modal-content max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingSession ? 'Edit Sesi Harian' : 'Tambah Sesi Harian Pelatihan'}
                </h3>
                <button onClick={() => setShowAddSessionModal(false)} className="text-slate-400 hover:text-black">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
                <div>
                  <label className="form-label font-bold text-slate-700">Judul Sesi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Misal: Hari 1: Orientasi Program Pelatihan"
                    value={sJudul}
                    onChange={(e) => setSJudul(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label font-bold text-slate-700">Hari Ke-</label>
                    <input
                      type="number"
                      className="form-input"
                      value={sHariKe}
                      onChange={(e) => setSHariKe(Number(e.target.value))}
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
                      onChange={(e) => setSTanggal(e.target.value)}
                      required
                    />
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
                    <input
                      type="text"
                      className="form-input"
                      value={sPengajar}
                      onChange={(e) => setSPengajar(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddSessionModal(false)} className="btn btn-outline btn-sm">
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm font-bold">
                    {editingSession ? 'Simpan Perubahan' : 'Tambah Sesi'}
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Kelola Jadwal & Lokasi Pelatihan</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Buat Paket Jadwal (Milih Angkatan + Tempat Pelatihan) ➔ Klik Card Kotak untuk Tarik Peserta & Susun Jadwal Hari 1-10
          </p>
        </div>
        <button
          onClick={() => {
            if (angkatanList.length > 0 && !cAngkatanId) setCAngkatanId(angkatanList[0].id);
            setShowCreateModal(true);
          }}
          className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold self-start sm:self-auto shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Buat Jadwal Baru</span>
        </button>
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

      {/* GRID LIST CARD KOTAK (SIMPLIFIED & CLEANED RENTANG TANGGAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAngkatanCards.map((ang) => {
          const angSchedules = schedulesByAngkatan.get(ang.id) || [];
          const venue = angSchedules[0]?.tempat_pelatihan || tempatList[0]?.nama_tempat || 'Gedung LPK Leles Utama';
          const room = angSchedules[0]?.ruangan || 'Ruang Teori A';
          const pengajar = angSchedules[0]?.pengajar || ang.instruktur_nama || 'Hj. Siti Rahmah, S.Ds';
          const totalPulledPeserta = angSchedules[0]?.peserta_count || (angSchedules[0]?.peserta || []).length;
          const totalSessions = angSchedules.length;

          return (
            <div
              key={ang.id}
              onClick={() => handleOpenDetailPanel(ang)}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {ang.kode_angkatan}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${ang.status === 'On_Going'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    {ang.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                    {ang.nama_angkatan}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Program: <span className="font-semibold text-slate-700">{ang.program?.nama || ang.program_id}</span>
                  </p>
                </div>

                {/* Info Card Kotak (Tempat Pelatihan & Formatted Tanggal) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-1.5 text-indigo-900 font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 shrink-0 mt-0.5">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="leading-snug">{venue} ({room})</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Pengajar:</span>
                    <span className="font-medium text-slate-800">{pengajar}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Rentang Pelatihan:</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {formatDateOnly(ang.tanggal_mulai)} - {formatDateOnly(ang.tanggal_selesai)}
                    </span>
                  </div>
                </div>

                {/* Metric Indicators */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                    <div className="text-[10px] text-indigo-600 font-semibold">Peserta Ditarik</div>
                    <div className="font-extrabold text-indigo-900 text-sm">{totalPulledPeserta} Peserta</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <div className="text-[10px] text-emerald-600 font-semibold">Sesi Hari</div>
                    <div className="font-extrabold text-emerald-900 text-sm">{totalSessions} Sesi (1-10)</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                <span>Klik Untuk Kelola Jadwal Hari 1-10 & Tarik Peserta</span>
                <span>→</span>
              </div>
            </div>
          );
        })}

        {filteredAngkatanCards.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs border border-dashed rounded-2xl bg-white">
            Tidak ada paket jadwal yang ditemukan. Klik tombol <b>"+ Buat Jadwal Baru"</b> untuk membuat alokasi jadwal angkatan & tempat.
          </div>
        )}
      </div>

      {/* FORM MODAL: BUAT JADWAL BARU */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Buat Kelola Jadwal Baru</h3>
                <p className="text-[11px] text-slate-500">Form memilih angkatan dan alokasi tempat pelatihan</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-black">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJadwalPackage} className="space-y-4 text-xs">
              <div>
                <label className="form-label font-bold text-slate-700">1. Pilih Angkatan Pelatihan</label>
                <select
                  className="form-input"
                  value={cAngkatanId}
                  onChange={(e) => setCAngkatanId(e.target.value)}
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
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Pengajar"
                    value={cPengajar}
                    onChange={(e) => setCPengajar(e.target.value)}
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
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline btn-sm">
                  Batal
                </button>
                <button type="submit" disabled={isGenerating} className="btn btn-primary btn-sm font-bold">
                  {isGenerating ? 'Memproses...' : 'Buat Paket Jadwal'}
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
    </div>
  );
}
