import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError } from 'axios';

const TOKEN_KEY = 'lpk_token';

function getRoleFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'ADMIN';
  if (path.startsWith('/peserta')) return 'PESERTA';
  if (path.startsWith('/hrd')) return 'HRD';
  if (path.startsWith('/instruktur')) return 'INSTRUKTUR';
  return null;
}

export function getToken(role?: string): string | null {
  if (typeof window === 'undefined') return null;

  const targetRole = role || getRoleFromPath();

  if (targetRole) {
    const roleKey = `lpk_${targetRole.toLowerCase()}_token`;
    const token = sessionStorage.getItem(roleKey) || localStorage.getItem(roleKey);
    if (token) return token;
  }

  return (
    sessionStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('lpk_auth_token')
  );
}

export function setToken(token: string, role?: string): void {
  if (typeof window === 'undefined') return;

  const targetRole = role || getRoleFromPath();

  if (targetRole) {
    const roleKey = `lpk_${targetRole.toLowerCase()}_token`;
    sessionStorage.setItem(roleKey, token);
    localStorage.setItem(roleKey, token);
  }

  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('token', token);
  localStorage.setItem('lpk_auth_token', token);
}

export function removeToken(role?: string): void {
  if (typeof window === 'undefined') return;

  const targetRole = role || getRoleFromPath();

  if (targetRole) {
    const roleKey = `lpk_${targetRole.toLowerCase()}_token`;
    sessionStorage.removeItem(roleKey);
    localStorage.removeItem(roleKey);
  }

  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('lpk_auth_token');
}

const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      removeToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
