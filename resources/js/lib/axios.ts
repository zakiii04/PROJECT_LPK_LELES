import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError } from 'axios';

export type AppRole = 'ADMIN' | 'PESERTA' | 'HRD' | 'INSTRUKTUR';

const ACTIVE_ROLES_KEY = 'lpk_active_roles';

function roleKey(role: string): string {
  return `lpk_${role.toLowerCase()}_token`;
}

function userKey(role: string): string {
  return `lpk_${role.toLowerCase()}_user`;
}

export function getRoleFromPath(): AppRole | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return 'ADMIN';
  if (path.startsWith('/peserta')) return 'PESERTA';
  if (path.startsWith('/hrd')) return 'HRD';
  if (path.startsWith('/instruktur')) return 'INSTRUKTUR';
  return null;
}

// ── Active-role registry (untuk migrasi & logout global) ──

export function getActiveRoles(): AppRole[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVE_ROLES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return (Array.isArray(arr) ? arr.filter((r) => typeof r === 'string') : []) as AppRole[];
  } catch {
    return [];
  }
}

function addActiveRole(role: AppRole): void {
  if (typeof window === 'undefined') return;
  const roles = getActiveRoles();
  if (!roles.includes(role)) {
    roles.push(role);
    try {
      localStorage.setItem(ACTIVE_ROLES_KEY, JSON.stringify(roles));
    } catch { /* abaikan */ }
  }
}

function dropActiveRole(role: AppRole): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      ACTIVE_ROLES_KEY,
      JSON.stringify(getActiveRoles().filter((r) => r !== role)),
    );
  } catch { /* abaikan */ }
}

// ── Token storage: STRICT per-peran ─────────────────────────
// Setiap peran punya key sendiri (`lpk_admin_token`, dst.) sehingga login
// peran B di tab lain TIDAK PERNAH menimpa token peran A. Key generik lama
// (`lpk_token`/`token`/`lpk_auth_token`) tidak lagi dibaca/ditulis.

export function getToken(role?: AppRole | string | null): string | null {
  if (typeof window === 'undefined') return null;

  const targetRole = (role as AppRole) || getRoleFromPath();
  if (!targetRole) return null;

  return (
    sessionStorage.getItem(roleKey(targetRole)) ||
    localStorage.getItem(roleKey(targetRole))
  );
}

export function setToken(token: string, role?: AppRole | string | null): void {
  if (typeof window === 'undefined') return;

  const targetRole = (role as AppRole) || getRoleFromPath();
  if (!targetRole) return;

  sessionStorage.setItem(roleKey(targetRole), token);
  localStorage.setItem(roleKey(targetRole), token);
  addActiveRole(targetRole);
}

export function removeToken(role?: AppRole | string | null): void {
  if (typeof window === 'undefined') return;

  const targetRole = (role as AppRole) || getRoleFromPath();
  if (!targetRole) return;

  sessionStorage.removeItem(roleKey(targetRole));
  localStorage.removeItem(roleKey(targetRole));
  removeRoleUser(targetRole);
  dropActiveRole(targetRole);
}

// ── User cache: STRICT per-peran ────────────────────────────
// Pengganti shared `localStorage 'user'` yang dulu bikin profil satu peran
// tertukar dengan peran lain di tab sebelah.

export function setRoleUser(role: AppRole | string, user: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(userKey(role), JSON.stringify(user));
  } catch { /* abaikan */ }
}

export function getRoleUser<T = any>(role: AppRole | string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(userKey(role));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function removeRoleUser(role: AppRole | string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(userKey(role));
}

// ── Migrasi sekali jalan dari key generik lama ──────────────
// User yang sudah login sebelum update ini menyimpan token di key generik.
// Pindahkan ke key peran sesuai halaman aktif, lalu hapus key generik agar
// tidak terbaca lintas-peran lagi.

export function migrateLegacyAuthKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem('lpk_auth_migrated') === '1') return;

    const legacy =
      sessionStorage.getItem('lpk_token') ||
      localStorage.getItem('lpk_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('lpk_auth_token');

    const pathRole = getRoleFromPath();
    if (legacy && pathRole && !getToken(pathRole)) {
      sessionStorage.setItem(roleKey(pathRole), legacy);
      localStorage.setItem(roleKey(pathRole), legacy);
      addActiveRole(pathRole);
    }

    // Bersihkan key generik + cache user bersama (identitas diambil ulang
    // via /auth/me dengan token per-peran).
    sessionStorage.removeItem('lpk_token');
    localStorage.removeItem('lpk_token');
    localStorage.removeItem('token');
    localStorage.removeItem('lpk_auth_token');
    localStorage.removeItem('user');
    sessionStorage.setItem('lpk_auth_migrated', '1');
  } catch { /* abaikan */ }
}

if (typeof window !== 'undefined') {
  migrateLegacyAuthKeys();
}

// ── Axios client ────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

export interface RoleAwareConfig {
  /** Override peran untuk request ini (bila path tidak mencerminkan peran). */
  authRole?: AppRole | string;
  /** Diisi interceptor: peran yang tokennya dipakai request ini. */
  authRoleUsed?: AppRole | string | null;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const cfg = config as InternalAxiosRequestConfig & RoleAwareConfig;
  const role = cfg.authRole || getRoleFromPath();
  cfg.authRoleUsed = role || null;
  const token = role ? getToken(role) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Hapus HANYA token peran yang gagal — peran lain di tab sebelah
      // tidak boleh ikut logout.
      const cfg = (error.config as unknown as RoleAwareConfig) || {};
      const role = cfg.authRoleUsed || cfg.authRole || getRoleFromPath();
      if (role) removeToken(role);
      // Beri tahu tab yang berkepentingan (dashboard mendengarkan event
      // perannya sendiri bila perlu).
      try {
        window.dispatchEvent(
          new CustomEvent('lpk:unauthorized', { detail: { role } }),
        );
      } catch { /* abaikan */ }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
