'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { soalApi, ujianApi } from '@/lib/api';
import type { CreateSoalPayload, MulaiUjianParams, SubmitUjianPayload } from '@/lib/types';

export function useSoalList(params?: { tipe?: string; program_id?: string }) {
  return useQuery({
    queryKey: ['soal', params],
    queryFn: async () => {
      const res = await soalApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useCreateSoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateSoalPayload) => {
      const res = await soalApi.create(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soal'] }),
  });
}

export function useUpdateSoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Partial<CreateSoalPayload> & { id: string }) => {
      const res = await soalApi.update(id, p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soal'] }),
  });
}

export function useDeleteSoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await soalApi.destroy(id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['soal'] }),
  });
}

export function useMulaiUjian(params: MulaiUjianParams) {
  return useQuery({
    queryKey: ['ujian', 'mulai', params],
    queryFn: async () => {
      const res = await ujianApi.mulai(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: false, // manual trigger with refetch()
  });
}

export function useSubmitUjian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: SubmitUjianPayload) => {
      const res = await ujianApi.submit(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ujian'] }),
  });
}
