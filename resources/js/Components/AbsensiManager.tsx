'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  MataPelajaran,
  Nilai,
  Pendaftar,
  Angkatan,
  Program,
  HasilUjian,
  AbsensiData,
  AbsensiKehadiran,
} from '@/lib/types';
import { mataPelajaranApi, nilaiApi, absensiApi } from '@/lib/api';
import Pagination from '@/Components/Pagination';

type SubTab = 'mata_pelajaran';

interface AbsensiManagerProps {
  angkatanList: Angkatan[];
  programList: Program[];
}

// ─── Colour helpers ─────────────────────────────────────────────
function nilaiColor(n: number) {
  if (n >= 80) return 'text-emerald-700 font-bold';
  if (n >= 65) return 'text-blue-700 font-semibold';
  if (n >= 50) return 'text-amber-700 font-semibold';
  return 'text-red-600 font-bold';
}
function nilaiGrade(n: number) {
  if (n >= 85) return 'A';
  if (n >= 75) return 'B';
  if (n >= 65) return 'C';
  if (n >= 50) return 'D';
  return 'E';
}

export default function AbsensiManager({ angkatanList, programList }: AbsensiManagerProps) {
  const [subTab, setSubTab] = useState<SubTab>('mata_pelajaran');
  const [mataPelajaranPage, setMataPelajaranPage] = useState(1);
  const pageSize = 10;

  // ── Mata Pelajaran State ────────────────────────────────────────
  const [mpList, setMpList] = useState<MataPelajaran[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [showMpModal, setShowMpModal] = useState(false);
  const [editingMp, setEditingMp] = useState<MataPelajaran | null>(null);
  const [mpKode, setMpKode] = useState('');
  const [mpNama, setMpNama] = useState('');
  const [mpDeskripsi, setMpDeskripsi] = useState('');
  const [mpProgramId, setMpProgramId] = useState('');
  const [mpUrutan, setMpUrutan] = useState(0);
  const [filterMpProgram, setFilterMpProgram] = useState('');



  // ── Load Mata Pelajaran ─────────────────────────────────────────
  const loadMp = useCallback(async () => {
    setMpLoading(true);
    const res = await mataPelajaranApi.list(filterMpProgram ? { program_id: filterMpProgram } : undefined);
    if (res.success && res.data) setMpList(res.data);
    setMpLoading(false);
  }, [filterMpProgram]);

  useEffect(() => { loadMp(); }, [loadMp]);

  // ── MP Modal Handlers ───────────────────────────────────────────
  function openAddMp() {
    setEditingMp(null);
    setMpKode('');
    setMpNama('');
    setMpDeskripsi('');
    setMpProgramId('');
    setMpUrutan(mpList.length + 1);
    setShowMpModal(true);
  }
  function openEditMp(mp: MataPelajaran) {
    setEditingMp(mp);
    setMpKode(mp.kode);
    setMpNama(mp.nama);
    setMpDeskripsi(mp.deskripsi || '');
    setMpProgramId(mp.program_id || '');
    setMpUrutan(mp.urutan);
    setShowMpModal(true);
  }
  async function handleSaveMp(e: React.FormEvent) {
    e.preventDefault();
    const payload = { kode: mpKode, nama: mpNama, deskripsi: mpDeskripsi || undefined, program_id: mpProgramId || undefined, urutan: mpUrutan };
    if (editingMp) {
      await mataPelajaranApi.update(editingMp.id, payload);
    } else {
      await mataPelajaranApi.create(payload);
    }
    setShowMpModal(false);
    loadMp();
  }
  async function handleDeleteMp(id: string) {
    if (!confirm('Hapus mata pelajaran ini? Nilai yang sudah diinput akan terhapus.')) return;
    await mataPelajaranApi.destroy(id);
    loadMp();
  }

  // ── Load Penilaian Data ─────────────────────────────────────────
  async function loadPenilaian() {
    if (!nilaiAngkatan) return;
    setPenilaianLoading(true);
    const res = await absensiApi.get({ angkatan_id: nilaiAngkatan, program_id: nilaiProgram || undefined });
    if (res.success && res.data) {
      setPenilaianData(res.data);
      // Pre-fill local nilai from server data
      const local: Record<string, Record<string, number>> = {};
      for (const p of res.data.peserta) {
        local[p.id] = {};
        // Fill nilai mata pelajaran
        for (const n of res.data.nilai.filter((n) => n.pendaftar_id === p.id)) {
          const key = n.mata_pelajaran_id ? `mp_${n.mata_pelajaran_id}` : n.tipe_nilai;
          local[p.id][key] = n.nilai;
        }
        // Auto-fill posttest → ujian akhir
        const posttest = res.data.hasil_posttest[p.id];
        if (posttest && !local[p.id]['posttest']) {
          local[p.id]['posttest'] = posttest.nilai;
        }
        // Auto-fill pretest
        const pretest = res.data.hasil_pretest[p.id];
        if (pretest && !local[p.id]['pretest']) {
          local[p.id]['pretest'] = pretest.nilai;
        }
        // Auto-fill kehadiran
        const keh = res.data.kehadiran[p.id];
        if (keh && !local[p.id]['kehadiran']) {
          local[p.id]['kehadiran'] = keh.persen;
        }
      }
      setLocalNilai(local);
    }
    setPenilaianLoading(false);
  }

  // ── Save Nilai Bulk ─────────────────────────────────────────────
  async function handleSaveNilai() {
    setSavingNilai(true);
    const bulkData: Array<any> = [];
    for (const [pendaftarId, cols] of Object.entries(localNilai)) {
      for (const [key, nilai] of Object.entries(cols)) {
        if (key.startsWith('mp_')) {
          const mpId = key.replace('mp_', '');
          bulkData.push({ pendaftar_id: pendaftarId, mata_pelajaran_id: mpId, tipe_nilai: 'mata_pelajaran', nilai });
        } else if (['pretest', 'posttest', 'kehadiran'].includes(key)) {
          bulkData.push({ pendaftar_id: pendaftarId, tipe_nilai: key, nilai });
        }
      }
    }
    await nilaiApi.bulk(bulkData);
    setSavingNilai(false);
    setSavedMsg('Nilai berhasil disimpan!');
    setTimeout(() => setSavedMsg(''), 3000);
  }

  // ── Load Absensi Cetak ─────────────────────────────────────────
  async function loadAbsensi() {
    if (!absensiAngkatan) return;
    setAbsensiLoading(true);
    const res = await absensiApi.get({ angkatan_id: absensiAngkatan, program_id: absensiProgram || undefined });
    if (res.success && res.data) setAbsensiData(res.data);
    setAbsensiLoading(false);
  }

  // ── Print Handler ──────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }



  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-extrabold text-[var(--text-primary)] text-lg">Daftar Mata Pelatihan</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Kelola modul / mata pelatihan yang diajarkan pada setiap program pelatihan</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="form-input text-xs py-1.5 px-3 w-auto"
              value={filterMpProgram}
              onChange={(e) => setFilterMpProgram(e.target.value)}
            >
              <option value="">Semua Program</option>
              {programList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
            <button onClick={openAddMp} className="btn btn-primary btn-sm flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tambah
            </button>
          </div>
        </div>

        {mpLoading ? (
          <div className="text-center py-10 text-sm text-[var(--text-tertiary)]">Memuat...</div>
        ) : mpList.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-tertiary)]">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            <p className="font-semibold">Belum ada mata pelatihan</p>
            <p className="text-xs mt-1">Tambahkan mata pelatihan untuk digunakan dalam program pelatihan</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--card-border)]">
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">#</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Kode</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Nama Mata Pelatihan</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Program</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Deskripsi</th>
                  <th className="text-left px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Urutan</th>
                  <th className="text-center px-4 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {mpList.slice((mataPelajaranPage - 1) * pageSize, mataPelajaranPage * pageSize).map((mp, idx) => {
                  const prog = programList.find((p) => p.id === mp.program_id);
                  return (
                    <tr key={mp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-[var(--text-tertiary)]">{(mataPelajaranPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{mp.kode}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{mp.nama}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {prog ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">{prog.nama}</span>
                        ) : (
                          <span className="text-[var(--text-tertiary)] italic">Semua Program</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px] truncate">{mp.deskripsi || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-[var(--text-tertiary)]">{mp.urutan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEditMp(mp)} className="btn btn-outline btn-sm text-[10px] py-1 px-2">Edit</button>
                          <button onClick={() => handleDeleteMp(mp.id)} className="btn btn-danger btn-sm text-[10px] py-1 px-2">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination currentPage={mataPelajaranPage} totalItems={mpList.length} pageSize={pageSize} onPageChange={setMataPelajaranPage} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          TAB 2 — PENILAIAN
      ═══════════════════════════════════════════════════ */}
      {subTab === 'penilaian' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-extrabold text-[var(--text-primary)] text-lg">Input Nilai Peserta</h2>
            <p className="text-xs text-[var(--text-tertiary)]">Nilai ujian akhir (posttest) terisi otomatis dari hasil ujian online peserta</p>
          </div>

          {/* Filter */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] flex items-end gap-3 flex-wrap">
            <div>
              <label className="form-label">Angkatan</label>
              <select className="form-input text-xs" value={nilaiAngkatan} onChange={(e) => setNilaiAngkatan(e.target.value)}>
                <option value="">-- Pilih Angkatan --</option>
                {angkatanList.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Program (opsional)</label>
              <select className="form-input text-xs" value={nilaiProgram} onChange={(e) => setNilaiProgram(e.target.value)}>
                <option value="">Semua Program</option>
                {programList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <button onClick={loadPenilaian} disabled={!nilaiAngkatan || penilaianLoading} className="btn btn-primary btn-sm">
              {penilaianLoading ? 'Memuat...' : 'Tampilkan'}
            </button>
          </div>

          {penilaianData && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-tertiary)] font-semibold">
                  {penilaianData.peserta.length} peserta ditemukan
                  {mpForPenilaian.length > 0 && ` · ${mpForPenilaian.length} mata pelajaran`}
                </p>
                <div className="flex items-center gap-3">
                  {savedMsg && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {savedMsg}
                    </span>
                  )}
                  <button onClick={handleSaveNilai} disabled={savingNilai} className="btn btn-accent btn-sm flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    {savingNilai ? 'Menyimpan...' : 'Simpan Semua Nilai'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[var(--card-border)]">
                      <th className="text-left px-3 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] sticky left-0 bg-slate-50 z-10 min-w-[40px]">#</th>
                      <th className="text-left px-3 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] sticky left-8 bg-slate-50 z-10 min-w-[160px]">Nama Peserta</th>
                      {/* Kolom mata pelajaran */}
                      {mpForPenilaian.map((mp) => (
                        <th key={mp.id} className="text-center px-2 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] min-w-[80px]">
                          <div className="font-mono text-indigo-600">{mp.kode}</div>
                          <div className="normal-case font-semibold text-[9px] truncate max-w-[80px]">{mp.nama}</div>
                        </th>
                      ))}
                      <th className="text-center px-2 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] min-w-[80px] bg-amber-50">
                        <div>Pretest</div>
                      </th>
                      <th className="text-center px-2 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] min-w-[80px] bg-emerald-50">
                        <div>Ujian Akhir</div>
                        <div className="text-[9px] normal-case text-emerald-600 font-normal">(Auto dari Posttest)</div>
                      </th>
                      <th className="text-center px-2 py-3 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] min-w-[80px] bg-blue-50">
                        <div>Kehadiran</div>
                        <div className="text-[9px] normal-case text-blue-600 font-normal">(%)</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {penilaianData.peserta.slice((penilaianPage - 1) * pageSize, penilaianPage * pageSize).map((p, idx) => {
                      const nilaiRow = localNilai[p.id] || {};
                      const posttestAuto = penilaianData.hasil_posttest[p.id];
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-3 py-2 font-mono text-[var(--text-tertiary)] sticky left-0 bg-white">{(penilaianPage - 1) * pageSize + idx + 1}</td>
                          <td className="px-3 py-2 sticky left-8 bg-white z-10">
                            <div className="font-bold text-[var(--text-primary)]">{p.nama_lengkap}</div>
                            <div className="text-[10px] font-mono text-[var(--primary)]">{p.no_pendaftaran}</div>
                          </td>
                          {/* Mata pelajaran columns */}
                          {mpForPenilaian.map((mp) => {
                            const key = `mp_${mp.id}`;
                            const val = nilaiRow[key];
                            return (
                              <td key={mp.id} className="px-1 py-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  className={`w-16 text-center text-xs border rounded-lg py-1 px-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${val !== undefined ? nilaiColor(val) : 'text-slate-400'}`}
                                  value={val ?? ''}
                                  placeholder="-"
                                  onChange={(e) => {
                                    const v = e.target.value === '' ? undefined : Number(e.target.value);
                                    setLocalNilai((prev) => ({
                                      ...prev,
                                      [p.id]: { ...prev[p.id], [key]: v as number },
                                    }));
                                  }}
                                />
                              </td>
                            );
                          })}
                          {/* Pretest */}
                          <td className="px-1 py-2 text-center bg-amber-50/40">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              className={`w-16 text-center text-xs border border-amber-200 bg-amber-50 rounded-lg py-1 px-1 focus:outline-none focus:ring-1 focus:ring-amber-400 ${nilaiRow['pretest'] !== undefined ? nilaiColor(nilaiRow['pretest']) : 'text-slate-400'}`}
                              value={nilaiRow['pretest'] ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const v = e.target.value === '' ? undefined : Number(e.target.value);
                                setLocalNilai((prev) => ({ ...prev, [p.id]: { ...prev[p.id], pretest: v as number } }));
                              }}
                            />
                          </td>
                          {/* Ujian Akhir (auto posttest) */}
                          <td className="px-1 py-2 text-center bg-emerald-50/40">
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                className={`w-16 text-center text-xs border border-emerald-200 bg-emerald-50 rounded-lg py-1 px-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 ${nilaiRow['posttest'] !== undefined ? nilaiColor(nilaiRow['posttest']) : 'text-slate-400'}`}
                                value={nilaiRow['posttest'] ?? ''}
                                placeholder={posttestAuto ? String(posttestAuto.nilai) : '-'}
                                onChange={(e) => {
                                  const v = e.target.value === '' ? undefined : Number(e.target.value);
                                  setLocalNilai((prev) => ({ ...prev, [p.id]: { ...prev[p.id], posttest: v as number } }));
                                }}
                              />
                              {posttestAuto && !nilaiRow['posttest'] && (
                                <span className="absolute -top-2 -right-2 text-[8px] bg-emerald-500 text-white rounded-full px-1 font-bold" title="Terisi otomatis dari posttest">Auto</span>
                              )}
                            </div>
                          </td>
                          {/* Kehadiran */}
                          <td className="px-1 py-2 text-center bg-blue-50/40">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              className={`w-16 text-center text-xs border border-blue-200 bg-blue-50 rounded-lg py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-400 ${nilaiRow['kehadiran'] !== undefined ? nilaiColor(nilaiRow['kehadiran']) : 'text-slate-400'}`}
                              value={nilaiRow['kehadiran'] ?? ''}
                              placeholder={penilaianData.kehadiran[p.id] ? String(penilaianData.kehadiran[p.id].persen) : '-'}
                              onChange={(e) => {
                                const v = e.target.value === '' ? undefined : Number(e.target.value);
                                setLocalNilai((prev) => ({ ...prev, [p.id]: { ...prev[p.id], kehadiran: v as number } }));
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination currentPage={penilaianPage} totalItems={penilaianData.peserta.length} pageSize={pageSize} onPageChange={setPenilaianPage} />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Kolom <strong>Ujian Akhir</strong> terisi otomatis dari hasil posttest online. Anda masih bisa mengubahnya secara manual jika diperlukan. Klik <strong>"Simpan Semua Nilai"</strong> untuk menyimpan ke database.</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3 — ABSENSI CETAK
      ═══════════════════════════════════════════════════ */}
      {subTab === 'absensi_cetak' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-extrabold text-[var(--text-primary)] text-lg">Cetak Absensi & Penilaian</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Pilih angkatan dan program, lalu pratinjau dan cetak dokumen absensi formal</p>
            </div>
            {absensiData && (
              <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Cetak / Simpan PDF
              </button>
            )}
          </div>

          {/* Config panel */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="form-label">Angkatan *</label>
                <select className="form-input text-xs" value={absensiAngkatan} onChange={(e) => setAbsensiAngkatan(e.target.value)}>
                  <option value="">-- Pilih Angkatan --</option>
                  {angkatanList.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Program (opsional)</label>
                <select className="form-input text-xs" value={absensiProgram} onChange={(e) => setAbsensiProgram(e.target.value)}>
                  <option value="">Semua Program</option>
                  {programList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Kolom Hadir (hari)</label>
                <input type="number" min={1} max={20} className="form-input text-xs" value={jumlahKolHadir} onChange={(e) => setJumlahKolHadir(Number(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Nama Instruktur</label>
                <input type="text" className="form-input text-xs" placeholder="Nama instruktur" value={namaInstruktur} onChange={(e) => setNamaInstruktur(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Tanggal Mulai</label>
                <input type="date" className="form-input text-xs" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Tanggal Selesai</label>
                <input type="date" className="form-input text-xs" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
              </div>
            </div>
            <button onClick={loadAbsensi} disabled={!absensiAngkatan || absensiLoading} className="btn btn-primary btn-sm">
              {absensiLoading ? 'Memuat...' : 'Tampilkan Pratinjau'}
            </button>
          </div>

          {/* Print Preview */}
          {absensiData && (
            <div className="rounded-xl border-2 border-dashed border-slate-300 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                PRATINJAU DOKUMEN — Klik "Cetak / Simpan PDF" untuk mencetak
              </div>

              {/* Printable area */}
              <div ref={printRef} id="print-absensi" className="bg-white p-6 print-area">

                {/* Document Header */}
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                  <div className="font-extrabold text-xl tracking-wide text-black">LEMBAGA PELATIHAN KERJA (LPK) LELES</div>
                  <div className="text-sm text-gray-700">Jl. Raya Leles No. 1, Garut, Jawa Barat</div>
                  <div className="mt-2 font-bold text-base text-black uppercase tracking-widest">
                    DAFTAR HADIR DAN PENILAIAN PESERTA PELATIHAN
                  </div>
                </div>

                {/* Document info grid */}
                <div className="grid grid-cols-2 gap-x-8 mb-4 text-xs text-black">
                  <div className="space-y-1">
                    <div className="flex"><span className="w-36 font-semibold">Angkatan</span><span>: {selectedAngkatan?.nama || absensiAngkatan}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Program Pelatihan</span><span>: {selectedProgram?.nama || 'Semua Program'}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Instruktur</span><span>: {namaInstruktur || '___________________________'}</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex"><span className="w-36 font-semibold">Tanggal Mulai</span><span>: {tanggalMulai ? new Date(tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '_______________'}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Tanggal Selesai</span><span>: {tanggalSelesai ? new Date(tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '_______________'}</span></div>
                    <div className="flex"><span className="w-36 font-semibold">Jumlah Peserta</span><span>: {absensiData.peserta.length} orang</span></div>
                  </div>
                </div>

                {/* Attendance + Grading Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[10px] text-black" style={{ minWidth: '900px' }}>
                    <thead>
                      {/* Row 1: group headers */}
                      <tr className="bg-gray-100">
                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold w-6">No</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-left font-bold min-w-[120px]">Nama Lengkap</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-left font-bold min-w-[80px]">NIK</th>
                        <th colSpan={jumlahKolHadir} className="border border-black px-1 py-1 text-center font-bold">KEHADIRAN (Pertemuan ke-)</th>
                        {mpForAbsensi.length > 0 && (
                          <th colSpan={mpForAbsensi.length} className="border border-black px-1 py-1 text-center font-bold">NILAI MATA PELAJARAN</th>
                        )}
                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold w-12">Pretest</th>
                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold w-16">Ujian Akhir</th>
                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold w-10">Nilai Rata</th>
                        <th rowSpan={2} className="border border-black px-1 py-1 text-center font-bold w-8">Grade</th>
                        <th rowSpan={2} className="border border-black px-2 py-1 text-center font-bold min-w-[80px]">Tanda Tangan</th>
                      </tr>
                      {/* Row 2: sub-headers */}
                      <tr className="bg-gray-100">
                        {Array.from({ length: jumlahKolHadir }, (_, i) => (
                          <th key={i} className="border border-black px-0.5 py-1 text-center font-bold w-6">{i + 1}</th>
                        ))}
                        {mpForAbsensi.map((mp) => (
                          <th key={mp.id} className="border border-black px-1 py-1 text-center font-bold w-14">
                            <div>{mp.kode}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {absensiData.peserta.slice((absensiPage - 1) * pageSize, absensiPage * pageSize).map((p, idx) => {
                        // Build nilai lookup for this peserta
                        const nilaiP = absensiData.nilai.filter((n) => n.pendaftar_id === p.id);
                        const nilaiByMp: Record<string, number> = {};
                        for (const n of nilaiP) {
                          if (n.tipe_nilai === 'mata_pelajaran' && n.mata_pelajaran_id) {
                            nilaiByMp[n.mata_pelajaran_id] = n.nilai;
                          }
                        }
                        const nilaiPretest = nilaiP.find((n) => n.tipe_nilai === 'pretest')?.nilai
                          ?? absensiData.hasil_pretest[p.id]?.nilai;
                        const nilaiPosttest = nilaiP.find((n) => n.tipe_nilai === 'posttest')?.nilai
                          ?? absensiData.hasil_posttest[p.id]?.nilai;

                        // Calculate average across all mata pelajaran + ujian akhir
                        const mpVals = mpForAbsensi.map((mp) => nilaiByMp[mp.id]).filter((v) => v !== undefined) as number[];
                        const allVals = [...mpVals, ...(nilaiPosttest !== undefined ? [nilaiPosttest] : [])];
                        const rataRata = allVals.length > 0 ? Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length) : undefined;

                        return (
                          <tr key={p.id} className={idx % 2 === 0 ? '' : 'bg-gray-50'}>
                            <td className="border border-black px-1 py-2 text-center">{(absensiPage - 1) * pageSize + idx + 1}</td>
                            <td className="border border-black px-2 py-2 font-semibold">{p.nama_lengkap}</td>
                            <td className="border border-black px-2 py-2 font-mono text-[9px]">{p.nik}</td>
                            {/* Kehadiran checkboxes (empty for manual fill) */}
                            {Array.from({ length: jumlahKolHadir }, (_, i) => (
                              <td key={i} className="border border-black px-0 py-2 text-center w-6 h-8">
                                {/* Empty cell for manual checkmark */}
                              </td>
                            ))}
                            {/* Mata Pelajaran values */}
                            {mpForAbsensi.map((mp) => (
                              <td key={mp.id} className="border border-black px-1 py-2 text-center font-semibold">
                                {nilaiByMp[mp.id] !== undefined ? nilaiByMp[mp.id] : ''}
                              </td>
                            ))}
                            {/* Pretest */}
                            <td className="border border-black px-1 py-2 text-center font-semibold">
                              {nilaiPretest !== undefined ? Math.round(nilaiPretest) : ''}
                            </td>
                            {/* Ujian Akhir (Posttest - auto) */}
                            <td className="border border-black px-1 py-2 text-center font-bold">
                              {nilaiPosttest !== undefined ? Math.round(nilaiPosttest) : ''}
                            </td>
                            {/* Rata-rata */}
                            <td className="border border-black px-1 py-2 text-center font-bold">
                              {rataRata !== undefined ? rataRata : ''}
                            </td>
                            {/* Grade */}
                            <td className="border border-black px-1 py-2 text-center font-extrabold">
                              {rataRata !== undefined ? nilaiGrade(rataRata) : ''}
                            </td>
                            {/* Tanda Tangan */}
                            <td className="border border-black px-2 py-2 h-10">&nbsp;</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <Pagination currentPage={absensiPage} totalItems={absensiData.peserta.length} pageSize={pageSize} onPageChange={setAbsensiPage} className="text-black" />
                </div>

                {/* Footer signatures */}
                <div className="mt-8 flex justify-between items-end text-xs text-black">
                  <div className="text-center">
                    <div>Mengetahui,</div>
                    <div className="font-semibold">Kepala LPK Leles</div>
                    <div className="mt-14 border-t border-black w-40 mx-auto"></div>
                    <div className="font-semibold">(_________________________)</div>
                    <div>NIP. ___________________</div>
                  </div>
                  <div className="text-center">
                    <div>Garut, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="font-semibold">Instruktur / Pengajar</div>
                    <div className="mt-14 border-t border-black w-40 mx-auto"></div>
                    <div className="font-semibold">{namaInstruktur ? `(${namaInstruktur})` : '(_________________________)'}</div>
                    <div>NIP. ___________________</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL — Tambah / Edit Mata Pelajaran
      ═══════════════════════════════════════════════════ */}
      {showMpModal && (
        <div className="modal-overlay" onClick={() => setShowMpModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-primary)] text-base">
                {editingMp ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h3>
              <button onClick={() => setShowMpModal(false)} className="text-[var(--text-tertiary)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleSaveMp} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Kode *</label>
                  <input type="text" className="form-input text-xs font-mono uppercase" placeholder="mis: MTK01" maxLength={20} value={mpKode} onChange={(e) => setMpKode(e.target.value.toUpperCase())} required />
                </div>
                <div>
                  <label className="form-label">Urutan</label>
                  <input type="number" className="form-input text-xs" min={0} value={mpUrutan} onChange={(e) => setMpUrutan(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="form-label">Nama Mata Pelajaran *</label>
                <input type="text" className="form-input text-xs" placeholder="mis: Teknik Menjahit Dasar" value={mpNama} onChange={(e) => setMpNama(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Program Pelatihan</label>
                <select className="form-input text-xs" value={mpProgramId} onChange={(e) => setMpProgramId(e.target.value)}>
                  <option value="">Berlaku untuk Semua Program</option>
                  {programList.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input text-xs min-h-[60px]" placeholder="Deskripsi singkat mata pelajaran..." value={mpDeskripsi} onChange={(e) => setMpDeskripsi(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowMpModal(false)} className="btn btn-outline btn-sm">Batal</button>
                <button type="submit" className="btn btn-primary btn-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
