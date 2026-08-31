'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { programsApi } from '@/lib/api';
import type { CreateProgramPayload, UpdateProgramPayload } from '@/lib/types';

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await programsApi.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      const res = await programsApi.show(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProgramPayload) => {
      const res = await programsApi.create(payload);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateProgramPayload & { id: string }) => {
      const res = await programsApi.update(id, payload);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await programsApi.destroy(id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  });
}
