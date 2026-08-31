'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pembayaranApi, cicilanApi, pendaftarApi } from '@/lib/api';
import type { CreateCicilanPayload } from '@/lib/types';

export function usePembayaran(pendaftarId: string) {
  return useQuery({
    queryKey: ['pembayaran', pendaftarId],
    queryFn: async () => {
      const res = await pendaftarApi.getPembayaran(pendaftarId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!pendaftarId,
  });
}

export function useCicilan(pendaftarId: string) {
  return useQuery({
    queryKey: ['cicilan', pendaftarId],
    queryFn: async () => {
      const res = await pendaftarApi.getCicilan(pendaftarId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!pendaftarId,
  });
}

export function useUploadBuktiPembayaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pendaftarId, formData }: { pendaftarId: string; formData: FormData }) => {
      const res = await pembayaranApi.uploadBukti(pendaftarId, formData);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (_, { pendaftarId }) => {
      qc.invalidateQueries({ queryKey: ['pembayaran', pendaftarId] });
      qc.invalidateQueries({ queryKey: ['pendaftar'] });
    },
  });
}

export function useVerifikasiPembayaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pendaftarId: string) => {
      const res = await pembayaranApi.verifikasi(pendaftarId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pembayaran'] });
      qc.invalidateQueries({ queryKey: ['pendaftar'] });
    },
  });
}

export function useCreateCicilan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pendaftarId, payload }: { pendaftarId: string; payload: CreateCicilanPayload }) => {
      const res = await cicilanApi.create(pendaftarId, payload);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (_, { pendaftarId }) => {
      qc.invalidateQueries({ queryKey: ['cicilan', pendaftarId] });
    },
  });
}

export function useVerifikasiCicilan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cicilanId: string) => {
      const res = await cicilanApi.verifikasi(cicilanId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cicilan'] });
      qc.invalidateQueries({ queryKey: ['pembayaran'] });
      qc.invalidateQueries({ queryKey: ['pendaftar'] });
    },
  });
}
