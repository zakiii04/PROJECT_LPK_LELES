import { useState, useEffect } from 'react';
import { programsApi, tempatApi } from '@/lib/api';
import type { ProgramPelatihan, TempatPelatihan } from '@/lib/types';
import type { PendaftarFormData } from '@/lib/storage';

interface Step4Props {
  data: PendaftarFormData;
  onChange: (field: keyof PendaftarFormData, value: string) => void;
  errors: Record<string, string>;
}

export default function Step4PilihanPelatihan({
  data,
  onChange,
  errors,
}: Step4Props) {
  const [programList, setProgramList] = useState<ProgramPelatihan[]>([]);
  const [tempatList, setTempatList] = useState<TempatPelatihan[]>([]);

  useEffect(() => {
    programsApi.list().then((res) => {
      if (res.data && res.data.length > 0) {
        setProgramList(res.data);
        if (!data.jenis_pelatihan) {
          onChange('jenis_pelatihan', res.data[0].nama);
        }
        if (!data.program_id) {
          const selectedProgram = res.data.find((program) => program.nama === data.jenis_pelatihan) || res.data[0];
          onChange('program_id', selectedProgram.id);
        }
      }
    }).catch(() => {});

    tempatApi.list().then((res) => {
      if (res.data && res.data.length > 0) {
        setTempatList(res.data);
        if (!data.tempat_pelatihan) {
          const firstLabel = `${res.data[0].nama_tempat} (${res.data[0].alamat_lengkap})`;
          onChange('tempat_pelatihan' as keyof PendaftarFormData, firstLabel);
        }
      }
    }).catch(() => {});
  }, []);

  const selectedPelatihan = programList.find(
    (p) => p.nama === data.jenis_pelatihan || p.id === data.jenis_pelatihan
  ) || programList[0];

  return (
    <div className="animate-slide-right">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'var(--primary)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 12 3 12 0v-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Pilihan Pelatihan & Lokasi</h2>
          <p className="text-[var(--text-tertiary)] text-xs">Pilih program pelatihan dan opsi tempat pelatihan Anda</p>
        </div>
      </div>

      {/* Select Dropdown Program */}
      <div className="form-group mb-5">
        <label className="form-label" htmlFor="jenis_pelatihan">
          Program Pelatihan & Biaya <span className="required">*</span>
        </label>
        <select
          id="jenis_pelatihan"
          className={`form-input cursor-pointer font-medium ${errors.jenis_pelatihan ? 'error' : ''}`}
          value={data.jenis_pelatihan || ''}
          onChange={(e) => {
            const selectedProgram = programList.find((program) => program.nama === e.target.value);
            onChange('jenis_pelatihan', e.target.value);
            if (selectedProgram) {
              onChange('program_id', selectedProgram.id);
            }
          }}
        >
          {programList.length === 0 ? (
            <option value="">-- Memuat Program Pelatihan... --</option>
          ) : (
            programList.map((pelatihan) => (
              <option key={pelatihan.id} value={pelatihan.nama}>
                {pelatihan.nama} — {pelatihan.harga_formatted || `Rp ${pelatihan.harga.toLocaleString('id-ID')}`} ({pelatihan.durasi})
              </option>
            ))
          )}
        </select>
        {errors.jenis_pelatihan && (
          <span className="form-error">{errors.jenis_pelatihan}</span>
        )}
      </div>

      {/* Ringkasan Program Terpilih */}
      {selectedPelatihan && (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 mb-5 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 12 3 12 0v-5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-[var(--text-primary)] text-sm">{selectedPelatihan.nama}</h3>
              <span className="text-sm font-extrabold text-indigo-700">
                {selectedPelatihan.harga_formatted || `Rp ${selectedPelatihan.harga.toLocaleString('id-ID')}`}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">{selectedPelatihan.deskripsi}</p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Durasi Pelatihan: {selectedPelatihan.durasi}
            </div>
          </div>
        </div>
      )}

      {/* Opsi Tempat Pelatihan */}
      <div className="form-group mb-5">
        <label className="form-label" htmlFor="tempat_pelatihan">
          Opsi Tempat Pelatihan <span className="required">*</span>
        </label>
        <select
          id="tempat_pelatihan"
          className={`form-input cursor-pointer font-medium ${errors.tempat_pelatihan ? 'error' : ''}`}
          value={data.tempat_pelatihan || ''}
          onChange={(e) => onChange('tempat_pelatihan' as keyof PendaftarFormData, e.target.value)}
        >
          {tempatList.length === 0 ? (
            <option value="">-- Memuat Tempat Pelatihan... --</option>
          ) : (
            tempatList.map((t) => {
              const fullLabel = `${t.nama_tempat} (${t.alamat_lengkap})`;
              return (
                <option key={t.id} value={fullLabel}>
                  {fullLabel}
                </option>
              );
            })
          )}
        </select>
        {errors.tempat_pelatihan && (
          <span className="form-error">{errors.tempat_pelatihan}</span>
        )}
      </div>

      {/* Motivasi */}
      <div className="form-group mt-5">
        <label className="form-label" htmlFor="motivasi">
          Motivasi Mengikuti Pelatihan <span className="required">*</span>
        </label>
        <textarea
          id="motivasi"
          className={`form-input ${errors.motivasi ? 'error' : ''}`}
          placeholder="Tuliskan motivasi Anda mengikuti program pelatihan ini..."
          rows={3}
          value={data.motivasi}
          onChange={(e) => onChange('motivasi', e.target.value)}
        />
        {errors.motivasi && (
          <span className="form-error">{errors.motivasi}</span>
        )}
      </div>

      {/* Buat Akun Peserta */}
      <div className="mt-8 pt-6 border-t border-[var(--card-border)] space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full bg-[var(--primary)]" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            Buat Akun Portal Peserta
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Akun ini akan Anda gunakan untuk login ke portal peserta dan melakukan pembayaran setelah divalidasi oleh admin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <input
              id="username"
              type="text"
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Masukkan username"
              value={data.username || ''}
              onChange={(e) => onChange('username' as keyof PendaftarFormData, e.target.value)}
              autoComplete="username"
            />
            {errors.username && (
              <span className="form-error">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Minimal 6 karakter"
              value={data.password || ''}
              onChange={(e) => onChange('password' as keyof PendaftarFormData, e.target.value)}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
