'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface AlamatData {
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  desa_kelurahan?: string;
  detail_alamat?: string;
  rt?: string;
  rw?: string;
}

interface WilayahItem {
  id: number | string;
  name: string;
}

interface AlamatFormProps {
  data: AlamatData;
  onChange: (field: keyof AlamatData, value: string) => void;
  required?: boolean;
  showDetail?: boolean;
  errors?: Partial<Record<keyof AlamatData, string>>;
}

const WILAYAH_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const wilayahCache: Record<string, WilayahItem[]> = {};

async function fetchWilayahCached(url: string): Promise<WilayahItem[]> {
  if (wilayahCache[url]) return wilayahCache[url];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json)) {
      wilayahCache[url] = json;
      return json;
    }
    return [];
  } catch {
    return [];
  }
}

function matchWilayah(list: WilayahItem[], name?: string): WilayahItem | undefined {
  const needle = name?.trim().toLowerCase();
  if (!needle) return undefined;
  return list.find((item) => item.name.toLowerCase() === needle);
}

interface SearchableSelectProps {
  id: string;
  label: string;
  required?: boolean;
  items: WilayahItem[];
  valueId: string;
  selectedName?: string;
  disabled?: boolean;
  loading?: boolean;
  placeholder: string;
  disabledPlaceholder: string;
  error?: string;
  onSelect: (id: string, name: string) => void;
}

