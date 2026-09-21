'use client';

import { useState, useEffect, useCallback } from 'react';
import { absensiApi, mataPelajaranApi, nilaiApi } from '@/lib/api';
import type { AbsensiData, MataPelajaran, Pendaftar } from '@/lib/types';

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

interface PenilaianPanelProps {
  angkatanId: string;
  programId?: string;
  /** Peserta yang ditampilkan — sudah di-scope oleh pemanggil (mis. hanya kelas binaan) */
  pesertaList: Pendaftar[];
  title?: string;
  subtitle?: string;
}

export default function PenilaianPanel({
  angkatanId,
  programId,
  pesertaList,
  title = 'Penilaian Peserta Pelatihan',
  subtitle = 'Nilai mata pelajaran, pretest, dan ujian akhir. Nilai Ujian Akhir (Posttest) terisi otomatis dari hasil ujian online peserta.',
}: PenilaianPanelProps) {
  const [penilaianData, setPenilaianData] = useState<AbsensiData | null>(null);
  const [mpList, setMpList] = useState<MataPelajaran[]>([]);
  const [localNilai, setLocalNilai] = useState<Record<string, Record<string, number>>>({});
  const [penilaianLoading, setPenilaianLoading] = useState(false);
  const [savingNilai, setSavingNilai] = useState(false);
  const [savedNilaiMsg, setSavedNilaiMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const scopedIds = new Set(pesertaList.map((p) => p.id));

  const loadPenilaianData = useCallback(async () => {
    if (!angkatanId) return;
    setPenilaianLoading(true);
    setErrorMsg('');
    try {
      const [absRes, mpRes] = await Promise.all([
        absensiApi.get({ angkatan_id: angkatanId, program_id: programId || undefined }),
        mataPelajaranApi.list(programId ? { program_id: programId } : undefined),
      ]);

      if (mpRes.success && mpRes.data) {
        setMpList(mpRes.data);
      }

      if (absRes.success && absRes.data) {
        setPenilaianData(absRes.data);
        const local: Record<string, Record<string, number>> = {};
        const allowed = new Set(pesertaList.map((p) => p.id));
        for (const p of absRes.data.peserta) {
          if (!allowed.has(p.id)) continue;
          local[p.id] = {};
          for (const n of absRes.data.nilai.filter((x) => x.pendaftar_id === p.id)) {
            const key = n.mata_pelajaran_id ? `mp_${n.mata_pelajaran_id}` : n.tipe_nilai;
            local[p.id][key] = n.nilai;
          }
          const posttest = absRes.data.hasil_posttest[p.id];
          if (posttest && local[p.id]['posttest'] === undefined) {
            local[p.id]['posttest'] = posttest.nilai;
          }
          const pretest = absRes.data.hasil_pretest[p.id];
          if (pretest && local[p.id]['pretest'] === undefined) {
            local[p.id]['pretest'] = pretest.nilai;
          }
          const keh = absRes.data.kehadiran[p.id];
          if (keh && local[p.id]['kehadiran'] === undefined) {
            local[p.id]['kehadiran'] = keh.persen;
          }
        }
        // Pastikan peserta scope yang belum ada nilai tetap punya baris
        for (const p of pesertaList) {
          if (!local[p.id]) local[p.id] = {};
        }
        setLocalNilai(local);
      }
    } catch (e) {
      console.error('Error loading penilaian:', e);
      setErrorMsg('Gagal memuat data penilaian.');
    } finally {
      setPenilaianLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angkatanId, programId, pesertaList.map((p) => p.id).join(',')]);

  useEffect(() => {
    loadPenilaianData();
  }, [loadPenilaianData]);

  const handleSaveAllNilai = async () => {
    setSavingNilai(true);
    setErrorMsg('');
    try {
      const bulkPayload: Array<any> = [];
      for (const [pendaftarId, cols] of Object.entries(localNilai)) {
        if (!scopedIds.has(pendaftarId)) continue;
        for (const [key, nilai] of Object.entries(cols)) {
          if (nilai === undefined || isNaN(nilai)) continue;
          if (key.startsWith('mp_')) {
            const mpId = key.replace('mp_', '');
            bulkPayload.push({
              pendaftar_id: pendaftarId,
              mata_pelajaran_id: mpId,
              tipe_nilai: 'mata_pelajaran',
              nilai,
            });
          } else if (['pretest', 'posttest', 'kehadiran'].includes(key)) {
            bulkPayload.push({
              pendaftar_id: pendaftarId,
              tipe_nilai: key,
              nilai,
            });
          }
        }
      }

      if (bulkPayload.length === 0) {
        setErrorMsg('Belum ada nilai yang diisi.');
        return;
      }

      await nilaiApi.bulk(bulkPayload);
      setSavedNilaiMsg('Nilai berhasil disimpan ke database!');
      setTimeout(() => setSavedNilaiMsg(''), 3000);
      await loadPenilaianData();
    } catch (e) {
      console.error('Error saving nilai:', e);
      setErrorMsg('Gagal menyimpan nilai.');
    } finally {
      setSavingNilai(false);
    }
  };

  const setCell = (pendaftarId: string, key: string, raw: string) => {
    const v = raw === '' ? undefined : Number(raw);
    setLocalNilai((prev) => ({ ...prev, [pendaftarId]: { ...prev[pendaftarId], [key]: v as number } }));
  };

  const activeMpList = mpList.filter((m) => !programId || !m.program_id || m.program_id === programId);

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-base">{title}</h4>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            onClick={handleSaveAllNilai}
            disabled={savingNilai || penilaianLoading}
            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{savingNilai ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
          </button>
        </div>

        {savedNilaiMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            <span>{savedNilaiMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
            {errorMsg}
          </div>
        )}

        {penilaianLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : pesertaList.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-xl">
            Tidak ada peserta pada kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-4 py-2.5 min-w-[160px]">Nama Peserta</th>
                  {activeMpList.map((mp) => (
                    <th key={mp.id} className="px-2 py-2.5 text-center min-w-[80px]">
                      <div className="font-mono text-indigo-700">{mp.kode}</div>
                      <div className="normal-case font-medium text-[9px] text-slate-400 truncate max-w-[80px]">{mp.nama}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-center min-w-[75px] bg-amber-50 text-amber-800">Pretest</th>
                  <th className="px-2 py-2.5 text-center min-w-[90px] bg-emerald-50 text-emerald-800">
                    <div>Ujian Akhir</div>
                    <div className="text-[8px] normal-case text-emerald-600 font-normal">(Auto Posttest)</div>
                  </th>
                  <th className="px-2 py-2.5 text-center min-w-[75px] bg-blue-50 text-blue-800">Kehadiran (%)</th>
                  <th className="px-2 py-2.5 text-center min-w-[65px]">Rata-rata</th>
                  <th className="px-2 py-2.5 text-center min-w-[50px]">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pesertaList.map((p, idx) => {
                  const rowNilai = localNilai[p.id] || {};
                  const posttestAuto = penilaianData?.hasil_posttest[p.id];
                  const mpScores = activeMpList.map((m) => rowNilai[`mp_${m.id}`]).filter((v) => v !== undefined && !isNaN(v));
                  const postScore = rowNilai['posttest'] !== undefined ? rowNilai['posttest'] : (posttestAuto ? posttestAuto.nilai : undefined);
                  const allScores = [...mpScores, ...(postScore !== undefined ? [postScore] : [])];
                  const avg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : undefined;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-slate-800">{p.nama_lengkap}</div>
                        <div className="font-mono text-[10px] text-indigo-700">{p.no_pendaftaran}</div>
                      </td>
                      {activeMpList.map((mp) => {
                        const key = `mp_${mp.id}`;
                        const val = rowNilai[key];
                        return (
                          <td key={mp.id} className="px-1 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              className={`w-14 text-center text-xs border rounded-lg py-1 px-1 focus:ring-1 focus:ring-indigo-400 ${val !== undefined ? nilaiColor(val) : 'text-slate-400'}`}
                              value={val ?? ''}
                              placeholder="-"
                              onChange={(e) => setCell(p.id, key, e.target.value)}
                            />
                          </td>
                        );
                      })}
                      <td className="px-1 py-2 text-center bg-amber-50/40">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          className="w-14 text-center text-xs border border-amber-200 bg-amber-50 rounded-lg py-1 px-1"
                          value={rowNilai['pretest'] ?? ''}
                          placeholder="-"
                          onChange={(e) => setCell(p.id, 'pretest', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2 text-center bg-emerald-50/40">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            className="w-16 text-center text-xs border border-emerald-300 bg-emerald-50 rounded-lg py-1 px-1 font-bold text-emerald-800"
                            value={rowNilai['posttest'] ?? ''}
                            placeholder={posttestAuto ? String(posttestAuto.nilai) : '-'}
                            onChange={(e) => setCell(p.id, 'posttest', e.target.value)}
                          />
                          {posttestAuto && rowNilai['posttest'] === undefined && (
                            <span className="absolute -top-2 -right-2 text-[8px] bg-emerald-600 text-white rounded-full px-1 font-bold shadow-xs">
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-2 text-center bg-blue-50/40">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-14 text-center text-xs border border-blue-200 bg-blue-50 rounded-lg py-1 px-1 font-semibold text-blue-800"
                          value={rowNilai['kehadiran'] ?? ''}
                          placeholder="-"
                          onChange={(e) => setCell(p.id, 'kehadiran', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center font-extrabold text-slate-800">
                        {avg !== undefined ? avg : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-center font-extrabold text-indigo-700">
                        {avg !== undefined ? nilaiGrade(avg) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
