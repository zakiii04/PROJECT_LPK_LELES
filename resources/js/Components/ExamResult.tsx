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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl animate-scale-in">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/60 border border-slate-600 text-xs font-mono text-indigo-300">
          Ujian {tipe.toUpperCase()} Selesai
        </div>

        {/* Score Display Circle */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center rounded-full bg-slate-900 border-4 border-slate-700 shadow-inner">
          <div className="space-y-0.5">
            <div className={`text-4xl font-black font-mono ${isLulus ? 'text-emerald-400' : 'text-rose-400'}`}>
              {nilai}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SKOR AKHIR</div>
          </div>
        </div>

        {/* Title & Status Message */}
        <div>
          <h2 className="text-xl font-extrabold text-white mb-1">
            {isLulus ? 'Selamat! Hasil Memuaskan' : 'Tetap Semangat! Belum Lulus'}
          </h2>
          <p className="text-xs text-slate-400">
            {pendaftar.nama_lengkap} ({pendaftar.no_pendaftaran}) • {pendaftar.jenis_pelatihan}
          </p>
        </div>

        {/* Score Breakdown Table */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs space-y-2 font-mono">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Total Soal Evaluasi</span>
            <span className="font-bold text-white">{totalSoal} Soal</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Jawaban Benar</span>
            <span className="font-bold text-emerald-400">{jawabanBenar} Soal</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Jawaban Salah</span>
            <span className="font-bold text-rose-400">{jawabanSalah} Soal</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-400">Status Kelulusan Ujian</span>
            <span className={`font-bold ${isLulus ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isLulus ? 'LULUS (>=70)' : 'TIDAK LULUS (<70)'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onBackToDashboard}
          className="btn btn-primary btn-md w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg"
        >
          Kembali ke Dashboard Peserta
        </button>
      </div>
    </div>
  );
}
