'use client';

import { useState, useEffect } from 'react';

export interface AlamatData {
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  desa_kelurahan?: string;
  detail_alamat?: string;
}

interface WilayahItem {
  id: number | string;
  name: string;
}

interface AlamatFormProps {
  data: AlamatData;
  onChange: (field: keyof AlamatData, value: string) => void;
  required?: boolean;
}

const wilayahCache: Record<string, WilayahItem[]> = {};

async function fetchWilayahCached(url: string): Promise<WilayahItem[]> {
  if (wilayahCache[url]) return wilayahCache[url];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      wilayahCache[url] = data;
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

export default function AlamatForm({ data, onChange, required = true }: AlamatFormProps) {
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
      const result = await fetchWilayahCached('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
      setProvinsiList(result);
      if (data.provinsi) {
        const match = result.find((item: WilayahItem) => item.name.toLowerCase() === data.provinsi?.toLowerCase());
        if (match) setSelectedProvinsiId(String(match.id));
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
      const result = await fetchWilayahCached(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinsiId}.json`);
      setKabupatenList(result);
      if (data.kabupaten_kota) {
        const match = result.find((item: WilayahItem) => item.name.toLowerCase() === data.kabupaten_kota?.toLowerCase());
        if (match) setSelectedKabupatenId(String(match.id));
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
      const result = await fetchWilayahCached(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedKabupatenId}.json`);
      setKecamatanList(result);
      if (data.kecamatan) {
        const match = result.find((item: WilayahItem) => item.name.toLowerCase() === data.kecamatan?.toLowerCase());
        if (match) setSelectedKecamatanId(String(match.id));
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
      const result = await fetchWilayahCached(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecamatanId}.json`);
      setKelurahanList(result);
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
    <div className="space-y-4">
      <div className="text-xs font-semibold text-slate-700">
        Alamat Lengkap {required && <span className="text-rose-500 font-bold">*</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1: Provinsi & Kecamatan */}
        <div>
          <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
            Provinsi {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <select
            className="form-input text-xs font-medium w-full"
            value={selectedProvinsiId}
            onChange={(e) => handleProvinsiChange(e.target.value)}
          >
            <option value="">Pilih Provinsi</option>
            {provinsiList.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
            Kecamatan {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <select
            className="form-input text-xs font-medium w-full"
            value={selectedKecamatanId}
            onChange={(e) => handleKecamatanChange(e.target.value)}
            disabled={!selectedKabupatenId || kecamatanList.length === 0}
          >
            <option value="">Pilih Kecamatan</option>
            {kecamatanList.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Kabupaten/Kota & Desa/Kelurahan */}
        <div>
          <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
            Kabupaten/Kota {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <select
            className="form-input text-xs font-medium w-full"
            value={selectedKabupatenId}
            onChange={(e) => handleKabupatenChange(e.target.value)}
            disabled={!selectedProvinsiId || kabupatenList.length === 0}
          >
            <option value="">Pilih Kabupaten/Kota</option>
            {kabupatenList.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
            Desa/Kelurahan {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          <select
            className="form-input text-xs font-medium w-full"
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
            {kelurahanList.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Detail Jalan / Catatan Alamat */}
        <div className="md:col-span-2">
          <label className="form-label block text-[11px] font-semibold text-slate-600 mb-1">
            Detail Jalan / Blok / Nomor Rumah
          </label>
          <input
            type="text"
            className="form-input text-xs font-medium w-full"
            placeholder="Contoh: Jl. Raya Leles No. 123"
            value={data.detail_alamat || ''}
            onChange={(e) => onChange('detail_alamat', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
