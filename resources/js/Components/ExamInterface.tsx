'use client';

import { useState, useEffect, useRef } from 'react';
import { ujianApi } from '@/lib/api';
import type { SoalUjian, Pendaftar } from '@/lib/types';

interface ExamInterfaceProps {
  pendaftar: Pendaftar;
  tipe: 'pretest' | 'posttest';
  soalList: SoalUjian[];
  durasiMenit?: number; // default 15 menit
  initialAnswers?: Record<number, number>;
  initialRagu?: Record<number, boolean>;
  initialIdx?: number;
  endTimeMs?: number;
  storageKey?: string;
  // opsiMaps[soalId][shuffledIdx] = originalIdx — untuk konversi jawaban acak ke index asli saat submit
  opsiMaps?: Record<string, number[]>;
  onFinish: (nilai: number, total: number, benar: number) => void;
  onCancel: () => void;
}

export default function ExamInterface({
  pendaftar,
  tipe,
  soalList,
  durasiMenit = 15,
  initialAnswers = {},
  initialRagu = {},
  initialIdx = 0,
  endTimeMs,
  storageKey,
  opsiMaps = {},
  onFinish,
  onCancel,
}: ExamInterfaceProps) {
  // End time timestamp calculation
  const endTimeRef = useRef<number>(
    endTimeMs || Date.now() + durasiMenit * 60 * 1000
  );

  const calculateTimeLeft = () => {
    return Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
  };

  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>(initialAnswers);
  const [raguRagu, setRaguRagu] = useState<Record<number, boolean>>(initialRagu);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Sync / Persist progress to LocalStorage (termasuk opsiMaps agar urutan acak konsisten)
  const saveProgressToStorage = (
    answers: Record<number, number>,
    ragu: Record<number, boolean>,
    idx: number
  ) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          soalList,
          opsiMaps,
          userAnswers: answers,
          raguRagu: ragu,
          currentIdx: idx,
          endTime: endTimeRef.current,
        })
      );
    } catch (e) {
      console.error('Failed saving exam progress:', e);
    }
  };

  // Prevent accidental page unload / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) return;
      e.preventDefault();
      e.returnValue = 'Sesi ujian Anda sedang berlangsung. Yakin ingin meninggalkan halaman?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubmitting]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmitExam();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentSoal = soalList[currentIdx];

  const handleSelectOption = (opsiIndex: number) => {
    const newAnswers = {
      ...userAnswers,
      [currentIdx]: opsiIndex,
    };
    setUserAnswers(newAnswers);
    saveProgressToStorage(newAnswers, raguRagu, currentIdx);
  };

  const handleToggleRagu = () => {
    const newRagu = {
      ...raguRagu,
      [currentIdx]: !raguRagu[currentIdx],
    };
    setRaguRagu(newRagu);
    saveProgressToStorage(userAnswers, newRagu, currentIdx);
  };

  const handleJumpQuestion = (idx: number) => {
    setCurrentIdx(idx);
    saveProgressToStorage(userAnswers, raguRagu, idx);
  };

  const clearExamStorage = () => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error('Failed clearing storage:', e);
      }
    }
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let benarCount = 0;
    const jawabanPayload = soalList.map((soal, idx) => {
      const jawabanAcak = userAnswers[idx] ?? -1;
      // Nilai lokal dihitung dari opsi yang tampil (sudah diacak + jawaban_benar sudah disesuaikan)
      if (jawabanAcak === soal.jawaban_benar) {
        benarCount += 1;
      }
      // Konversi kembali ke index asli untuk penilaian server (DB menyimpan urutan asli)
      const map = opsiMaps[soal.id];
      const jawabanAsli =
        jawabanAcak === -1 || !map || map[jawabanAcak] === undefined
          ? jawabanAcak
          : map[jawabanAcak];
      return { soal_id: soal.id, jawaban: jawabanAsli };
    });

    const totalSoal = soalList.length;
    const nilai = totalSoal > 0 ? Math.round((benarCount / totalSoal) * 100) : 0;

    try {
      await ujianApi.submit({
        tipe,
        program_id: (pendaftar.program_id || pendaftar.jenis_pelatihan || 'program-default') as string,
        jawaban: jawabanPayload,
        pendaftar_id: pendaftar.id,
      });
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      clearExamStorage();
      setIsSubmitting(false);
      onFinish(nilai, totalSoal, benarCount);
    }
  };

  const handleExitConfirm = () => {
    clearExamStorage();
    onCancel();
  };

  if (!currentSoal) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900">Soal Ujian Belum Tersedia</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tidak ada soal ujian {tipe.toUpperCase()} yang terdaftar untuk modul {pendaftar.jenis_pelatihan}. Silakan hubungi instruktur/admin LPK.
          </p>
          <button
            onClick={() => {
              clearExamStorage();
              onCancel();
            }}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const raguCount = Object.values(raguRagu).filter(Boolean).length;
  const unansweredCount = soalList.length - answeredCount;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-3 md:p-6 font-sans">
      {/* Top Header Bar with Timer & Status */}
      <header className="max-w-6xl w-full mx-auto bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-mono text-sm flex-shrink-0 shadow-xs">
            CBT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                UJIAN LMS — {tipe.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">{pendaftar.jenis_pelatihan}</span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <span>{pendaftar.nama_lengkap}</span>
              <span className="text-xs text-slate-500 font-mono font-normal">({pendaftar.no_pendaftaran})</span>
            </h2>
          </div>
        </div>

        {/* Timer Countdown & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shadow-2xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${timeLeft < 180 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Sisa Waktu Ujian</div>
              <div className={`text-xl font-black font-mono leading-none ${timeLeft < 180 ? 'text-rose-600 animate-bounce' : 'text-slate-900'}`}>
                {timeFormatted}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowExitModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Examination Body */}
      <main className="max-w-6xl w-full mx-auto my-4 md:my-6 grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1">
        {/* Question Area (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 md:p-8 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-6">
            {/* Question Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold font-mono">
                  Soal Nomor {currentIdx + 1} / {soalList.length}
                </span>
                {raguRagu[currentIdx] && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    ⚠️ Ditandai Ragu
                  </span>
                )}
              </div>

              {/* Toggle Ragu-Ragu Button */}
              <button
                type="button"
                onClick={handleToggleRagu}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                  raguRagu[currentIdx]
                    ? 'bg-amber-500 text-white border-amber-600 font-extrabold shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={raguRagu[currentIdx] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span>{raguRagu[currentIdx] ? 'Jawaban Ragu-ragu' : 'Tandai Ragu-ragu'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h3 className="text-base md:text-xl font-bold text-slate-900 leading-relaxed">
                {currentSoal.pertanyaan}
              </h3>

              {/* Question Image — displayed below text if present */}
              {currentSoal.gambar_soal && (
                <div className="mt-3">
                  <div
                    className="relative inline-block group cursor-zoom-in"
                    onClick={() => setZoomImage(currentSoal.gambar_soal!)}
                    title="Klik untuk perbesar gambar"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentSoal.gambar_soal}
                      alt="Gambar Soal"
                      className="max-h-56 max-w-full rounded-xl border border-slate-200 shadow-sm object-contain bg-slate-50 p-1.5 transition-all group-hover:ring-2 group-hover:ring-indigo-400"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      Perbesar
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3 pt-2">
              {currentSoal.opsi.map((opsi, oIdx) => {
                const isSelected = userAnswers[currentIdx] === oIdx;
                const optionChar = String.fromCharCode(65 + oIdx);

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-4 md:p-5 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-2 border-indigo-600 text-indigo-950 font-bold shadow-xs ring-2 ring-indigo-200/50'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 font-mono transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {optionChar}
                    </div>
                    <span className="text-xs md:text-sm font-medium leading-relaxed flex-1">{opsi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Bottom Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleJumpQuestion(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Soal Sebelumnya</span>
            </button>

            <div className="flex items-center gap-3">
              {currentIdx < soalList.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleJumpQuestion(Math.min(soalList.length - 1, currentIdx + 1))}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Soal Berikutnya</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Selesai & Kirim Ujian</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Palette Soal Sidebar (1 Col - Navigasi Rapi Nomor Soal) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Navigasi Nomor Soal
              </h4>
              <span className="text-[11px] font-mono font-bold text-indigo-600">
                {answeredCount}/{soalList.length} Dijawab
              </span>
            </div>

            {/* Grid Palette buttons (Pindah-Pindah Soal - Rapi, grid 5 kolom, tanpa offset yang keluar) */}
            <div className="grid grid-cols-5 gap-2 p-1 max-h-[320px] overflow-y-auto">
              {soalList.map((_, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isCurrent = currentIdx === idx;
                const isRagu = raguRagu[idx];

                let btnStyle = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300';
                if (isRagu) {
                  btnStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-bold hover:bg-amber-100';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold hover:bg-emerald-100';
                }

                if (isCurrent) {
                  btnStyle = 'border-2 border-indigo-600 bg-indigo-100 text-indigo-900 font-black shadow-xs ring-2 ring-indigo-300/60';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpQuestion(idx)}
                    className={`aspect-square h-10 w-full rounded-xl border text-xs flex items-center justify-center font-mono transition-all relative cursor-pointer ${btnStyle}`}
                    title={`Lompat ke Soal Nomor ${idx + 1}`}
                  >
                    <span>{idx + 1}</span>
                    {isRagu && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Status Legend */}
          <div className="space-y-2 text-[11px] text-slate-600 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span>Sudah Dijawab</span>
              </div>
              <span className="font-mono font-bold text-emerald-600">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Ragu-ragu</span>
              </div>
              <span className="font-mono font-bold text-amber-600">{raguCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-300" />
                <span>Belum Dijawab</span>
              </div>
              <span className="font-mono font-bold text-slate-500">{unansweredCount}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Kirim Jawaban Ujian</span>
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal before Submit */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-white text-slate-800 border border-slate-200 shadow-2xl rounded-3xl space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pengiriman Ujian</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban ujian ini?
              </p>
            </div>

            {/* Summary Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Soal</span>
                <span className="font-bold text-slate-900">{soalList.length} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sudah Dijawab</span>
                <span className="font-bold text-emerald-600">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jawaban Ragu-ragu</span>
                <span className="font-bold text-amber-600">{raguCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Belum Dijawab</span>
                <span className="font-bold text-rose-600">{unansweredCount} Soal</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>Masih ada {unansweredCount} soal yang belum Anda jawab.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Ya, Submit Ujian</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 bg-white text-slate-800 border border-slate-200 shadow-2xl rounded-3xl space-y-4 animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl mx-auto mb-2">
                🚪
              </div>
              <h3 className="text-base font-bold text-slate-900">Keluar dari Ujian?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Jawaban Anda yang telah diisi belum tersimpan secara permanen. Apakah Anda yakin ingin keluar?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Lanjutkan Ujian
              </button>
              <button
                type="button"
                onClick={handleExitConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-3">
            <div className="absolute top-0 right-0 -mt-10">
              <button
                onClick={() => setZoomImage(null)}
                className="w-8 h-8 rounded-full bg-white text-slate-700 hover:text-black flex items-center justify-center transition-all text-xs font-bold shadow-md cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImage}
              alt="Gambar Soal (Perbesar)"
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl border border-slate-200 object-contain bg-white"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-white/80 mt-1">Klik di luar gambar untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
}
