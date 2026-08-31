'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi } from '@/lib/api';
import type { CreateInterviewPayload } from '@/lib/types';

export function useInterviewList() {
  return useQuery({
    queryKey: ['interview'],
    queryFn: async () => {
      const res = await interviewApi.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateInterviewPayload) => {
      const res = await interviewApi.create(p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interview'] }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Partial<CreateInterviewPayload> & { id: string }) => {
      const res = await interviewApi.update(id, p);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interview'] }),
  });
}

export function useDeleteInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await interviewApi.destroy(id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interview'] }),
  });
}
