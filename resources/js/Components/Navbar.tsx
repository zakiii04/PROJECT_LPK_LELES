import { Link, usePage } from '@inertiajs/react';

export default function Navbar() {
  const { url } = usePage();

  const isActive = (path: string) => url === path;

  return (
    <nav className="navbar">
      <div className="container-wide flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm font-semibold"
            style={{ background: 'var(--primary)' }}
          >
            LPK
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">
              Lembaga Pelatihan
            </div>
            <div className="text-xs text-[var(--text-tertiary)] leading-tight">
              Kerja Profesional
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`btn btn-ghost btn-sm ${
              isActive('/') ? 'text-[var(--primary)] bg-[var(--primary-bg)]' : ''
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/pendaftaran"
            className={`btn btn-ghost btn-sm ${
              isActive('/pendaftaran') ? 'text-[var(--primary)] bg-[var(--primary-bg)]' : ''
            }`}
          >
            Daftar Pelatihan
          </Link>
          <Link
            href="/login"
            className={`btn btn-primary btn-sm ml-2 ${
              isActive('/login') || isActive('/admin') || isActive('/peserta/login')
                ? 'shadow-md'
                : ''
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Masuk / Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
