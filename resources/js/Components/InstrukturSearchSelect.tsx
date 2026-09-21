'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Instruktur } from '@/lib/types';

interface InstrukturSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  instrukturList: Instruktur[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onlyActive?: boolean;
}

export default function InstrukturSearchSelect({
  value,
  onChange,
  instrukturList,
  placeholder = 'Ketik untuk cari instruktur...',
  required = false,
  disabled = false,
  onlyActive = true,
}: InstrukturSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const candidates = useMemo(() => {
    const list = onlyActive
      ? instrukturList.filter((i) => i.status === 'Aktif')
      : instrukturList;
    // Aktif dulu, lalu abjad
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Aktif' ? -1 : 1;
      return a.nama.localeCompare(b.nama);
    });
  }, [instrukturList, onlyActive]);

  const filtered = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (i) =>
        i.nama.toLowerCase().includes(q) ||
        (i.keahlian || '').toLowerCase().includes(q)
    );
  }, [value, candidates]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [value, open]);

  const pick = (nama: string) => {
    onChange(nama);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && open && filtered.length > 0) {
      // Jangan submit form saat memilih via Enter — pilih highlight dulu
      e.preventDefault();
      pick(filtered[Math.min(highlight, filtered.length - 1)].nama);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const exactMatch = candidates.some(
    (i) => i.nama.toLowerCase() === (value || '').trim().toLowerCase()
  );

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="form-input pr-16"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          required={required}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              title="Bersihkan"
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
                setOpen(true);
              }}
              className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] leading-none flex items-center justify-center"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            title={open ? 'Tutup daftar' : 'Buka daftar'}
            onClick={() => {
              if (disabled) return;
              setOpen((v) => !v);
              inputRef.current?.focus();
            }}
            className="text-slate-400 hover:text-slate-700 px-1"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-50 bottom-full mb-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500">
                <div className="font-semibold text-slate-600">Tidak ditemukan</div>
                <div className="mt-0.5">
                  {value.trim() ? (
                    <>
                      Gunakan teks manual: <span className="font-bold text-slate-800">“{value.trim()}”</span>
                    </>
                  ) : (
                    'Belum ada data instruktur aktif.'
                  )}
                </div>
              </div>
            ) : (
              filtered.map((ins, idx) => {
                const isSelected =
                  (value || '').trim().toLowerCase() === ins.nama.toLowerCase();
                const isHighlight = idx === highlight;
                return (
                  <button
                    key={ins.id}
                    type="button"
                    onClick={() => pick(ins.nama)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                      isHighlight ? 'bg-indigo-50' : 'bg-white'
                    } hover:bg-indigo-50`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 truncate">
                        {ins.nama}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {ins.keahlian || 'Instruktur'}
                        {ins.status !== 'Aktif' ? ` • ${ins.status}` : ''}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Dipilih
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-slate-100 px-3 py-1.5 flex items-center justify-between bg-slate-50/80">
            <span className="text-[10px] text-slate-500 font-mono">
              {filtered.length} instruktur
              {value.trim() && !exactMatch ? ' • teks manual diizinkan' : ''}
            </span>
            {value.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => pick(value.trim())}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                Pakai “{value.trim().slice(0, 24)}{value.trim().length > 24 ? '…' : ''}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
