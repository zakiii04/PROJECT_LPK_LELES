'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { setToken, removeToken } from '@/lib/axios';
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
      setToken(data.token);
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
      removeToken();
      qc.clear();
    },
  });
}
