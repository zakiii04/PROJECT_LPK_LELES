'use client';

import type { Kelulusan } from '@/lib/types';

interface CertificateViewProps {
  kelulusan: Kelulusan;
  onClose?: () => void;
}

export default function CertificateView({ kelulusan, onClose }: CertificateViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const pendaftar = kelulusan.pendaftar;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Control Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white print:hidden">
        <div className="text-xs">
          <span className="font-bold text-amber-400">Sertifikat Digital Resmi LPK</span> • No: {kelulusan.no_sertifikat}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn btn-accent btn-sm text-xs font-bold flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak / Simpan PDF</span>
          </button>
          {onClose && (
            <button onClick={onClose} className="btn btn-outline btn-sm text-xs text-slate-300">
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Certificate Frame Document */}
      <div className="bg-amber-50/40 border-8 border-double border-amber-600/60 p-8 md:p-12 rounded-2xl shadow-2xl relative text-center text-slate-800 space-y-6 bg-white overflow-hidden print:border-4 print:shadow-none print:p-6">
        {/* Decorative Background Stamp watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <div className="text-9xl font-black font-serif text-amber-800">LPK</div>
        </div>

        {/* Header Institution */}
        <div className="space-y-1 relative">
          <div className="w-16 h-16 rounded-full bg-amber-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-2 shadow-md">
            LPK
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-amber-900 font-serif">
            LEMBAGA PELATIHAN KERJA (LPK)
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Akreditasi Resmi Kementerian Ketenagakerjaan Republik Indonesia
          </p>
          <div className="w-32 h-0.5 bg-amber-600/60 mx-auto mt-2" />
        </div>

        {/* Certificate Title */}
        <div className="space-y-1 py-2 relative">
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 font-serif uppercase tracking-wider">
            SERTIFIKAT KELULUSAN
          </h1>
          <p className="text-xs font-mono text-amber-800">Nomor Registrasi: {kelulusan.no_sertifikat}</p>
        </div>

        {/* Main Recipient Body */}
        <div className="space-y-3 relative">
          <p className="text-xs text-slate-600 font-serif italic">Diberikan dengan bangga kepada:</p>
          <div className="text-2xl md:text-3xl font-black text-amber-900 font-serif underline decoration-amber-500/50 underline-offset-8">
            {pendaftar?.nama_lengkap || 'Peserta Pelatihan'}
          </div>
          <p className="text-xs text-slate-500 font-mono">No. Pendaftaran: {pendaftar?.no_pendaftaran || '-'}</p>

          <p className="text-xs md:text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed pt-2">
            Telah menyelesaikan seluruh rangkaian program pendaftaran, interview, ujian kompetensi, dan pelatihan praktikum pada program:
          </p>

          <div className="text-lg md:text-xl font-extrabold text-slate-900 font-mono bg-amber-100/60 border border-amber-300/60 px-6 py-2 rounded-xl inline-block shadow-sm">
            {pendaftar?.jenis_pelatihan || 'Program Pelatihan'}
          </div>

          <p className="text-xs text-slate-600 font-serif italic pt-1">
            dengan predikat kelulusan <span className="font-extrabold text-emerald-700 uppercase">{kelulusan.status_kelulusan}</span> (Nilai Akhir: <span className="font-extrabold font-mono text-slate-900">{kelulusan.nilai_akhir}/100</span>).
          </p>
        </div>

        {/* Signature & Seal Footer */}
        <div className="pt-8 grid grid-cols-2 gap-8 max-w-2xl mx-auto relative text-xs">
          <div className="text-center space-y-1">
            <div className="text-slate-500">Tanggal Kelulusan:</div>
            <div className="font-bold text-slate-800 font-mono">{kelulusan.tanggal_lulus}</div>
            <div className="h-16 flex items-center justify-center font-serif text-slate-400 italic text-[10px]">
              [ Cap & Stempel Resmi LPK ]
            </div>
            <div className="font-bold text-slate-800 border-t border-slate-400 pt-1">Tim Penguji & Assessor LPK</div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-slate-500">Kepala Lembaga LPK:</div>
            <div className="font-bold text-slate-800 font-mono">{kelulusan.tanggal_lulus}</div>
            <div className="h-16 flex items-center justify-center font-serif text-slate-400 italic text-[10px]">
              [ Tanda Tangan Direktur ]
            </div>
            <div className="font-bold text-slate-800 border-t border-slate-400 pt-1">Direktur Utam LPK</div>
          </div>
        </div>
      </div>
    </div>
  );
}
