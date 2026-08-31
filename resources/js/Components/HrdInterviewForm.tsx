'use client';

import { useState } from 'react';
import { interviewApi } from '@/lib/api';
import type { Interview } from '@/lib/types';

interface HrdInterviewFormProps {
  interview: Interview;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HrdInterviewForm({
  interview,
  onClose,
  onSuccess,
}: HrdInterviewFormProps) {
  const [skorKomunikasi, setSkorKomunikasi] = useState(interview.skor_komunikasi || 80);
  const [skorSikap, setSkorSikap] = useState(interview.skor_sikap || 85);
  const [skorKesiapan, setSkorKesiapan] = useState(interview.skor_kesiapan || 80);
  const [catatan, setCatatan] = useState(interview.catatan || '');
  const [status, setStatus] = useState<'Lulus' | 'Tidak Lulus'>(
    interview.status === 'Tidak Lulus' ? 'Tidak Lulus' : 'Lulus'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const skorTotal = Math.round((skorKomunikasi + skorSikap + skorKesiapan) / 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await interviewApi.update(interview.id, {
        skor_komunikasi: skorKomunikasi,
        skor_sikap: skorSikap,
        skor_kesiapan: skorKesiapan,
        catatan,
        status
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-lg p-6 md:p-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Form Penilaian Interview
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {interview.pendaftar?.nama_lengkap} ({interview.pendaftar?.no_pendaftaran}) • {interview.pendaftar?.jenis_pelatihan}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--surface)] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Skor Slider / Inputs */}
          <div className="space-y-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)]">
            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-bold">
                <span className="text-[var(--text-primary)]">1. Aspek Komunikasi & Bahasa</span>
                <span className="text-[var(--primary)] font-mono text-sm">{skorKomunikasi} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skorKomunikasi}
                onChange={(e) => setSkorKomunikasi(Number(e.target.value))}
                className="w-full accent-[var(--primary)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-bold">
                <span className="text-[var(--text-primary)]">2. Sikap, Etika & Kepribadian</span>
                <span className="text-[var(--primary)] font-mono text-sm">{skorSikap} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skorSikap}
                onChange={(e) => setSkorSikap(Number(e.target.value))}
                className="w-full accent-[var(--primary)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1 font-bold">
                <span className="text-[var(--text-primary)]">3. Kesiapan Kerja & Motivasional</span>
                <span className="text-[var(--primary)] font-mono text-sm">{skorKesiapan} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skorKesiapan}
                onChange={(e) => setSkorKesiapan(Number(e.target.value))}
                className="w-full accent-[var(--primary)] cursor-pointer"
              />
            </div>

            <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
              <span className="text-xs font-extrabold text-[var(--text-primary)]">NILAI RATA-RATA TOTAL:</span>
              <span className={`text-xl font-extrabold font-mono ${skorTotal >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                {skorTotal} / 100
              </span>
            </div>
          </div>

          {/* Catatan Interviewer */}
          <div>
            <label className="form-label mb-1">Catatan Evaluasi Interviewer</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Berikan gambaran hasil wawancara, kelebihan, atau catatan khusus peserta..."
              className="form-input min-h-[80px] text-xs"
              required
            />
          </div>

          {/* Decision */}
          <div>
            <label className="form-label mb-2">Keputusan Akhir HRD</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('Lulus')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  status === 'Lulus'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-[var(--card-border)] bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>LULUS INTERVIEW</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('Tidak Lulus')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  status === 'Tidak Lulus'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-500/20'
                    : 'border-[var(--card-border)] bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>TIDAK LULUS</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting ? 'Simpan Data...' : 'Simpan Hasil Penilaian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
