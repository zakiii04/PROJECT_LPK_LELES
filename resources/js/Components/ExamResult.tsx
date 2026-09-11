'use client';

import type { Pendaftar } from '@/lib/types';

interface ExamResultProps {
  pendaftar: Pendaftar;
  tipe: 'pretest' | 'posttest';
  nilai: number;
  totalSoal: number;
  jawabanBenar: number;
  onBackToDashboard: () => void;
}

export default function ExamResult({
  pendaftar,
  tipe,
  nilai,
  totalSoal,
  jawabanBenar,
  onBackToDashboard,
}: ExamResultProps) {
  const isLulus = nilai >= 70;
  const jawabanSalah = totalSoal - jawabanBenar;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-xl animate-scale-in">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono font-bold text-indigo-700">
          Ujian {tipe.toUpperCase()} Selesai
        </div>

        {/* Score Display Circle */}
        <div className={`relative w-36 h-36 mx-auto flex items-center justify-center rounded-full bg-slate-50 border-4 ${isLulus ? 'border-emerald-400' : 'border-rose-300'} shadow-inner`}>
          <div className="space-y-0.5">
            <div className={`text-4xl font-black font-mono ${isLulus ? 'text-emerald-600' : 'text-rose-600'}`}>
              {nilai}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SKOR UJIAN</div>
          </div>
        </div>

        {/* Title & Status Message */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">
            {isLulus ? 'Selamat! Hasil Memuaskan' : 'Tetap Semangat! Belum Mencapai Target'}
          </h2>
          <p className="text-xs text-slate-500">
            {pendaftar.nama_lengkap} ({pendaftar.no_pendaftaran}) • {pendaftar.jenis_pelatihan}
          </p>
        </div>

        {/* Score Breakdown Table */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Total Soal Evaluasi</span>
            <span className="font-bold text-slate-900">{totalSoal} Soal</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Jawaban Benar</span>
            <span className="font-bold text-emerald-600">{jawabanBenar} Soal</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Jawaban Salah</span>
            <span className="font-bold text-rose-600">{jawabanSalah} Soal</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Status Kelulusan Ujian</span>
            <span className={`font-bold ${isLulus ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isLulus ? 'LULUS (>=70)' : 'TIDAK LULUS (<70)'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onBackToDashboard}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          Kembali ke Dashboard Peserta
        </button>
      </div>
    </div>
  );
}
