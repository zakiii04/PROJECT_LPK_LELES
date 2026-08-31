import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import { authApi } from '@/lib/api';
import { setToken } from '@/lib/axios';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('lpk_admin_logged_in') === 'true') {
      router.visit('/admin/dashboard');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Username dan password wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Coba login via Backend API (POST /auth/login)
      const res = await authApi.login({ email: cleanUsername, password: cleanPassword });
      
      if (res.success && res.data) {
        const data = res.data as any;
        const token = data.token || data.access_token;
        const user = data.user;
        if (token) {
          setToken(token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        sessionStorage.setItem('lpk_admin_logged_in', 'true');
        router.visit('/admin/dashboard');
        return;
      } else if (res.error) {
        // Jika server backend membalas pesan error dari Laravel
        setError(res.error);
        setIsLoading(false);
        return;
      }
    } catch (apiErr) {
      console.warn('[Login API Warning]:', apiErr);
    }

    // 2. Fallback jika offline / demo
    if (cleanUsername.toLowerCase() === 'admin' && cleanPassword === 'admin123') {
      sessionStorage.setItem('lpk_admin_logged_in', 'true');
      router.visit('/admin/dashboard');
    } else {
      setError('Username atau password salah (Demo: admin / admin123)');
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Login Admin</h1>
              <p className="text-sm text-[var(--text-secondary)]">Masuk ke dashboard untuk mengelola pendaftaran</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="form-group">
                <label className="form-label" htmlFor="admin-username">Username</label>
                <input id="admin-username" type="text" className="form-input" placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" suppressHydrationWarning />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">Password</label>
                <div className="relative">
                  <input id="admin-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" suppressHydrationWarning />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" onClick={() => setShowPassword(!showPassword)}>
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
                <div className="p-3 rounded-lg bg-[var(--danger-bg)] border border-[rgba(220,38,38,0.15)] text-sm text-[var(--danger)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Masuk
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-3 rounded-lg bg-[var(--primary-bg)] border border-[rgba(79,70,229,0.1)] text-xs text-[var(--text-secondary)] text-center">
              Demo: username <span className="font-mono font-semibold text-[var(--primary)]">admin</span> / password <span className="font-mono font-semibold text-[var(--primary)]">admin123</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
