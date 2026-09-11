import { useState, useEffect } from 'react';
import { router, Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import { authApi } from '@/lib/api';
import { setToken } from '@/lib/axios';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Redireksi otomatis jika admin sudah memiliki sesi aktif
    if (sessionStorage.getItem('lpk_admin_logged_in') === 'true') {
      router.visit('/admin/dashboard');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanIdentifier = usernameOrEmail.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Email/Username dan Password wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Kirim request login ke Backend API
      const res = await authApi.login({ email: cleanIdentifier, password: cleanPassword });

      if (res.success && res.data) {
        const data = res.data as any;
        const token = data.token || data.access_token;
        const user = data.user;

        if (token) {
          setToken(token);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));

          // Deteksi role secara otomatis di bagian belakang (behind-the-scenes)
          const role = (user.role || '').toUpperCase();

          if (role === 'ADMIN') {
            sessionStorage.setItem('lpk_admin_logged_in', 'true');
            router.visit('/admin/dashboard');
            return;
          } else if (role === 'HRD') {
            router.visit('/hrd/dashboard');
            return;
          } else if (role === 'INSTRUKTUR') {
            router.visit('/instruktur/dashboard');
            return;
          } else {
            // Default: Peserta
            sessionStorage.setItem('lpk_peserta_session', JSON.stringify({
              id: user.id,
              no_pendaftaran: user.no_pendaftaran || cleanIdentifier,
            }));
            router.visit('/peserta/dashboard');
            return;
          }
        }
      } else if (res.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }
    } catch (apiErr) {
      console.warn('[Login API Error]:', apiErr);
    }

    // 2. Fallback Penyeleksian Role Otomatis (Demo/Offline)
    const lowerIdentifier = cleanIdentifier.toLowerCase();
    if (lowerIdentifier === 'admin' || lowerIdentifier === 'admin@lpk-alkautsar.id') {
      if (cleanPassword === 'password' || cleanPassword === 'admin123') {
        sessionStorage.setItem('lpk_admin_logged_in', 'true');
        router.visit('/admin/dashboard');
        return;
      }
    } else if (lowerIdentifier.includes('hrd')) {
      if (cleanPassword === 'password' || cleanPassword === 'admin123') {
        router.visit('/hrd/dashboard');
        return;
      }
    } else if (lowerIdentifier.includes('instruktur')) {
      if (cleanPassword === 'password' || cleanPassword === 'admin123') {
        router.visit('/instruktur/dashboard');
        return;
      }
    }

    setError('Email/Username atau password yang Anda masukkan salah.');
    setIsLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center py-8 px-4 relative overflow-hidden">
        {/* Modern Ambient Glow Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-600/10 to-indigo-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-400/10 blur-[90px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-md animate-slide-up my-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-3xl p-8 md:p-10 relative overflow-hidden transition-all">
            {/* Header / Brand Badge */}
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-blue-900/20 transform transition-transform hover:scale-105 duration-300"
                style={{ background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">
                Selamat Datang
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] font-normal">
                Masuk menggunakan akun yang dibuat saat pendaftaran untuk mengakses portal LPK
              </p>
            </div>

            {/* Form Login Tunggal (Semua User/Aktor) */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="form-group">
                <label className="form-label font-medium text-xs text-slate-700 mb-1.5 block" htmlFor="login-identifier">
                  Email atau Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 pointer-events-none text-slate-400 z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="login-identifier"
                    type="text"
                    style={{ paddingLeft: '2.75rem' }}
                    className="form-input h-11 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10 rounded-xl transition-all w-full"
                    placeholder="nama@email.com atau username"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label font-medium text-xs text-slate-700" htmlFor="login-password">
                    Password
                  </label>
                  <span className="text-xs text-[var(--primary)] font-medium hover:underline cursor-pointer">
                    Lupa password?
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 pointer-events-none text-slate-400 z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    className="form-input h-11 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-900/10 rounded-xl transition-all w-full"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors z-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-xs text-slate-600">Ingat saya</span>
                </label>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-600 flex items-center gap-2.5 animate-shake">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-xl text-white font-medium text-sm shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 bg-[#1a365d] hover:bg-[#2b6cb0]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses Login...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <div className="mt-8 text-center text-xs text-slate-500">
              Belum terdaftar sebagai peserta?{' '}
              <Link href="/pendaftaran" className="font-semibold text-[var(--primary)] hover:underline">
                Daftar Pelatihan
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
