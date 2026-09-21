'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { setToken, removeToken, setRoleUser, getRoleFromPath, type AppRole } from '@/lib/axios';
import type { LoginCredentials } from '@/lib/types';

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authApi.me();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await authApi.login(credentials);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data) => {
      const detected = ((data.user as any)?.role || '').toUpperCase();
      const role = (
        detected === 'ADMIN' || detected === 'HRD' || detected === 'INSTRUKTUR'
          ? detected
          : (getRoleFromPath() || 'PESERTA')
      ) as AppRole;
      setToken(data.token, role);
      if ((data as any).user) setRoleUser(role, (data as any).user);
      qc.setQueryData(['auth', 'me'], data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSettled: () => {
      // Hapus hanya token peran halaman aktif — peran lain tetap login.
      removeToken(getRoleFromPath());
      qc.clear();
    },
  });
}
