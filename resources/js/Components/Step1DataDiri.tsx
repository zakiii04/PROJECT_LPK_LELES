'use client';

import { useEffect, useState } from 'react';
import type { PendaftarFormData } from '@/lib/storage';

interface Step1Props {
  data: PendaftarFormData;
  onChange: (field: keyof PendaftarFormData, value: string) => void;
  errors: Record<string, string>;
}

interface WilayahItem {
  id: number | string;
  name: string;
}

export default function Step1DataDiri({ data, onChange, errors }: Step1Props) {
  const [provinsiList, setProvinsiList] = useState<WilayahItem[]>([]);
  const [kabupatenList, setKabupatenList] = useState<WilayahItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahItem[]>([]);
  const [kelurahanList, setKelurahanList] = useState<WilayahItem[]>([]);

  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedKabupatenId, setSelectedKabupatenId] = useState('');
  const [selectedKecamatanId, setSelectedKecamatanId] = useState('');

  // 1. Fetch Provinces
  useEffect(() => {
    async function fetchProvinsi() {
      try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        if (!response.ok) throw new Error('Gagal mengambil data provinsi');
        const result = await response.json();
        setProvinsiList(result || []);

        if (data.provinsi) {
          const match = (result || []).find((item: WilayahItem) => item.name === data.provinsi);
          if (match) setSelectedProvinsiId(String(match.id));
        }
      } catch (error) {
        console.error(error);
        setProvinsiList([]);
      }
    }

    fetchProvinsi();
  }, [data.provinsi]);

  // 2. Fetch Regencies (Kabupaten/Kota)
  useEffect(() => {
    if (!selectedProvinsiId) {
      setKabupatenList([]);
      setSelectedKabupatenId('');
      setKecamatanList([]);
      setSelectedKecamatanId('');
      setKelurahanList([]);
      return;
    }

    async function fetchKabupaten() {
      try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinsiId}.json`);
        if (!response.ok) throw new Error('Gagal mengambil data kabupaten');
        const result = await response.json();
        setKabupatenList(result || []);

        if (data.kabupaten_kota) {
          const match = (result || []).find((item: WilayahItem) => item.name === data.kabupaten_kota);
          if (match) setSelectedKabupatenId(String(match.id));
        }
      } catch (error) {
        console.error(error);
        setKabupatenList([]);
      }
    }

    fetchKabupaten();
  }, [selectedProvinsiId, data.kabupaten_kota]);

  // 3. Fetch Districts (Kecamatan)
  useEffect(() => {
    if (!selectedKabupatenId) {
      setKecamatanList([]);
      setSelectedKecamatanId('');
      setKelurahanList([]);
      return;
    }

    async function fetchKecamatan() {
      try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedKabupatenId}.json`);
        if (!response.ok) throw new Error('Gagal mengambil data kecamatan');
        const result = await response.json();
        setKecamatanList(result || []);

        if (data.kecamatan) {
          const match = (result || []).find((item: WilayahItem) => item.name === data.kecamatan);
          if (match) setSelectedKecamatanId(String(match.id));
        }
      } catch (error) {
        console.error(error);
        setKecamatanList([]);
      }
    }

    fetchKecamatan();
  }, [selectedKabupatenId, data.kecamatan]);

  // 4. Fetch Villages (Desa/Kelurahan)
  useEffect(() => {
    if (!selectedKecamatanId) {
      setKelurahanList([]);
      return;
    }

    async function fetchKelurahan() {
      try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecamatanId}.json`);
        if (!response.ok) throw new Error('Gagal mengambil data desa/kelurahan');
        const result = await response.json();
        setKelurahanList(result || []);
      } catch (error) {
        console.error(error);
        setKelurahanList([]);
      }
    }

    fetchKelurahan();
  }, [selectedKecamatanId]);

  const handleProvinsiChange = (value: string) => {
    const selected = provinsiList.find((item) => String(item.id) === value);
    setSelectedProvinsiId(value);
    setSelectedKabupatenId('');
    setSelectedKecamatanId('');
    setKabupatenList([]);
    setKecamatanList([]);
    setKelurahanList([]);
    onChange('provinsi', selected?.name || '');
    onChange('kabupaten_kota', '');
    onChange('kecamatan', '');
    onChange('desa_kelurahan', '');
  };

  const handleKabupatenChange = (value: string) => {
    const selected = kabupatenList.find((item) => String(item.id) === value);
    setSelectedKabupatenId(value);
    setSelectedKecamatanId('');
    setKecamatanList([]);
    setKelurahanList([]);
    onChange('kabupaten_kota', selected?.name || '');
    onChange('kecamatan', '');
    onChange('desa_kelurahan', '');
  };

  const handleKecamatanChange = (value: string) => {
    const selected = kecamatanList.find((item) => String(item.id) === value);
    setSelectedKecamatanId(value);
    setKelurahanList([]);
    onChange('kecamatan', selected?.name || '');
    onChange('desa_kelurahan', '');
  };

  const handleKelurahanChange = (value: string) => {
    const selected = kelurahanList.find((item) => String(item.id) === value);
    onChange('desa_kelurahan', selected?.name || '');
  };

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
        

        {/* Alamat */}
        <div className="form-group md:col-span-2">
          <label className="form-label">
            Alamat Lengkap <span className="required">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div className="space-y-4">
              <div className="form-group mb-4">
                <label className="form-label text-xs" htmlFor="provinsi">
                  Provinsi <span className="required">*</span>
                </label>
                <select
                  id="provinsi"
                  className={`form-input ${errors.provinsi ? 'error' : ''}`}
                  value={selectedProvinsiId}
                  onChange={(e) => handleProvinsiChange(e.target.value)}
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((option) => (
                    <option key={option.id} value={String(option.id)}>{option.name}</option>
                  ))}
                </select>
                {errors.provinsi && <span className="form-error">{errors.provinsi}</span>}
              </div>

              <div className="form-group mb-4">
                <label className="form-label text-xs" htmlFor="kabupaten_kota">
                  Kabupaten/Kota <span className="required">*</span>
                </label>
                <select
                  id="kabupaten_kota"
                  className={`form-input ${errors.kabupaten_kota ? 'error' : ''}`}
                  value={selectedKabupatenId}
                  onChange={(e) => handleKabupatenChange(e.target.value)}
                  disabled={!selectedProvinsiId || kabupatenList.length === 0}
                >
                  <option value="">Pilih Kabupaten/Kota</option>
                  {kabupatenList.map((option) => (
                    <option key={option.id} value={String(option.id)}>{option.name}</option>
                  ))}
                </select>
                {errors.kabupaten_kota && (
                  <span className="form-error">{errors.kabupaten_kota}</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="form-group mb-4">
                <label className="form-label text-xs" htmlFor="kecamatan">
                  Kecamatan <span className="required">*</span>
                </label>
                <select
                  id="kecamatan"
                  className={`form-input ${errors.kecamatan ? 'error' : ''}`}
                  value={selectedKecamatanId}
                  onChange={(e) => handleKecamatanChange(e.target.value)}
                  disabled={!selectedKabupatenId || kecamatanList.length === 0}
                >
                  <option value="">Pilih Kecamatan</option>
                  {kecamatanList.map((option) => (
                    <option key={option.id} value={String(option.id)}>{option.name}</option>
                  ))}
                </select>
                {errors.kecamatan && <span className="form-error">{errors.kecamatan}</span>}
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label text-xs" htmlFor="desa_kelurahan">
                  Desa/Kelurahan <span className="required">*</span>
                </label>
                <select
                  id="desa_kelurahan"
                  className={`form-input ${errors.desa_kelurahan ? 'error' : ''}`}
                  value={
                    data.desa_kelurahan
                      ? kelurahanList.find((i) => i.name.toLowerCase() === data.desa_kelurahan?.toLowerCase())?.id
                        ? String(kelurahanList.find((i) => i.name.toLowerCase() === data.desa_kelurahan?.toLowerCase())?.id)
                        : ''
                      : ''
                  }
                  onChange={(e) => handleKelurahanChange(e.target.value)}
                  disabled={!selectedKecamatanId || kelurahanList.length === 0}
                >
                  <option value="">Pilih Desa/Kelurahan</option>
                  {kelurahanList.map((option) => (
                    <option key={option.id} value={String(option.id)}>{option.name}</option>
                  ))}
                </select>
                {errors.desa_kelurahan && (
                  <span className="form-error">{errors.desa_kelurahan}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-group mt-1">
            <label className="form-label text-xs" htmlFor="alamat_lengkap">
              Detail Alamat <span className="required">*</span>
            </label>
            <textarea
              id="alamat_lengkap"
              rows={4}
              className={`form-input resize-y ${errors.alamat_lengkap ? 'error' : ''}`}
              placeholder="Masukkan alamat lengkap, termasuk nama jalan, nomor rumah, RT/RW, dan informasi tambahan lainnya"
              value={data.alamat_lengkap}
              onChange={(e) => onChange('alamat_lengkap', e.target.value)}
            />
            {errors.alamat_lengkap && <span className="form-error">{errors.alamat_lengkap}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
