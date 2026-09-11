import { useRef } from 'react';
import { Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ProgramItem {
  id: string;
  nama: string;
  deskripsi: string;
  durasi: string;
  harga: number;
  harga_formatted?: string;
  icon?: string;
}

interface HomeProps {
  programs?: ProgramItem[];
}

interface ParallaxItemProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

/**
 * Komponen ParallaxItem:
 * Saat halaman di-scroll ke bawah, elemen secara dinamis bergerak
 * naik ke atas dari +offset ke -offset secara berkesinambungan (scrub scroll).
 */
function ParallaxItem({ children, offset = 60, className = '' }: ParallaxItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Nilai y bergerak naik dari +offset (bawah) ke -offset (atas) saat scroll berlangsung
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div
      ref={ref}
      style={{ y, willChange: 'transform' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home({ programs = [] }: HomeProps) {
  // Global scroll progress untuk indikator garis atas
  const { scrollYProgress: pageScrollProgress } = useScroll();

  // Program spesifik menjahit sepatu
  const activePrograms = programs.length > 0 ? programs : [
    {
      id: 'PROG-MENJAHIT',
      nama: 'Menjahit Sepatu Industri (Shoe Upper Stitching)',
      deskripsi: 'Program pelatihan intensif menjahit bagian atas (upper) sepatu menggunakan mesin post-bed (cangklong) dan flatbed standar manufaktur alas kaki internasional.',
      durasi: '10 Hari',
      harga: 1700000,
      harga_formatted: 'Rp 1.700.000',
      icon: 'scissors',
    },
  ];

  // Ref & Scroll parallax untuk Hero Section
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Saat discroll ke bawah, teks Hero meluncur naik ke atas secara sangat nyata dan terpisah kecepatannya
  const heroH1Y = useTransform(heroScrollProgress, [0, 0.85], [0, -320]);
  const heroDescY = useTransform(heroScrollProgress, [0, 0.85], [0, -210]);
  const heroBtnY = useTransform(heroScrollProgress, [0, 0.85], [0, -130]);
  const heroBadgeY = useTransform(heroScrollProgress, [0, 0.85], [0, -80]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.75], [1, 0.05]);
  const heroScale = useTransform(heroScrollProgress, [0, 0.85], [1, 0.94]);
  const heroBgY = useTransform(heroScrollProgress, [0, 1], [0, 170]);
  const heroBgScale = useTransform(heroScrollProgress, [0, 1], [1, 1.15]);
  const heroIndicatorOpacity = useTransform(heroScrollProgress, [0, 0.18], [1, 0]);

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-neutral-900 flex flex-col selection:bg-[#1a365d] selection:text-white font-sans antialiased">
      {/* Top Scroll Indicator Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 z-[9999] origin-left pointer-events-none"
        style={{ scaleX: pageScrollProgress }}
      />

      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════════
            HERO SECTION (Floating Curved Card with Shoe Stitching Visual)
            ═══════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="px-3 sm:px-6 lg:px-10 pt-2 pb-10">
          <div className="max-w-[1440px] mx-auto">
            <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] lg:rounded-[42px] border border-blue-900/20 shadow-xl min-h-[620px] sm:min-h-[700px] lg:min-h-[780px] flex flex-col justify-between p-6 sm:p-12 lg:p-16">
              {/* Background Image with Smooth Scroll Parallax */}
              <motion.div
                className="absolute inset-0 bg-cover bg-center origin-center"
                style={{
                  backgroundImage: 'url(/images/hero-shoe.jpg)',
                  y: heroBgY,
                  scale: heroBgScale,
                }}
              />

              {/* Deep Navy & Royal Blue Atmospheric Overlay for contrast & elegance */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#07152b]/85 via-[#0f2442]/75 to-[#050c18]/90 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none"
                aria-hidden="true"
              />

              {/* Top Tag / Pill Indicator (Centered) */}
              <motion.div
                className="relative z-10 flex justify-center pt-2 sm:pt-4"
                style={{ y: heroBadgeY }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-xs sm:text-sm text-blue-200 font-medium backdrop-blur-md shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  Spesialis Pelatihan Menjahit Sepatu Industri
                </div>
              </motion.div>

              {/* Center Hero Content (Headline, Subheadline & CTA - Parallax Upwards on Scroll) */}
              <motion.div
                className="relative z-10 max-w-3xl mx-auto text-center py-6 sm:py-10"
                style={{ opacity: heroOpacity, scale: heroScale }}
              >
                <motion.h1
                  className="text-4xl sm:text-6xl lg:text-[72px] font-bold tracking-[-0.03em] leading-[1.08] mb-6 text-white"
                  style={{ y: heroH1Y }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                >
                  Keahlian Menjahit Sepatu,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-400 to-sky-200">
                    Masa Depan Industri Nyata
                  </span>
                </motion.h1>

                <motion.p
                  className="text-base sm:text-lg text-blue-100/90 font-normal leading-relaxed max-w-2xl mx-auto mb-10"
                  style={{ y: heroDescY }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  Lembaga Pelatihan Kerja terakreditasi resmi. Kuasai teknik jahit <span className="text-sky-300 font-medium">Upper Sepatu</span> dengan mesin post-bed & flatbed modern, sertifikasi kompetensi BNSP & Kemnaker, serta pendampingan kerja terpercaya.
                </motion.p>

                {/* Signature Pill Button (Centered, White & Blue) */}
                <motion.div
                  className="flex flex-wrap items-center justify-center gap-4"
                  style={{ y: heroBtnY }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <Link
                    href="/pendaftaran"
                    className="inline-flex items-center gap-4 bg-white hover:bg-blue-50 text-[#1a365d] pl-7 pr-2.5 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-blue-500/25 group w-fit cursor-pointer active:scale-95"
                  >
                    <span>Daftar Pelatihan Sekarang</span>
                    <span className="w-8 h-8 rounded-full bg-[#1a365d] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </Link>

                  <a
                    href="#program"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 hover:text-white text-sm font-medium border border-blue-400/30 transition-all backdrop-blur-md"
                  >
                    <span>Kurikulum Jahit Sepatu</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </a>
                </motion.div>
              </motion.div>

              {/* Bottom Scroll Indicator hint */}
              <motion.div
                style={{ opacity: heroIndicatorOpacity }}
                className="relative z-10 flex justify-center pb-1 pointer-events-none"
              >
                <div className="flex flex-col items-center gap-1.5 text-blue-200/80 text-xs">
                  <span className="tracking-widest uppercase text-[10px] font-semibold text-blue-300">Scroll ke bawah</span>
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            KEY METRICS / TRUST STRIP (Continuous Scroll Parallax)
            ═══════════════════════════════════════════════════════════ */}
        <section className="py-12 border-y border-neutral-200/60 bg-white overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center md:text-left">
              {[
                { val: '98%', label: 'Kelulusan Uji Kompetensi Sepatu', offset: 35 },
                { val: '1.200+', label: 'Alumni Bekerja di Industri Sepatu', offset: 55 },
                { val: 'Terakreditasi', label: 'Izin Resmi Kemnaker & Disnaker', offset: 75 },
                { val: '100% Praktik', label: 'Mesin Post-Bed & Standar Pabrik', offset: 95 },
              ].map((item, idx) => (
                <ParallaxItem
                  key={idx}
                  offset={item.offset}
                  className="border-l-0 md:border-l-2 md:border-[#2b6cb0]/40 md:pl-6"
                >
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a365d]">{item.val}</div>
                  <div className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">{item.label}</div>
                </ParallaxItem>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PROGRAM PELATIHAN KHUSUS SEPATU SECTION
            ═══════════════════════════════════════════════════════════ */}
        <section id="program" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-10 overflow-hidden">
          <div className="max-w-[1440px] mx-auto">
            <ParallaxItem
              offset={90}
              className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-4"
            >
              <div>
                <span className="text-xs font-bold tracking-widest text-[#2b6cb0] uppercase">Program Pelatihan Utama</span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a365d] mt-2">
                  Spesialisasi Menjahit Sepatu Industri
                </h2>
              </div>
              <p className="text-sm sm:text-base text-neutral-600 max-w-md">
                Kurikulum terarah yang didesain langsung sesuai standar kebutuhan pabrik manufaktur alas kaki nasional dan ekspor.
              </p>
            </ParallaxItem>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Card Utama: Menjahit Sepatu */}
              {activePrograms.map((prog, idx) => (
                <ParallaxItem
                  key={prog.id || idx}
                  offset={45}
                  className="group rounded-3xl bg-white border-2 border-blue-100 p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-blue-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2b6cb0] border border-blue-200">
                        {prog.durasi || '10 Hari Intensif'}
                      </span>
                      <span className="w-10 h-10 rounded-xl bg-[#1a365d] flex items-center justify-center text-white shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="20" y1="4" x2="8.12" y2="15.88" />
                          <line x1="14.47" y1="14.48" x2="20" y2="20" />
                          <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#1a365d] mb-3 group-hover:text-[#2b6cb0] transition-colors">
                      {prog.nama.includes('Sepatu') ? prog.nama : 'Menjahit Sepatu Industri'}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                      {prog.deskripsi}
                    </p>

                    <div className="space-y-2.5 py-4 border-t border-neutral-100 text-xs text-neutral-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Pengoperasian Mesin Jahit Post-Bed (Cangklong)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Teknik Jahit Upper Sepatu Kulit & Mesh Sport</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Standar Presisi QC Sepatu Ekspor & K3 Industri</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Sertifikat Resmi Kompetensi BNSP & Kemnaker</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-100 flex items-center justify-between relative z-10">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Biaya Pelatihan</div>
                      <div className="text-lg font-bold text-[#1a365d]">
                        {prog.harga_formatted || (prog.harga ? `Rp ${prog.harga.toLocaleString('id-ID')}` : 'Rp 1.700.000')}
                      </div>
                    </div>
                    <Link
                      href="/pendaftaran"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#1a365d] hover:bg-[#2b6cb0] text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      Daftar Kelas Ini
                    </Link>
                  </div>
                </ParallaxItem>
              ))}

              {/* Modul Spesifik: Skiving & Assembling Upper */}
              <ParallaxItem
                offset={80}
                className="rounded-3xl bg-white border border-neutral-200/80 p-7 flex flex-col justify-between hover:shadow-xl hover:border-blue-200 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Modul Keahlian
                    </span>
                    <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2b6cb0]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#1a365d] mb-3">
                    Skiving, Folding & Perakitan Upper
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                    Pelatihan teknik seset bahan (skiving machine), pengeleman komponen, pelipatan pinggiran (folding), dan perakitan lining sebelum proses jahit akhir.
                  </p>

                  <div className="space-y-2 py-4 border-t border-neutral-100 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Setting Ketebalan Mata Pisau Skiving</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Presisi Sambungan Pola Kulit & Sintetis</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Tercakup Dalam</div>
                    <div className="text-sm font-semibold text-[#1a365d]">Paket Pelatihan Inti</div>
                  </div>
                  <Link
                    href="/pendaftaran"
                    className="text-xs font-semibold text-[#2b6cb0] hover:underline"
                  >
                    Konsultasi Detail
                  </Link>
                </div>
              </ParallaxItem>

              {/* Modul Spesifik: Jahit Strobel & Bottoming Prep */}
              <ParallaxItem
                offset={115}
                className="rounded-3xl bg-white border border-neutral-200/80 p-7 flex flex-col justify-between hover:shadow-xl hover:border-blue-200 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      Modul Lanjutan
                    </span>
                    <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2b6cb0]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10z" />
                      </svg>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#1a365d] mb-3">
                    Jahit Strobel & QC Sepatu Siap Pakai
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                    Mempelajari mesin jahit strobel untuk menyatukan insole dan upper sepatu sneakers, serta standar inspeksi kerapian jahitan sebelum proses perakitan sol.
                  </p>

                  <div className="space-y-2 py-4 border-t border-neutral-100 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Jahit Insole Strobel Otomatis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Standar Cacat Jahitan (Defect Rate Control)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Tercakup Dalam</div>
                    <div className="text-sm font-semibold text-[#1a365d]">Paket Pelatihan Inti</div>
                  </div>
                  <Link
                    href="/pendaftaran"
                    className="text-xs font-semibold text-[#2b6cb0] hover:underline"
                  >
                    Konsultasi Detail
                  </Link>
                </div>
              </ParallaxItem>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            KEUNGGULAN SECTION (Footwear Stitching Focus)
            ═══════════════════════════════════════════════════════════ */}
        <section id="keunggulan" className="py-20 bg-white border-t border-neutral-200/60 px-4 sm:px-6 lg:px-10 overflow-hidden">
          <div className="max-w-[1440px] mx-auto">
            <ParallaxItem offset={85} className="max-w-xl mb-14">
              <span className="text-xs font-bold tracking-widest text-[#2b6cb0] uppercase">Mengapa LPK LELES?</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a365d] mt-2">
                Fasilitas & Pembinaan Standar Pabrik Sepatu
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
                Kami fokus mencetak operator jahit sepatu yang handal, disiplin, dan langsung siap ditempatkan di pabrik manufaktur alas kaki terkemuka.
              </p>
            </ParallaxItem>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: '01',
                  title: 'Mesin Post-Bed Lengkap',
                  desc: 'Praktik langsung menggunakan mesin jahit cangklong (post-bed) dan flatbed berstandar pabrik sepatu ekspor.',
                  offset: 40,
                },
                {
                  num: '02',
                  title: 'Instruktur Vokasi Sepatu',
                  desc: 'Dibimbing instruktur berpengalaman bertahun-tahun di lini produksi dan teknik penjahitan sepatu profesional.',
                  offset: 70,
                },
                {
                  num: '03',
                  title: 'Sertifikat BNSP & Kemnaker',
                  desc: 'Setiap lulusan diuji melalui uji kompetensi resmi dan memperoleh sertifikat yang diakui industri alas kaki nasional.',
                  offset: 100,
                },
                {
                  num: '04',
                  title: 'Skema Cicilan Fleksibel',
                  desc: 'Kemudahan pendaftaran dengan pembayaran bertahap dan pemantauan transaksi transparan melalui portal peserta.',
                  offset: 130,
                },
              ].map((item, idx) => (
                <ParallaxItem
                  key={idx}
                  offset={item.offset}
                  className="p-8 rounded-3xl bg-[#fbfbfb] border border-neutral-200/80 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-[#2b6cb0] mb-6 group-hover:text-[#1a365d] transition-colors">
                      {item.num}
                    </div>
                    <h3 className="text-lg font-bold text-[#1a365d] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </ParallaxItem>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            ALUR PENDAFTARAN (4 Steps Flow)
            ═══════════════════════════════════════════════════════════ */}
        <section id="alur" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-10 overflow-hidden">
          <div className="max-w-[1440px] mx-auto">
            <ParallaxItem offset={80} className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-widest text-[#2b6cb0] uppercase">Alur Cepat & Mudah</span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a365d] mt-2">
                4 Langkah Menjadi Penjahit Sepatu Terampil
              </h2>
            </ParallaxItem>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '1',
                  title: 'Isi Formulir Online',
                  desc: 'Lengkapi biodata diri dan ukuran fisik secara online melalui portal pendaftaran LPK LELES.',
                  offset: 40,
                },
                {
                  step: '2',
                  title: 'Konfirmasi Angkatan',
                  desc: 'Admin memverifikasi data dan menentukan jadwal kelas pelatihan menjahit sepatu yang tersedia.',
                  offset: 70,
                },
                {
                  step: '3',
                  title: 'Pembayaran / Cicilan',
                  desc: 'Pilih pembayaran transfer penuh atau skema cicilan resmi dengan upload bukti instan.',
                  offset: 100,
                },
                {
                  step: '4',
                  title: 'Pelatihan & Ujian',
                  desc: 'Ikuti pelatihan praktik menjahit sepatu, ujian teori/praktik, dan raih sertifikasi kompetensi.',
                  offset: 130,
                },
              ].map((st, i) => (
                <ParallaxItem
                  key={i}
                  offset={st.offset}
                  className="relative p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200/80 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="w-10 h-10 rounded-full bg-[#1a365d] text-white font-mono text-sm font-bold flex items-center justify-center mb-6">
                      {st.step}
                    </div>
                    <h3 className="text-lg font-bold text-[#1a365d] mb-2">
                      {st.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </ParallaxItem>
              ))}
            </div>

            <ParallaxItem offset={60} className="mt-12 text-center">
              <Link
                href="/pendaftaran"
                className="inline-flex items-center gap-3 bg-[#1a365d] hover:bg-[#0f2442] text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95"
              >
                <span>Mulai Pendaftaran Online Sekarang</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </ParallaxItem>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            MITRA & AKREDITASI SECTION
            ═══════════════════════════════════════════════════════════ */}
        <section id="mitra" className="py-20 bg-white border-t border-neutral-200/60 px-4 sm:px-6 lg:px-10 overflow-hidden">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <ParallaxItem offset={75}>
                <span className="text-xs font-bold tracking-widest text-[#2b6cb0] uppercase">Jejaring Industri Alas Kaki</span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1a365d] mt-2 mb-6">
                  Menjembatani Peserta dengan Pabrik Sepatu Terkemuka
                </h2>
                <p className="text-base text-neutral-600 leading-relaxed mb-6">
                  LPK LELES berlokasi strategis di kawasan industri Jawa Barat dan memiliki relasi erat dengan pabrik-pabrik manufaktur sepatu skala nasional dan penyuplai brand internasional.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-[#1a365d]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2b6cb0]" />
                    <span>Sertifikasi Standar BNSP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2b6cb0]" />
                    <span>Izin Operasional Kemnaker RI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2b6cb0]" />
                    <span>Penyaluran Kerja Pabrik Sepatu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2b6cb0]" />
                    <span>Bimbingan Tes Fisik & Wawancara</span>
                  </div>
                </div>
              </ParallaxItem>

              {/* Quote Card */}
              <ParallaxItem
                offset={115}
                className="p-8 sm:p-12 rounded-[32px] bg-[#f0f4f9] border border-blue-200/60"
              >
                <div className="text-xs font-mono uppercase tracking-widest text-[#2b6cb0] font-bold mb-6">Komitmen Vokasi</div>
                <blockquote className="text-lg sm:text-xl font-medium text-[#1a365d] leading-relaxed mb-8">
                  "Menjahit sepatu membutuhkan ketelitian tinggi, pemahaman pola melengkung, dan kecepatan mesin post-bed. LPK LELES memastikan setiap siswa lulus dengan keterampilan yang siap bersaing."
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold text-sm">
                    LPK
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1a365d]">Instruktur Pelatihan Sepatu</div>
                    <div className="text-xs text-neutral-500">Lembaga Pelatihan Kerja LELES</div>
                  </div>
                </div>
              </ParallaxItem>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CALL TO ACTION BANNER (Deep Navy & Blue Gradient Theme)
            ═══════════════════════════════════════════════════════════ */}
        <section className="px-3 sm:px-6 lg:px-10 py-16 overflow-hidden">
          <div className="max-w-[1440px] mx-auto">
            <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-[#1a365d] text-white p-10 sm:p-16 lg:p-20 text-center flex flex-col items-center justify-center shadow-2xl">
              <div className="max-w-2xl">
                <ParallaxItem offset={70}>
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
                    Siap Menjadi Operator Jahit Sepatu Profesional?
                  </h2>
                </ParallaxItem>
                <ParallaxItem offset={45}>
                  <p className="text-base sm:text-lg text-blue-100 font-normal leading-relaxed mb-10 max-w-xl mx-auto">
                    Pendaftaran angkatan baru telah dibuka dengan kuota terbatas untuk menjamin bimbingan intensif 1 mesin 1 peserta.
                  </p>
                </ParallaxItem>
                <ParallaxItem offset={25}>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                      href="/pendaftaran"
                      className="inline-flex items-center gap-3.5 bg-white text-[#1a365d] pl-7 pr-2.5 py-2.5 rounded-full font-bold text-sm sm:text-base hover:bg-blue-50 transition-all shadow-lg active:scale-95 group cursor-pointer"
                    >
                      <span>Daftar Sekarang</span>
                      <span className="w-8 h-8 rounded-full bg-[#1a365d] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </Link>

                    <Link
                      href="/login"
                      className="text-sm font-semibold text-blue-200 hover:text-white px-5 py-2.5 transition-colors"
                    >
                      Sudah Mendaftar? Masuk Portal Peserta →
                    </Link>
                  </div>
                </ParallaxItem>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER (Minimalist Clean)
          ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-neutral-200/70 bg-white py-12 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#1a365d] flex items-center justify-center text-white text-xs font-bold">
                L
              </div>
              <span className="text-sm font-bold tracking-tight text-[#1a365d]">
                LPK LELES INDONESIA
              </span>
            </div>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              Lembaga Pelatihan Kerja Vokasi Menjahit Sepatu Industri Terakreditasi Resmi. Membentuk tenaga kerja terampil, siap kerja, dan berdaya saing.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs font-semibold text-neutral-600">
            <Link href="/" className="hover:text-[#1a365d] transition-colors">Beranda</Link>
            <a href="#program" className="hover:text-[#1a365d] transition-colors">Program Sepatu</a>
            <a href="#keunggulan" className="hover:text-[#1a365d] transition-colors">Keunggulan</a>
            <a href="#alur" className="hover:text-[#1a365d] transition-colors">Alur</a>
            <Link href="/pendaftaran" className="hover:text-[#1a365d] transition-colors">Pendaftaran</Link>
            <Link href="/login" className="hover:text-[#1a365d] transition-colors">Login</Link>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            © {new Date().getFullYear()} LPK LELES. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}


