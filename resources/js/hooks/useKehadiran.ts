'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kehadiranApi, pendaftarApi } from '@/lib/api';
import type { CreateKehadiranPayload, BulkKehadiranPayload } from '@/lib/types';

export function useKehadiranList(params?: { pendaftar_id?: string; tanggal?: string }) {
  return useQuery({
    queryKey: ['kehadiran', params],
    queryFn: async () => {
      const res = await kehadiranApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useKehadiranByPendaftar(pendaftarId: string) {
  return useQuery({
    queryKey: ['kehadiran', 'pendaftar', pendaftarId],
    queryFn: async () => {
      const res = await pendaftarApi.getKehadiran(pendaftarId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!pendaftarId,
  });
}

export function useCreateKehadiran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateKehadiranPayload) => {
      const res = await kehadiranApi.create(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kehadiran'] }),
  });
}

export function useCreateBulkKehadiran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: BulkKehadiranPayload) => {
      const res = await kehadiranApi.createBulk(p);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kehadiran'] }),
  });
}
