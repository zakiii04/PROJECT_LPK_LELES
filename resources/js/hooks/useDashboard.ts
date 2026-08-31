'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await dashboardApi.summary();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function usePendaftarPerBulan() {
  return useQuery({
    queryKey: ['dashboard', 'pendaftar-per-bulan'],
    queryFn: async () => {
      const res = await dashboardApi.pendaftarPerBulan();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useKelulusanStats() {
  return useQuery({
    queryKey: ['dashboard', 'kelulusan-stats'],
    queryFn: async () => {
      const res = await dashboardApi.kelulusanStats();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function usePembayaranStats() {
  return useQuery({
    queryKey: ['dashboard', 'pembayaran-stats'],
    queryFn: async () => {
      const res = await dashboardApi.pembayaranStats();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useKehadiranStats() {
  return useQuery({
    queryKey: ['dashboard', 'kehadiran-stats'],
    queryFn: async () => {
      const res = await dashboardApi.kehadiranStats();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}
