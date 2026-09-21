'use client';

import { useState } from 'react';
import type { Pendaftar } from '@/lib/types';
import { pendaftarApi } from '@/lib/api';

export interface ValidasiAwalModalProps {
  pendaftar: Pendaftar;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * TAHAP 1 — Validasi awal.
 * Tujuan: filter pendaftar laki-laki (program khusus perempuan)
 * dan memastikan pendaftar benar-benar orang (bukan asal isi).
 */
export default function ValidasiAwalModal({ pendaftar, onClose, onSuccess }: ValidasiAwalModalProps) {
  const [jenisKelamin, setJenisKelamin] = useState<string>(pendaftar.jenis_kelamin || '');
  const [catatan, setCatatan] = useState<string>(pendaftar.catatan_validasi || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLakiLaki = jenisKelamin === 'Laki-laki';
  const nikValid = (pendaftar.nik || '').length === 16;
  const hpValid = (pendaftar.no_hp || '').length >= 10;

  const submit = async (status: 'diterima' | 'ditolak') => {
    setErrorMsg(null);
    if (status === 'diterima' && isLakiLaki) {
      setErrorMsg('Pendaftar berjenis kelamin Laki-laki tidak dapat diloloskan. Program ini khusus perempuan. Silakan pilih Tolak.');
      return;
    }
    if (status === 'ditolak' && !catatan.trim()) {
      setErrorMsg('Alasan penolakan wajib diisi agar pendaftar tahu kenapa ditolak pada tahap validasi.');
      return;
    }
    setLoading(true);
    try {
      const res = await pendaftarApi.validasi(pendaftar.id, status, {
        catatan_validasi: catatan.trim() || undefined,
        jenis_kelamin: (jenisKelamin || undefined) as any,
      });
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan hasil validasi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div
        className="modal-content max-w-xl w-full mx-4 shadow-2xl overflow-hidden rounded-2xl border border-[var(--card-border)] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tahap 1 — Validasi Awal</h2>
              <p className="text-xs text-slate-500 font-medium">
                {pendaftar.nama_lengkap} • No. Reg: <span className="font-mono text-amber-700 font-bold">{pendaftar.no_pendaftaran}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/60 text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{errorMsg}</div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">NAMA</span>
              <span className="font-bold text-slate-800">{pendaftar.nama_lengkap}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">NIK</span>
              <span className={`font-mono font-bold ${nikValid ? 'text-slate-700' : 'text-rose-600'}`}>{pendaftar.nik} {!nikValid && '(tidak valid)'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">NO HP</span>
              <span className={`font-mono font-bold ${hpValid ? 'text-slate-700' : 'text-rose-600'}`}>{pendaftar.no_hp}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">EMAIL</span>
              <span className="font-mono text-slate-700 block truncate">{pendaftar.email}</span>
            </div>
          </div>

          <div>
            <label className="form-label block text-xs font-bold text-slate-700 mb-1">
              Jenis Kelamin <span className="text-rose-500">*</span>
            </label>
            <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="form-input w-full text-sm font-semibold">
              <option value="">-- Pilih --</option>
              <option value="Perempuan">Perempuan (memenuhi syarat)</option>
              <option value="Laki-laki">Laki-laki (tidak memenuhi syarat)</option>
            </select>
            {isLakiLaki && (
              <p className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
                Program khusus perempuan — pendaftar ini harus ditolak pada tahap validasi.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5 text-[11px] text-slate-600">
            <div className="font-bold text-slate-800 text-xs mb-1">Checklist keaslian pendaftar:</div>
            <CheckItem ok={nikValid} label="NIK 16 digit & bukan asal ketik" />
            <CheckItem ok={hpValid} label="No. HP aktif & bisa dihubungi" />
            <CheckItem ok={!!pendaftar.email?.includes('@')} label="Email valid" />
            <CheckItem ok={!isLakiLaki && !!jenisKelamin} label="Jenis kelamin Perempuan" />
          </div>

          <div>
            <label className="form-label block text-xs font-bold text-slate-700 mb-1">
              Catatan Validasi {`(wajib jika menolak)`}
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Contoh: Lolos validasi, data benar & pendaftar perempuan. / Ditolak karena pendaftar laki-laki, program khusus perempuan."
              className="form-input w-full text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary btn-sm">Batal</button>
            <button
              type="button"
              onClick={() => submit('ditolak')}
              disabled={loading}
              className="btn btn-sm font-bold bg-rose-600 hover:bg-rose-700 text-white border-rose-600 disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Tolak di Validasi'}
            </button>
            <button
              type="button"
              onClick={() => submit('diterima')}
              disabled={loading || !jenisKelamin || isLakiLaki}
              title={isLakiLaki ? 'Laki-laki tidak bisa diloloskan' : 'Loloskan ke tahap verifikasi'}
              className="btn btn-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Terima → ke Verifikasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${ok ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
        {ok ? '✓' : '!'}
      </span>
      <span className={ok ? 'text-slate-700' : 'text-slate-500'}>{label}</span>
    </div>
  );
}
