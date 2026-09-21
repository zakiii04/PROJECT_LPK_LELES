'use client';

import type { PendaftarFormData } from '@/lib/storage';
import AlamatForm from '@/Components/AlamatForm';

interface Step1Props {
  data: PendaftarFormData;
  onChange: (field: keyof PendaftarFormData, value: string) => void;
  errors: Record<string, string>;
}

export default function Step1DataDiri({ data, onChange, errors }: Step1Props) {

  return (
    <div className="animate-slide-right">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Data Diri</h2>
          <p className="text-[var(--text-tertiary)] text-xs">Lengkapi identitas pribadi Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        {/* Nama Lengkap */}
        <div className="form-group">
          <label className="form-label" htmlFor="nama_lengkap">
            Nama Lengkap <span className="required">*</span>
          </label>
          <input
            id="nama_lengkap"
            type="text"
            className={`form-input ${errors.nama_lengkap ? 'error' : ''}`}
            placeholder="Masukkan nama lengkap"
            value={data.nama_lengkap}
            onChange={(e) => onChange('nama_lengkap', e.target.value)}
          />
          {errors.nama_lengkap && (
            <span className="form-error">{errors.nama_lengkap}</span>
          )}
        </div>

        {/* NIK */}
        <div className="form-group">
          <label className="form-label" htmlFor="nik">
            NIK <span className="required">*</span>
          </label>
          <input
            id="nik"
            type="text"
            className={`form-input ${errors.nik ? 'error' : ''}`}
            placeholder="16 digit NIK"
            maxLength={16}
            value={data.nik}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              onChange('nik', value);
            }}
          />
          {errors.nik && <span className="form-error">{errors.nik}</span>}
        </div>

        {/* Tempat Lahir */}
        <div className="form-group">
          <label className="form-label" htmlFor="tempat_lahir">
            Tempat Lahir <span className="required">*</span>
          </label>
          <input
            id="tempat_lahir"
            type="text"
            className={`form-input ${errors.tempat_lahir ? 'error' : ''}`}
            placeholder="Contoh: Jakarta"
            value={data.tempat_lahir}
            onChange={(e) => onChange('tempat_lahir', e.target.value)}
          />
          {errors.tempat_lahir && (
            <span className="form-error">{errors.tempat_lahir}</span>
          )}
        </div>

        {/* Tanggal Lahir */}
        <div className="form-group">
          <label className="form-label" htmlFor="tanggal_lahir">
            Tanggal Lahir <span className="required">*</span>
          </label>
          <input
            id="tanggal_lahir"
            type="date"
            className={`form-input ${errors.tanggal_lahir ? 'error' : ''}`}
            value={data.tanggal_lahir}
            onChange={(e) => onChange('tanggal_lahir', e.target.value)}
          />
          {errors.tanggal_lahir && (
            <span className="form-error">{errors.tanggal_lahir}</span>
          )}
        </div>

        {/* Jenis Kelamin — program khusus perempuan, dicek di tahap Validasi */}
        <div className="form-group">
          <label className="form-label" htmlFor="jenis_kelamin">
            Jenis Kelamin <span className="required">*</span>
          </label>
          <select
            id="jenis_kelamin"
            className={`form-input ${errors.jenis_kelamin ? 'error' : ''}`}
            value={data.jenis_kelamin || ''}
            onChange={(e) => onChange('jenis_kelamin', e.target.value)}
          >
            <option value="">-- Pilih Jenis Kelamin --</option>
            <option value="Perempuan">Perempuan</option>
            <option value="Laki-laki">Laki-laki</option>
          </select>
          {errors.jenis_kelamin && (
            <span className="form-error">{errors.jenis_kelamin}</span>
          )}
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Program pelatihan ini khusus peserta perempuan. Data ini dicek pada tahap Validasi awal.
          </p>
        </div>
        

        {/* Alamat */}
        <div className="form-group md:col-span-2">
          <label className="form-label">
            Alamat Lengkap <span className="required">*</span>
          </label>
          <AlamatForm
            data={{
              provinsi: data.provinsi,
              kabupaten_kota: data.kabupaten_kota,
              kecamatan: data.kecamatan,
              desa_kelurahan: data.desa_kelurahan,
              detail_alamat: data.alamat_lengkap,
            }}
            onChange={(field, value) => {
              if (field === 'detail_alamat') {
                onChange('alamat_lengkap', value);
                return;
              }
              if (field === 'provinsi' || field === 'kabupaten_kota' || field === 'kecamatan' || field === 'desa_kelurahan') {
                onChange(field, value);
              }
            }}
            errors={{
              provinsi: errors.provinsi,
              kabupaten_kota: errors.kabupaten_kota,
              kecamatan: errors.kecamatan,
              desa_kelurahan: errors.desa_kelurahan,
              detail_alamat: errors.alamat_lengkap,
            }}
          />
        </div>
      </div>
    </div>
  );
}
