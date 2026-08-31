'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pendaftarApi } from '@/lib/api';
import type { CreatePendaftarPayload, PendaftarStatus } from '@/lib/types';

export function usePendaftarList(params?: {
  status?: PendaftarStatus;
  search?: string;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ['pendaftar', params],
    queryFn: async () => {
      const res = await pendaftarApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function usePendaftar(id: string) {
  return useQuery({
    queryKey: ['pendaftar', id],
    queryFn: async () => {
      const res = await pendaftarApi.show(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function usePendaftarMe() {
  return useQuery({
    queryKey: ['pendaftar', 'me'],
    queryFn: async () => {
      const res = await pendaftarApi.me();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useCreatePendaftar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePendaftarPayload) => {
      const res = await pendaftarApi.create(payload);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendaftar'] }),
  });
}

export function useUpdatePendaftarStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PendaftarStatus }) => {
      const res = await pendaftarApi.updateStatus(id, status);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendaftar'] }),
  });
}

export function useAlokasiAngkatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, angkatan_id }: { id: string; angkatan_id: string }) => {
      const res = await pendaftarApi.alokasiAngkatan(id, angkatan_id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendaftar'] }),
  });
}

export function useDeletePendaftar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await pendaftarApi.destroy(id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendaftar'] }),
  });
}
