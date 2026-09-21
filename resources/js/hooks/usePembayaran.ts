'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pembayaranApi, pendaftarApi } from '@/lib/api';

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
