'use client';

import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import AdminPendaftarDetail from '@/Components/AdminPendaftarDetail';
import { pendaftarApi } from '@/lib/api';
import type { Pendaftar, Angkatan, ProgramPelatihan } from '@/lib/types';

interface PesertaDetailPageProps {
  id: string;
  initialPendaftar?: Pendaftar | null;
  initialAngkatanList?: Angkatan[];
  initialProgramList?: ProgramPelatihan[];
}

/**
 * Halaman detail peserta (menu Semua Peserta):
 * identitas + angkatan + tempat + fisik + status.
 * Tanpa popup — semua aksi inline di halaman.
 */
export default function PesertaDetailPage({ id, initialPendaftar }: PesertaDetailPageProps) {
  const [pendaftar, setPendaftar] = useState<Pendaftar | null>(initialPendaftar || null);
  const [loading, setLoading] = useState(!initialPendaftar);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await pendaftarApi.show(id);
      if (pRes.success && pRes.data) setPendaftar(pRes.data);
      else setNotification({ type: 'error', message: pRes.error || 'Gagal memuat data peserta.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal memuat data peserta.' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!initialPendaftar) loadData();
  }, [initialPendaftar, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700">Memuat Detail Peserta...</span>
        </div>
      </div>
    );
  }

  if (!pendaftar) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Peserta Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 mb-6">Data peserta yang Anda cari mungkin telah dihapus atau ID salah.</p>
          <button
            onClick={() => router.visit('/admin/dashboard')}
            className="btn btn-primary text-xs font-semibold px-5"
          >
            ← Kembali ke Dashboard Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {notification && (
          <div
            className={`p-4 mb-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}
        <AdminPendaftarDetail
          key={pendaftar.id + (pendaftar.status || '')}
          pendaftar={pendaftar}
          mode="semua"
          backLabel="Kembali ke Dashboard Admin"
          onClose={() => router.visit('/admin/dashboard')}
          onStatusChange={async () => {
            setNotification({ type: 'success', message: 'Data peserta diperbarui.' });
            await loadData();
          }}
        />
      </main>
    </div>
  );
}
