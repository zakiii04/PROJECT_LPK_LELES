'use client';

import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import { authApi } from '@/lib/api';
import { setToken } from '@/lib/axios';

export default function PesertaLoginPage() {
  const [usernameOrNo, setUsernameOrNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usernameOrNo.trim() || !password.trim()) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login({ email: usernameOrNo, password });
      const data = res.data as any;
      if (res.success && data && (data.token || data.access_token || data.user)) {
        const token = data.token || data.access_token;
        const user = data.user as any;
        if (token) {
          setToken(token, 'PESERTA');
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('lpk_peserta_session', JSON.stringify({
            id: user.id || 'p-1',
            no_pendaftaran: user.no_pendaftaran || usernameOrNo,
          }));
        }
        router.visit('/peserta/dashboard');
        return;
      } else {
        setError(res.error || 'Email/username atau password salah.');
      }
    } catch (err: any) {
      console.error('[Peserta Login API Error]:', err);
      setError(err.response?.data?.message || err.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass-card-static p-8 md:p-10">
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white"
                style={{ background: 'var(--primary)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Portal Peserta
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Masuk menggunakan Username & Password yang Anda buat saat pendaftaran
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="form-group">
                <label className="form-label" htmlFor="peserta-username">
                  Username atau No. Pendaftaran
                </label>
                <input
                  id="peserta-username"
                  type="text"
                  className="form-input"
                  placeholder="Masukkan username Anda"
                  value={usernameOrNo}
                  onChange={(e) => setUsernameOrNo(e.target.value)}
                  autoComplete="username"
                  suppressHydrationWarning
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="peserta-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="peserta-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-[var(--danger-bg)] border border-[rgba(229,62,62,0.2)] text-sm text-[var(--danger)] flex items-start gap-2.5">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memeriksa Data...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Masuk ke Dashboard Peserta
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[var(--card-border)] text-center text-xs text-[var(--text-tertiary)] flex flex-col gap-2">
              <p>Belum divalidasi? <Link href="/status" className="text-[var(--primary)] font-semibold hover:underline">Cek status pendaftaran</Link></p>
              <p>Belum mendaftar? <Link href="/pendaftaran" className="text-[var(--primary)] font-semibold hover:underline">Daftar sekarang</Link></p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

