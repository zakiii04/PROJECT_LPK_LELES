'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kelulusanApi, sertifikatApi } from '@/lib/api';
import type { CreateKelulusanPayload } from '@/lib/types';

export function useKelulusanList() {
  return useQuery({
    queryKey: ['kelulusan'],
    queryFn: async () => {
      const res = await kelulusanApi.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useKelulusan(id: string) {
  return useQuery({
    queryKey: ['kelulusan', id],
    queryFn: async () => {
      const res = await kelulusanApi.show(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateKelulusan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateKelulusanPayload) => {
      const res = await kelulusanApi.create(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kelulusan'] }),
  });
}

export function useUpdateKelulusan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Partial<CreateKelulusanPayload> & { id: string }) => {
      const res = await kelulusanApi.update(id, p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kelulusan'] }),
  });
}

export function useVerifySertifikat(noSertifikat: string) {
  return useQuery({
    queryKey: ['sertifikat', noSertifikat],
    queryFn: async () => {
      const res = await sertifikatApi.verify(noSertifikat);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!noSertifikat,
  });
}
