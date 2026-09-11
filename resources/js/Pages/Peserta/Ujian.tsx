'use client';

import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import ExamInterface from '@/Components/ExamInterface';
import ExamResult from '@/Components/ExamResult';
import { pendaftarApi, ujianApi } from '@/lib/api';
import type { Pendaftar, SoalUjian } from '@/lib/types';

interface PesertaUjianPageProps {
  initialPendaftar?: Pendaftar | null;
}

export default function PesertaUjianPage({ initialPendaftar }: PesertaUjianPageProps) {
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(initialPendaftar || null);
  const [soalList, setSoalList] = useState<SoalUjian[]>([]);
  const [tipe, setTipe] = useState<'pretest' | 'posttest'>('pretest');
  const [step, setStep] = useState<'loading' | 'exam' | 'result' | 'empty' | 'error' | 'max_reached'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [bestScoreSaved, setBestScoreSaved] = useState<number>(0);

  // Persistence restored state
  const [initialAnswers, setInitialAnswers] = useState<Record<number, number>>({});
  const [initialRagu, setInitialRagu] = useState<Record<number, boolean>>({});
  const [initialIdx, setInitialIdx] = useState<number>(0);
  const [endTimeMs, setEndTimeMs] = useState<number | undefined>(undefined);
  const [storageKey, setStorageKey] = useState<string>('');

  // Exam result state
  const [resultData, setResultData] = useState<{
    nilai: number;
    total: number;
    benar: number;
  } | null>(null);

  useEffect(() => {
    // Get query param for exam type
    const searchParams = new URLSearchParams(window.location.search);
    const paramTipe = searchParams.get('tipe');
    const examTipe: 'pretest' | 'posttest' = paramTipe === 'posttest' ? 'posttest' : 'pretest';
    setTipe(examTipe);

    const initExamPage = async () => {
      try {
        // 1. Resolve participant data
        let me: Pendaftar | null = initialPendaftar || pendaftar;

        if (!me) {
          try {
            const resMe = await pendaftarApi.me();
            if (resMe.success && resMe.data) {
              me = resMe.data;
            }
          } catch (e) {
            console.warn('pendaftarApi.me() failed, checking local storage:', e);
          }
        }

        // Fallback to local session storage if still null
        if (!me && typeof window !== 'undefined') {
          const sessRaw = sessionStorage.getItem('lpk_peserta_session') || localStorage.getItem('user');
          if (sessRaw) {
            try {
              const parsed = JSON.parse(sessRaw);
              if (parsed && (parsed.id || parsed.no_pendaftaran)) {
                if (parsed.id) {
                  const resShow = await pendaftarApi.show(parsed.id).catch(() => null);
                  if (resShow?.success && resShow.data) {
                    me = resShow.data;
                  }
                }
              }
            } catch (err) {
              console.warn('Failed parsing local session:', err);
            }
          }
        }

        // If after all fallbacks still no participant found, query latest registered
        if (!me) {
          try {
            const resList = await pendaftarApi.list({ per_page: 1 });
            const listData = resList.data?.data || (Array.isArray(resList.data) ? resList.data : []);
            if (listData.length > 0) {
              me = listData[0];
            }
          } catch (e) {
            console.warn('Failed fallback pendaftarApi.list:', e);
          }
        }

        if (!me) {
          setErrorMessage('Data peserta Anda tidak ditemukan. Silakan login kembali.');
          setStep('error');
          return;
        }

        setPendaftar(me);

        // 2. Check maximum 3 attempts for this exam type
        try {
          const resUjian = await pendaftarApi.meUjian();
          if (resUjian.success && Array.isArray(resUjian.data)) {
            const attempts = resUjian.data.filter((h) => h.tipe === examTipe);
            if (attempts.length >= 3) {
              const best = [...attempts].sort((a, b) => b.nilai - a.nilai)[0];
              setBestScoreSaved(best ? best.nilai : 0);
              setStep('max_reached');
              return;
            }
          }
        } catch (e) {
          console.warn('Checking attempts failed, proceeding:', e);
        }

        const key = `lpk_cbt_session_${me.id}_${examTipe}`;
        setStorageKey(key);

        // 3. Check if there is an active saved exam session in localStorage
        const savedSessionRaw = localStorage.getItem(key);
        let restored = false;

        if (savedSessionRaw) {
          try {
            const parsed = JSON.parse(savedSessionRaw);
            const now = Date.now();
            if (
              parsed.endTime &&
              parsed.endTime > now &&
              Array.isArray(parsed.soalList) &&
              parsed.soalList.length > 0
            ) {
              setSoalList(parsed.soalList);
              setInitialAnswers(parsed.userAnswers || {});
              setInitialRagu(parsed.raguRagu || {});
              setInitialIdx(parsed.currentIdx || 0);
              setEndTimeMs(parsed.endTime);
              restored = true;
            } else {
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.error('Error parsing saved exam session:', e);
            localStorage.removeItem(key);
          }
        }

        // 4. If no active session was restored, fetch new questions from API
        if (!restored) {
          const programId = me.program_id || 'PROG-MENJAHIT';
          const resSoal = await ujianApi.mulai({
            tipe: examTipe,
            program_id: programId,
            jumlah: 10,
          });

          if (resSoal.success && Array.isArray(resSoal.data) && resSoal.data.length > 0) {
            const questions = resSoal.data;
            const computedEndTime = Date.now() + 15 * 60 * 1000; // 15 menit

            setSoalList(questions);
            setInitialAnswers({});
            setInitialRagu({});
            setInitialIdx(0);
            setEndTimeMs(computedEndTime);

            // Save initial state to localStorage
            localStorage.setItem(
              key,
              JSON.stringify({
                soalList: questions,
                userAnswers: {},
                raguRagu: {},
                currentIdx: 0,
                endTime: computedEndTime,
              })
            );
          } else {
            setStep('empty');
            return;
          }
        }

        setStep('exam');
      } catch (err: any) {
        console.error('Failed loading exam:', err);
        setErrorMessage(err?.message || 'Terjadi kendala saat memuat soal ujian.');
        setStep('error');
      }
    };

    initExamPage();
  }, []);

  const handleFinishExam = (nilai: number, total: number, benar: number) => {
    setResultData({ nilai, total, benar });
    setStep('result');
  };

  const handleBackToDashboard = () => {
    router.visit('/peserta/dashboard');
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Memuat Lembar Ujian CBT...</h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">Menyiapkan bank soal dan memeriksa data ujian Anda.</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'max_reached') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto text-3xl font-bold">
            🔒
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Batas Maksimal Pengerjaan
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">Batas Ujian Telah Tercapai</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Anda telah mengerjakan evaluasi <strong className="uppercase text-slate-900">{tipe}</strong> sebanyak <strong>3 kali</strong> (batas maksimal pengerjaan ulang).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500">Nilai Tertinggi Tersimpan:</span>
            <div className="text-3xl font-black text-indigo-600">{bestScoreSaved} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
            <p className="text-[11px] text-slate-500">Nilai tertinggi ini otomatis digunakan untuk sertifikat & penilaian akhir Anda.</p>
          </div>

          <button
            onClick={handleBackToDashboard}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Kembali ke Dashboard Peserta
          </button>
        </div>
      </div>
    );
  }

  if (step === 'empty') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Soal Ujian Belum Tersedia</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Bank soal untuk ujian <span className="font-semibold text-amber-700 uppercase">{tipe}</span> belum diunggah oleh instruktur. Silakan hubungi admin atau kembali ke dashboard.
            </p>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Kembali ke Dashboard Peserta
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-3xl font-bold">
            ✕
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Gagal Memuat Ujian</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {errorMessage || 'Terjadi kesalahan sistem saat menyiapkan lembar ujian.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Coba Lagi
            </button>
            <button
              onClick={handleBackToDashboard}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && resultData && pendaftar) {
    return (
      <ExamResult
        pendaftar={pendaftar}
        tipe={tipe}
        nilai={resultData.nilai}
        totalSoal={resultData.total}
        jawabanBenar={resultData.benar}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (pendaftar && soalList.length > 0) {
    return (
      <ExamInterface
        pendaftar={pendaftar}
        tipe={tipe}
        soalList={soalList}
        durasiMenit={15}
        initialAnswers={initialAnswers}
        initialRagu={initialRagu}
        initialIdx={initialIdx}
        endTimeMs={endTimeMs}
        storageKey={storageKey}
        onFinish={handleFinishExam}
        onCancel={handleBackToDashboard}
      />
    );
  }

  return null;
}
