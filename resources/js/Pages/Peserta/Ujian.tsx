'use client';

import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import ExamInterface from '@/Components/ExamInterface';
import ExamResult from '@/Components/ExamResult';
import { pendaftarApi, ujianApi } from '@/lib/api';
import { getToken } from '@/lib/axios';
import type { Pendaftar, SoalUjian } from '@/lib/types';

export default function PesertaUjianPage() {
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(null);
  const [soalList, setSoalList] = useState<SoalUjian[]>([]);
  const [tipe, setTipe] = useState<'pretest' | 'posttest'>('pretest');
  const [step, setStep] = useState<'loading' | 'exam' | 'result'>('loading');

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
      const token = getToken();
      if (!token) {
        router.push('/peserta/login');
        return;
      }

      try {
        // Fetch participant data
        const resMe = await pendaftarApi.me();
        if (!resMe.success || !resMe.data) {
          router.push('/peserta/login');
          return;
        }
        const me = resMe.data;
        setPendaftar(me);

        const key = `lpk_cbt_session_${me.id}_${examTipe}`;
        setStorageKey(key);

        // Check if there is an active saved exam session in localStorage
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
              // Expired or invalid session
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.error('Error parsing saved exam session:', e);
            localStorage.removeItem(key);
          }
        }

        // If no valid active session was restored, fetch new questions from API
        if (!restored) {
          const programId = me.program_id || (me.jenis_pelatihan ? 'program-default' : '');
          const resSoal = await ujianApi.mulai({
            tipe: examTipe,
            program_id: programId,
            jumlah: 10,
          });

          if (resSoal.success && resSoal.data) {
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
            setSoalList([]);
          }
        }

        setStep('exam');
      } catch (err) {
        console.error('Failed loading exam:', err);
        router.push('/peserta/dashboard');
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

  if (step === 'loading' || !pendaftar) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <div>
            <h3 className="text-base font-bold text-white">Memuat Lembar Ujian CBT...</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Menyiapkan bank soal dan memulihkan sesi ujian Anda.</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result' && resultData) {
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