function SearchableSelect({
  id,
  label,
  required = true,
  items,
  valueId,
  selectedName,
  disabled = false,
  loading = false,
  placeholder,
  disabledPlaceholder,
  error,
  onSelect,
}: SearchableSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const selectedItem = items.find((item) => String(item.id) === valueId);
  const displayName = selectedItem?.name || selectedName || '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const choose = (item: WilayahItem) => {
    onSelect(String(item.id), item.name);
    setQuery('');
    setOpen(false);
  };

  const shownPlaceholder = disabled
    ? disabledPlaceholder
    : loading
      ? 'Memuat data...'
      : placeholder;

  return (
    <div className="form-group mb-0" ref={rootRef}>
      <label className="form-label" htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled || loading}
          className={`form-input pr-10 ${error ? 'error' : ''}`}
          placeholder={shownPlaceholder}
          value={open ? query : displayName}
          onFocus={() => {
            if (disabled || loading) return;
            setOpen(true);
            setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (disabled || loading) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setHighlight((prev) => Math.min(prev + 1, Math.max(filtered.length - 1, 0)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const item = filtered[highlight];
              if (item) choose(item);
            } else if (e.key === 'Escape') {
              setOpen(false);
              setQuery('');
            }
          }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>

        {open && !disabled && !loading && (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil untuk “{query}”</div>
            ) : (
              filtered.map((item, index) => (
                <button
                  key={String(item.id)}
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    String(item.id) === valueId
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : index === highlight
                        ? 'bg-slate-100 text-slate-800'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(item);
                  }}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export default function AlamatForm({
  data,
  onChange,
  required = true,
  showDetail = true,
  errors = {},
}: AlamatFormProps) {
  const [provinsiList, setProvinsiList] = useState<WilayahItem[]>([]);
  const [kabupatenList, setKabupatenList] = useState<WilayahItem[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahItem[]>([]);
  const [kelurahanList, setKelurahanList] = useState<WilayahItem[]>([]);

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingKab, setLoadingKab] = useState(false);
  const [loadingKec, setLoadingKec] = useState(false);
  const [loadingKel, setLoadingKel] = useState(false);

  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedKabupatenId, setSelectedKabupatenId] = useState('');
  const [selectedKecamatanId, setSelectedKecamatanId] = useState('');
  const [selectedKelurahanId, setSelectedKelurahanId] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProvinsi() {
      setLoadingProv(true);
      const result = await fetchWilayahCached(`${WILAYAH_BASE}/provinces.json`);
      if (!isMounted) return;
      setProvinsiList(result);
      setLoadingProv(false);
    }
    loadProvinsi();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const match = matchWilayah(provinsiList, data.provinsi);
    setSelectedProvinsiId(match ? String(match.id) : '');
  }, [provinsiList, data.provinsi]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedProvinsiId) {
      setKabupatenList([]);
      setSelectedKabupatenId('');
      setKecamatanList([]);
      setSelectedKecamatanId('');
      setKelurahanList([]);
      setSelectedKelurahanId('');
      return;
    }

    async function loadKabupaten() {
      setLoadingKab(true);
      const result = await fetchWilayahCached(`${WILAYAH_BASE}/regencies/${selectedProvinsiId}.json`);
      if (!isMounted) return;
      setKabupatenList(result);
      setLoadingKab(false);
    }
    loadKabupaten();
    return () => {
      isMounted = false;
    };
  }, [selectedProvinsiId]);

  useEffect(() => {
    const match = matchWilayah(kabupatenList, data.kabupaten_kota);
    setSelectedKabupatenId(match ? String(match.id) : '');
  }, [kabupatenList, data.kabupaten_kota]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedKabupatenId) {
      setKecamatanList([]);
      setSelectedKecamatanId('');
      setKelurahanList([]);
      setSelectedKelurahanId('');
      return;
    }

    async function loadKecamatan() {
      setLoadingKec(true);
      const result = await fetchWilayahCached(`${WILAYAH_BASE}/districts/${selectedKabupatenId}.json`);
      if (!isMounted) return;
      setKecamatanList(result);
      setLoadingKec(false);
    }
    loadKecamatan();
    return () => {
      isMounted = false;
    };
  }, [selectedKabupatenId]);

  useEffect(() => {
    const match = matchWilayah(kecamatanList, data.kecamatan);
    setSelectedKecamatanId(match ? String(match.id) : '');
  }, [kecamatanList, data.kecamatan]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedKecamatanId) {
      setKelurahanList([]);
      setSelectedKelurahanId('');
      return;
    }

    async function loadKelurahan() {
      setLoadingKel(true);
      const result = await fetchWilayahCached(`${WILAYAH_BASE}/villages/${selectedKecamatanId}.json`);
      if (!isMounted) return;
      setKelurahanList(result);
      setLoadingKel(false);
    }
    loadKelurahan();
    return () => {
      isMounted = false;
    };
  }, [selectedKecamatanId]);

  useEffect(() => {
    const match = matchWilayah(kelurahanList, data.desa_kelurahan);
    setSelectedKelurahanId(match ? String(match.id) : '');
  }, [kelurahanList, data.desa_kelurahan]);

  const handleProvinsiChange = (id: string, name: string) => {
    setSelectedProvinsiId(id);
    setSelectedKabupatenId('');
    setSelectedKecamatanId('');
    setSelectedKelurahanId('');
    setKabupatenList([]);
    setKecamatanList([]);
    setKelurahanList([]);
    onChange('provinsi', name);
    onChange('kabupaten_kota', '');
    onChange('kecamatan', '');
    onChange('desa_kelurahan', '');
  };

  const handleKabupatenChange = (id: string, name: string) => {
    setSelectedKabupatenId(id);
    setSelectedKecamatanId('');
    setSelectedKelurahanId('');
    setKecamatanList([]);
    setKelurahanList([]);
    onChange('kabupaten_kota', name);
    onChange('kecamatan', '');
    onChange('desa_kelurahan', '');
  };

  const handleKecamatanChange = (id: string, name: string) => {
    setSelectedKecamatanId(id);
    setSelectedKelurahanId('');
    setKelurahanList([]);
    onChange('kecamatan', name);
    onChange('desa_kelurahan', '');
  };

  const handleKelurahanChange = (id: string, name: string) => {
    setSelectedKelurahanId(id);
    onChange('desa_kelurahan', name);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <SearchableSelect
          id="provinsi"
          label="Provinsi"
          required={required}
          items={provinsiList}
          valueId={selectedProvinsiId}
          selectedName={data.provinsi}
          loading={loadingProv}
          placeholder="Cari atau pilih provinsi"
          disabledPlaceholder="Cari atau pilih provinsi"
          error={errors.provinsi}
          onSelect={handleProvinsiChange}
        />

        <SearchableSelect
          id="kabupaten_kota"
          label="Kabupaten / Kota"
          required={required}
          items={kabupatenList}
          valueId={selectedKabupatenId}
          selectedName={data.kabupaten_kota}
          disabled={!selectedProvinsiId}
          loading={loadingKab}
          placeholder="Cari atau pilih kabupaten/kota"
          disabledPlaceholder="Pilih provinsi terlebih dahulu"
          error={errors.kabupaten_kota}
          onSelect={handleKabupatenChange}
        />

        <SearchableSelect
          id="kecamatan"
          label="Kecamatan"
          required={required}
          items={kecamatanList}
          valueId={selectedKecamatanId}
          selectedName={data.kecamatan}
          disabled={!selectedKabupatenId}
          loading={loadingKec}
          placeholder="Cari atau pilih kecamatan"
          disabledPlaceholder="Pilih kabupaten/kota terlebih dahulu"
          error={errors.kecamatan}
          onSelect={handleKecamatanChange}
        />

        <SearchableSelect
          id="desa_kelurahan"
          label="Desa / Kelurahan"
          required={required}
          items={kelurahanList}
          valueId={selectedKelurahanId}
          selectedName={data.desa_kelurahan}
          disabled={!selectedKecamatanId}
          loading={loadingKel}
          placeholder="Cari atau pilih desa/kelurahan"
          disabledPlaceholder="Pilih kecamatan terlebih dahulu"
          error={errors.desa_kelurahan}
          onSelect={handleKelurahanChange}
        />
      </div>

      {showDetail && (
        <div className="form-group">
          <label className="form-label" htmlFor="detail_alamat">
            Detail Alamat {required && <span className="required">*</span>}
          </label>
          <textarea
            id="detail_alamat"
            rows={4}
            className={`form-input resize-y ${errors.detail_alamat ? 'error' : ''}`}
            placeholder="Masukkan nama jalan, nomor rumah, RT/RW, dan informasi tambahan lainnya"
            value={data.detail_alamat || ''}
            onChange={(e) => onChange('detail_alamat', e.target.value)}
          />
          {errors.detail_alamat && <span className="form-error">{errors.detail_alamat}</span>}
        </div>
      )}
    </div>
  );
}
