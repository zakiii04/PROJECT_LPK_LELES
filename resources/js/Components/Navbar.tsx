import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Navbar() {
  const { url } = usePage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => url === path;
  
  // Sembunyikan navigasi publik ketika berada di halaman Dashboard aktor manapun
  const isDashboard =
    url.startsWith('/admin') ||
    url.startsWith('/peserta') ||
    url.startsWith('/hrd') ||
    url.startsWith('/instruktur');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (url === '/') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.location.href = `/#${id}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#fbfbfb]/90 backdrop-blur-md transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
        {/* Brand Logo (Left) */}
        <Link href={isDashboard ? '#' : '/'} className="flex items-center gap-3 group no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#1a365d] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            {/* Minimalist Geometric Logo Mark */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <path d="M6 14v4a2 2 0 0 0 2 2h2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#1a365d] group-hover:text-[#2b6cb0] transition-colors">
              LPK LELES
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links (Center) */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            <button
              onClick={() => scrollToSection('program')}
              className="text-sm font-semibold text-neutral-600 hover:text-[#1a365d] transition-colors cursor-pointer"
            >
              Program Sepatu
            </button>
            <button
              onClick={() => scrollToSection('keunggulan')}
              className="text-sm font-semibold text-neutral-600 hover:text-[#1a365d] transition-colors cursor-pointer"
            >
              Keunggulan
            </button>
            <button
              onClick={() => scrollToSection('alur')}
              className="text-sm font-semibold text-neutral-600 hover:text-[#1a365d] transition-colors cursor-pointer"
            >
              Alur Pendaftaran
            </button>
            <button
              onClick={() => scrollToSection('mitra')}
              className="text-sm font-semibold text-neutral-600 hover:text-[#1a365d] transition-colors cursor-pointer"
            >
              Sertifikasi & Mitra
            </button>
            <Link
              href="/pendaftaran"
              className={`text-sm font-semibold transition-colors ${
                isActive('/pendaftaran') ? 'text-[#1a365d] font-bold' : 'text-neutral-600 hover:text-[#1a365d]'
              }`}
            >
              Pendaftaran
            </Link>
          </nav>
        )}

        {/* Right CTA / Action Button */}
        {!isDashboard && (
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1a365d] hover:bg-[#0f2442] text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              Login
            </Link>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        {!isDashboard && (
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full bg-neutral-950 text-white text-xs font-medium"
            >
              Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {!isDashboard && mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200/70 bg-[#fbfbfb] px-6 py-5 flex flex-col gap-4 animate-fade-in shadow-lg">
          <button
            onClick={() => scrollToSection('program')}
            className="text-left py-2 text-sm font-medium text-neutral-800 hover:text-black"
          >
            Program Pelatihan
          </button>
          <button
            onClick={() => scrollToSection('keunggulan')}
            className="text-left py-2 text-sm font-medium text-neutral-800 hover:text-black"
          >
            Keunggulan LPK
          </button>
          <button
            onClick={() => scrollToSection('alur')}
            className="text-left py-2 text-sm font-medium text-neutral-800 hover:text-black"
          >
            Alur Pendaftaran
          </button>
          <button
            onClick={() => scrollToSection('mitra')}
            className="text-left py-2 text-sm font-medium text-neutral-800 hover:text-black"
          >
            Sertifikasi & Mitra
          </button>
          <Link
            href="/pendaftaran"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 text-sm font-medium text-neutral-800 hover:text-black"
          >
            Formulir Pendaftaran
          </Link>
          <div className="pt-2 border-t border-neutral-200">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center block py-2.5 rounded-full bg-[#1a365d] text-white text-sm font-semibold"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
