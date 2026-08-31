import { Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="hero-pattern" />
          <div className="container-wide text-center animate-fade-in relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary-bg)] border border-[rgba(79,70,229,0.15)] text-sm text-[var(--primary)] font-semibold mb-8">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              Pendaftaran Dibuka
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-[var(--text-primary)]">
              Raih Karir Impian
              <br />
              <span className="text-gradient">Bersama LPK</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Tingkatkan keterampilan Anda melalui program pelatihan kerja
              profesional. Siapkan diri untuk peluang karir yang lebih baik di
              dalam dan luar negeri.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pendaftaran" className="btn btn-primary btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Daftar Sekarang
              </Link>
              <Link href="/peserta/login" className="btn btn-outline btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Login Peserta
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container-wide">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
                Mengapa <span className="text-gradient">Memilih Kami</span>?
              </h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                LPK kami telah berpengalaman dalam mencetak tenaga kerja
                terampil dan siap bersaing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 12 3 12 0v-5" />
                    </svg>
                  ),
                  title: 'Instruktur Berpengalaman',
                  desc: 'Dibimbing langsung oleh tenaga pengajar profesional yang bersertifikasi nasional dan internasional.',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  ),
                  title: 'Fasilitas Modern',
                  desc: 'Dilengkapi peralatan dan fasilitas praktik modern sesuai standar industri terkini.',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10z" />
                    </svg>
                  ),
                  title: 'Peluang Karir Global',
                  desc: 'Sertifikat pelatihan diakui untuk kesempatan kerja di dalam negeri maupun luar negeri.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card p-8 animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-white"
                    style={{ background: 'var(--primary)' }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-20 bg-[var(--surface)]">
          <div className="container-wide">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
                Proses <span className="text-gradient-accent">Pendaftaran</span>
              </h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                Hanya 4 langkah mudah untuk mendaftar program pelatihan
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Data Diri', desc: 'Isi identitas pribadi seperti nama, NIK, dan alamat' },
                { step: '02', title: 'Data Fisik', desc: 'Masukkan tinggi badan, berat badan, dan golongan darah' },
                { step: '03', title: 'Kontak Darurat', desc: 'Lengkapi nomor HP, email, dan kontak darurat' },
                { step: '04', title: 'Pilih Pelatihan', desc: 'Pilih program pelatihan yang Anda minati' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card p-6 text-center relative overflow-hidden group"
                >
                  <div className="text-5xl font-black text-gradient opacity-20 mb-3 group-hover:opacity-40 transition-opacity">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container-narrow text-center">
            <div className="relative overflow-hidden rounded-3xl p-12 md:p-16" style={{ background: 'var(--primary)' }}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-1/3 translate-y-1/3" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Siap Memulai?
                </h2>
                <p className="text-white/80 mb-8 max-w-md mx-auto">
                  Jangan lewatkan kesempatan untuk meningkatkan keterampilan dan
                  membuka peluang karir yang lebih baik.
                </p>
                <Link
                  href="/pendaftaran"
                  className="btn btn-lg bg-white text-[var(--primary)] font-bold hover:bg-white/90 transition-all shadow-lg"
                >
                  Mulai Pendaftaran
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--card-border)] py-8 bg-white">
          <div className="container-wide text-center text-sm text-[var(--text-tertiary)]">
            © {new Date().getFullYear()} Lembaga Pelatihan Kerja. Seluruh hak dilindungi.
          </div>
        </footer>
      </main>
    </>
  );
}
