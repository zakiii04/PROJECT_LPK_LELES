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

  // Sync / Persist progress to LocalStorage
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
      const jawaban = userAnswers[idx] ?? -1;
      if (jawaban === soal.jawaban_benar) {
        benarCount += 1;
      }
      return { soal_id: soal.id, jawaban };
    });

    const totalSoal = soalList.length;
    const nilai = totalSoal > 0 ? Math.round((benarCount / totalSoal) * 100) : 0;

    try {
      await ujianApi.submit({
        tipe,
        program_id: (pendaftar.program_id || pendaftar.jenis_pelatihan || 'program-default') as string,
        jawaban: jawabanPayload,
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
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">Soal Ujian Belum Tersedia</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tidak ada soal ujian {tipe.toUpperCase()} yang terdaftar untuk modul {pendaftar.jenis_pelatihan}. Silakan hubungi instruktur/admin LPK.
          </p>
          <button
            onClick={() => {
              clearExamStorage();
              onCancel();
            }}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-6 font-sans">
      {/* Top Header Bar with Timer & Status */}
      <header className="max-w-6xl w-full mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold font-mono text-base flex-shrink-0">
            CBT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                UJIAN LMS — {tipe.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">{pendaftar.jenis_pelatihan}</span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{pendaftar.nama_lengkap}</span>
              <span className="text-xs text-slate-400 font-mono font-normal">({pendaftar.no_pendaftaran})</span>
            </h2>
          </div>
        </div>

        {/* Timer Countdown & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${timeLeft < 180 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Sisa Waktu Ujian</div>
              <div className={`text-xl font-black font-mono leading-none ${timeLeft < 180 ? 'text-rose-400 animate-bounce' : 'text-amber-300'}`}>
                {timeFormatted}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowExitModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-700/80 bg-slate-900 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Examination Body */}
      <main className="max-w-6xl w-full mx-auto my-4 md:my-6 grid grid-cols-1 lg:grid-cols-4 gap-5 flex-1">
        {/* Question Area (3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-8 flex flex-col justify-between space-y-6 shadow-xl backdrop-blur">
          <div className="space-y-6">
            {/* Question Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                  Soal Nomor {currentIdx + 1} / {soalList.length}
                </span>
                {raguRagu[currentIdx] && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    ⚠️ Ditandai Ragu
                  </span>
                )}
              </div>

              {/* Toggle Ragu-Ragu Button */}
              <button
                type="button"
                onClick={handleToggleRagu}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                  raguRagu[currentIdx]
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/50'
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
            <div className="space-y-2">
              <h3 className="text-base md:text-xl font-bold text-white leading-relaxed">
                {currentSoal.pertanyaan}
              </h3>
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
                    className={`w-full text-left p-4 md:p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xl ring-2 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-800/90 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 font-mono transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
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
          <div className="flex items-center justify-between pt-6 border-t border-slate-800 flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleJumpQuestion(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
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
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5"
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white shadow-lg transition-all flex items-center gap-2"
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

        {/* Palette Soal Sidebar (1 Col - Pindah-pindah Soal) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Navigasi Nomor Soal
              </h4>
              <span className="text-[11px] font-mono font-bold text-indigo-400">
                {answeredCount}/{soalList.length} Dijawab
              </span>
            </div>

            {/* Grid Palette buttons (Pindah-Pindah Soal) */}
            <div className="grid grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {soalList.map((_, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isCurrent = currentIdx === idx;
                const isRagu = raguRagu[idx];

                let bgClass = 'bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-800';
                if (isRagu) {
                  bgClass = 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold';
                } else if (isAnswered) {
                  bgClass = 'bg-emerald-600/25 text-emerald-300 border-emerald-500/50 font-bold';
                }

                if (isCurrent) {
                  bgClass += ' ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 font-extrabold text-white';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpQuestion(idx)}
                    className={`h-10 rounded-xl border text-xs flex items-center justify-center font-mono transition-all relative ${bgClass}`}
                    title={`Lompat ke Soal Nomor ${idx + 1}`}
                  >
                    {idx + 1}
                    {isRagu && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Status Legend */}
          <div className="space-y-2 text-[10px] text-slate-400 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60" />
                <span>Sudah Dijawab</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">{answeredCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60" />
                <span>Ragu-ragu</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{raguCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
                <span>Belum Dijawab</span>
              </div>
              <span className="font-mono font-bold text-slate-400">{unansweredCount}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl shadow-2xl space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Konfirmasi Pengiriman Ujian</h3>
              <p className="text-xs text-slate-400 mt-1">
                Apakah Anda yakin ingin menyelesaikan dan mengirim jawaban ujian ini?
              </p>
            </div>

            {/* Summary Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Soal</span>
                <span className="font-bold text-white">{soalList.length} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sudah Dijawab</span>
                <span className="font-bold text-emerald-400">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jawaban Ragu-ragu</span>
                <span className="font-bold text-amber-400">{raguCount} Soal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Belum Dijawab</span>
                <span className="font-bold text-rose-400">{unansweredCount} Soal</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>Masih ada {unansweredCount} soal yang belum Anda jawab.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 hover:bg-slate-800 transition-all"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl shadow-2xl space-y-4 animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl mx-auto mb-2">
                🚪
              </div>
              <h3 className="text-base font-bold text-white">Keluar dari Ujian?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Jawaban Anda yang telah diisi belum tersimpan secara permanen. Apakah Anda yakin ingin keluar?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 hover:bg-slate-800"
              >
                Lanjutkan Ujian
              </button>
              <button
                type="button"
                onClick={handleExitConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
