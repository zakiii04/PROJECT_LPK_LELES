'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { angkatanApi } from '@/lib/api';
import type { AngkatanStatus, CreateAngkatanPayload, UpdateAngkatanPayload } from '@/lib/types';

export function useAngkatanList(params?: { status?: AngkatanStatus; program_id?: string }) {
  return useQuery({
    queryKey: ['angkatan', params],
    queryFn: async () => {
      const res = await angkatanApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useAngkatan(id: string) {
  return useQuery({
    queryKey: ['angkatan', id],
    queryFn: async () => {
      const res = await angkatanApi.show(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateAngkatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateAngkatanPayload) => {
      const res = await angkatanApi.create(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['angkatan'] }),
  });
}

export function useUpdateAngkatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: UpdateAngkatanPayload & { id: string }) => {
      const res = await angkatanApi.update(id, p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['angkatan'] }),
  });
}

export function useUpdateAngkatanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AngkatanStatus }) => {
      const res = await angkatanApi.updateStatus(id, status);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['angkatan'] }),
  });
}

export function useDeleteAngkatan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await angkatanApi.destroy(id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['angkatan'] }),
  });
}
