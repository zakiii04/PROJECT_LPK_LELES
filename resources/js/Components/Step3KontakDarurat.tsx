'use client';

import type { PendaftarFormData } from '@/lib/storage';

interface Step3Props {
  data: PendaftarFormData;
  onChange: (field: keyof PendaftarFormData, value: string) => void;
  errors: Record<string, string>;
}

export default function Step3KontakDarurat({
  data,
  onChange,
  errors,
}: Step3Props) {
  return (
    <div className="animate-slide-right">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Informasi Pribadi</h2>
          <p className="text-[var(--text-tertiary)] text-xs">Kontak dan riwayat pendidikan</p>
        </div>
      </div>

      {/* Kontak Pribadi Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Kontak Pribadi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          {/* No. HP */}
          <div className="form-group">
            <label className="form-label" htmlFor="no_hp">
              Nomor HP <span className="required">*</span>
            </label>
            <input
              id="no_hp"
              type="tel"
              className={`form-input ${errors.no_hp ? 'error' : ''}`}
              placeholder="081234567890"
              value={data.no_hp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                onChange('no_hp', value);
              }}
            />
            {errors.no_hp && <span className="form-error">{errors.no_hp}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="nama@gmail.com"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Pendidikan Terakhir</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
          <div className="form-group">
            <label className="form-label" htmlFor="jenjang_pendidikan">Jenjang Pendidikan <span className="required">*</span></label>
            <select id="jenjang_pendidikan" className={`form-input ${errors.jenjang_pendidikan ? 'error' : ''}`} value={data.jenjang_pendidikan || ''} onChange={(e) => onChange('jenjang_pendidikan', e.target.value)}>
              <option value="">Pilih jenjang</option>
              <option value="SMP/MTs">SMP/MTs</option>
              <option value="SMA/SMK/MA">SMA/SMK/MA</option>
              <option value="Diploma">Diploma</option>
              <option value="Sarjana (S1)">Sarjana (S1)</option>
              <option value="Magister (S2)">Magister (S2)</option>
            </select>
            {errors.jenjang_pendidikan && <span className="form-error">{errors.jenjang_pendidikan}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="asal_sekolah">Asal Sekolah <span className="required">*</span></label>
            <input id="asal_sekolah" type="text" className={`form-input ${errors.asal_sekolah ? 'error' : ''}`} placeholder="Contoh: SMK Negeri 1 Garut" value={data.asal_sekolah || ''} onChange={(e) => onChange('asal_sekolah', e.target.value)} />
            {errors.asal_sekolah && <span className="form-error">{errors.asal_sekolah}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tahun_lulus">Tahun Lulus <span className="required">*</span></label>
            <input id="tahun_lulus" type="number" min="1900" max={new Date().getFullYear() + 1} className={`form-input ${errors.tahun_lulus ? 'error' : ''}`} placeholder="Contoh: 2024" value={data.tahun_lulus || ''} onChange={(e) => onChange('tahun_lulus', e.target.value)} />
            {errors.tahun_lulus && <span className="form-error">{errors.tahun_lulus}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
