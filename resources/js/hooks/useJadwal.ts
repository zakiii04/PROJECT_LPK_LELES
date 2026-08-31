'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jadwalApi } from '@/lib/api';
import type { CreateJadwalPayload } from '@/lib/types';

export function useJadwalList(params?: { jenis_sesi?: string; tanggal?: string }) {
  return useQuery({
    queryKey: ['jadwal', params],
    queryFn: async () => {
      const res = await jadwalApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useJadwal(id: string) {
  return useQuery({
    queryKey: ['jadwal', id],
    queryFn: async () => {
      const res = await jadwalApi.show(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateJadwal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateJadwalPayload) => {
      const res = await jadwalApi.create(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  });
}

export function useUpdateJadwal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Partial<CreateJadwalPayload> & { id: string }) => {
      const res = await jadwalApi.update(id, p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  });
}

export function useDeleteJadwal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await jadwalApi.destroy(id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  });
}

export function useAddPesertaJadwal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jadwalId, pendaftar_ids }: { jadwalId: string; pendaftar_ids: string[] }) => {
      const res = await jadwalApi.addPeserta(jadwalId, pendaftar_ids);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jadwal'] }),
  });
}
