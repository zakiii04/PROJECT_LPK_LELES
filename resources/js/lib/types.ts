// ============================================================
// Centralized TypeScript types — matches Laravel API responses
// ============================================================

// --- Generic API Wrappers ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

// --- Auth ---

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChangePasswordPayload {
  password_lama: string;
  password_baru: string;
  password_baru_confirmation: string;
}

// --- User ---

export type UserRole = 'ADMIN' | 'HRD' | 'INSTRUKTUR' | 'PESERTA';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  pendaftar?: Pendaftar;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

// --- Program Pelatihan ---

export interface ProgramPelatihan {
  id: string;
  nama: string;
  deskripsi: string;
  durasi: string;
  harga: number;
  harga_formatted: string;
  icon: string | null;
  created_at?: string;
  updated_at?: string;
  angkatan_count?: number;
}

export type Program = ProgramPelatihan;

export interface CreateProgramPayload {
  id: string;
  nama: string;
  deskripsi: string;
  durasi: string;
  harga: number;
  harga_formatted: string;
  icon?: string;
}

export type UpdateProgramPayload = Partial<Omit<CreateProgramPayload, 'id'>>;

// --- Angkatan ---

export type AngkatanStatus = 'Pendaftaran' | 'On_Going' | 'Selesai' | 'Mendatang';

export interface Angkatan {
  id: string;
  kode_angkatan: string;
  nama_angkatan: string;
  tahun: number;
  periode: string;
  tgl_mulai_pendaftaran: string | null;
  tgl_selesai_pendaftaran: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kuota: number;
  instruktur_nama: string;
  status: AngkatanStatus;
  program_id: string;
  created_at?: string;
  updated_at?: string;
  program?: ProgramPelatihan;
  pendaftar?: Pendaftar[];
  pendaftar_count?: number;
}

export interface CreateAngkatanPayload {
  kode_angkatan: string;
  nama_angkatan: string;
  tahun: number;
  periode: string;
  tgl_mulai_pendaftaran?: string;
  tgl_selesai_pendaftaran?: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kuota?: number;
  instruktur_nama: string;
  status?: AngkatanStatus;
  program_id: string;
}

export type UpdateAngkatanPayload = Partial<CreateAngkatanPayload>;

// --- Pendaftar ---

export type PendaftarStatus = 'menunggu' | 'diterima' | 'ditolak';
export type StatusPembayaran = 'belum_bayar' | 'menunggu_konfirmasi' | 'lunas' | 'cicilan_sebagian';

export interface Pendaftar {
  id: string;
  no_pendaftaran: string;
  tanggal_daftar: string;
  status: PendaftarStatus;
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  tinggi_badan: string;
  berat_badan: string;
  lingkar_pinggang: string;
  riwayat_penyakit: string | null;
  berkas_verifikasi?: string[] | null;
  no_hp: string;
  email: string;
  jenis_pelatihan: string;
  program_id: string | null;
  tempat_pelatihan?: string | null;
  motivasi: string;
  angkatan_id: string | null;
  user_id: string | null;
  biaya_pelatihan: number;
  status_pembayaran: StatusPembayaran | null;
  jenis_pembayaran: 'lunas' | 'cicilan' | null;
  metode_pembayaran: string | null;
  bukti_pembayaran: string | null;
  tanggal_bayar: string | null;
  program?: ProgramPelatihan;
  angkatan?: Angkatan;
  user?: User;
  interview?: Interview;
  cicilan?: Cicilan[];
  kelulusan?: Kelulusan;
}

export interface CreatePendaftarPayload {
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  tinggi_badan: string;
  berat_badan: string;
  lingkar_pinggang: string;
  riwayat_penyakit?: string;
  no_hp: string;
  email: string;
  jenis_pelatihan: string;
  program_id?: string;
  motivasi: string;
  biaya_pelatihan?: number;
}

// --- Cicilan ---

export type CicilanStatus = 'belum_bayar' | 'menunggu_konfirmasi' | 'lunas' | 'ditolak';

export interface Cicilan {
  id: string;
  termin: number;
  jumlah: number;
  jatuh_tempo: string;
  status: CicilanStatus;
  metode_pembayaran: string | null;
  bukti_pembayaran: string | null;
  tanggal_bayar: string | null;
  tanggal_verifikasi: string | null;
  catatan_admin: string | null;
  pendaftar_id: string;
}

export interface CreateCicilanPayload {
  jumlah_per_termin: number;
  jumlah_termin: 2 | 3;
}

// --- Payment Methods ---

export type PaymentMethodType = 'bank' | 'ewallet' | 'qris' | 'lainnya';

export interface PaymentMethod {
  id: string;
  nama_metode: string;
  rekening?: string | null;
  deskripsi?: string | null;
  jenis: PaymentMethodType;
  is_active: boolean;
  urutan: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentMethodPayload {
  nama_metode: string;
  rekening?: string;
  deskripsi?: string;
  jenis: PaymentMethodType;
  is_active?: boolean;
  urutan?: number;
}

// --- Interview ---

export type InterviewStatus = 'Lulus' | 'Pertimbangan' | 'Tidak Lulus';

export interface Interview {
  id: string;
  tanggal_interview: string;
  pewawancara: string;
  skor_komunikasi: number;
  skor_sikap: number;
  skor_kesiapan: number;
  skor_total: number;
  catatan: string | null;
  status: InterviewStatus;
  pendaftar_id: string;
  pendaftar?: Pendaftar;
}

export interface CreateInterviewPayload {
  pendaftar_id: string;
  tanggal_interview: string;
  pewawancara: string;
  skor_komunikasi: number;
  skor_sikap: number;
  skor_kesiapan: number;
  catatan?: string;
  status: InterviewStatus;
}

// --- Jadwal Pelatihan ---

export type JenisSesi = 'Orientasi' | 'Teori' | 'Praktik' | 'Ujian';

export interface JadwalPelatihan {
  id: string;
  judul: string;
  jenis_pelatihan: string;
  angkatan_id?: string | null;
  hari_ke?: number | null;
  tanggal: string;
  jam: string;
  ruangan: string;
  tempat_pelatihan?: string | null;
  pengajar?: string | null;
  jenis_sesi: JenisSesi;
  status: string | null;
  created_at?: string;
  updated_at?: string;
  peserta?: Pendaftar[];
  peserta_count?: number;
}

export interface CreateJadwalPayload {
  judul: string;
  jenis_pelatihan: string;
  angkatan_id?: string;
  hari_ke?: number;
  tanggal: string;
  jam: string;
  ruangan: string;
  tempat_pelatihan?: string;
  pengajar?: string;
  jenis_sesi: JenisSesi;
  status?: string;
}

// --- Kehadiran ---

export type StatusKehadiran = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface Kehadiran {
  id: string;
  tanggal: string;
  status_kehadiran: StatusKehadiran;
  catatan: string | null;
  pendaftar_id: string;
  pendaftar?: Pendaftar;
}

export interface CreateKehadiranPayload {
  pendaftar_id: string;
  tanggal: string;
  status_kehadiran: StatusKehadiran;
  catatan?: string;
}

export interface BulkKehadiranPayload {
  tanggal: string;
  data: {
    pendaftar_id: string;
    status_kehadiran: StatusKehadiran;
    catatan?: string;
  }[];
}

export interface KehadiranRekap {
  total: number;
  hadir: number;
  persentase: number;
}

// --- Soal Ujian ---

export type TipeUjian = 'pretest' | 'posttest';

export interface SoalUjian {
  id: string;
  jenis_pelatihan: string;
  tipe: TipeUjian;
  pertanyaan: string;
  opsi: string[];
  jawaban_benar: number;
  program_id: string | null;
  gambar_soal?: string | null;
}

export interface CreateSoalPayload {
  jenis_pelatihan: string;
  tipe: TipeUjian;
  pertanyaan: string;
  opsi: string[];
  jawaban_benar: number;
  program_id?: string;
  gambar_soal?: File | string | null;
}

// --- Hasil Ujian ---

export interface HasilUjian {
  id: string;
  tipe: TipeUjian;
  nilai: number;
  benar: number;
  salah: number;
  total_soal: number;
  tanggal: string;
  pendaftar_id: string;
  pendaftar?: Pendaftar;
}

export interface MulaiUjianParams {
  tipe: TipeUjian;
  program_id: string;
  jumlah?: number;
}

export interface SubmitUjianPayload {
  tipe: TipeUjian;
  program_id: string;
  jawaban: { soal_id: string; jawaban: number }[];
  pendaftar_id?: string;
}

// --- Kelulusan ---

export type StatusKelulusan = 'Lulus' | 'Tidak_Lulus' | 'Dalam_Proses';

export interface Kelulusan {
  id: string;
  nilai_pretest: number;
  nilai_posttest: number;
  nilai_kehadiran: number;
  nilai_tugas: number;
  nilai_akhir: number;
  status_kelulusan: StatusKelulusan;
  tanggal_lulus: string;
  no_sertifikat: string;
  pendaftar_id: string;
  created_at?: string;
  updated_at?: string;
  pendaftar?: Pendaftar;
}

export interface CreateKelulusanPayload {
  pendaftar_id: string;
  nilai_pretest: number;
  nilai_posttest: number;
  nilai_kehadiran: number;
  nilai_tugas: number;
  nilai_akhir: number;
  status_kelulusan: StatusKelulusan;
  tanggal_lulus: string;
}

// --- Dashboard ---

export interface DashboardSummary {
  total_pendaftar: number;
  total_diterima: number;
  total_menunggu: number;
  total_ditolak: number;
  total_angkatan_aktif: number;
  total_program: number;
  peserta_lunas: number;
  peserta_cicilan: number;
  peserta_belum_bayar: number;
  total_kelulusan_lulus: number;
}

export interface StatItem {
  [key: string]: string | number;
  total: number;
}

// --- Upload ---

export interface UploadResponse {
  path: string;
  url: string;
}

// --- Pembayaran ---

export interface PembayaranInfo {
  status_pembayaran: StatusPembayaran | null;
  jenis_pembayaran: 'lunas' | 'cicilan' | null;
  biaya_pelatihan: number;
  bukti_pembayaran: string | null;
  tanggal_bayar: string | null;
  cicilan: Cicilan[];
}

// --- Form Helper ---

export interface PendaftarFormData {
  nama_lengkap: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat_lengkap: string;
  provinsi?: string;
  kabupaten_kota?: string;
  kecamatan?: string;
  desa_kelurahan?: string;
  rt?: string;
  rw?: string;
  tinggi_badan: string;
  berat_badan: string;
  lingkar_pinggang: string;
  riwayat_penyakit?: string;
  no_hp: string;
  email: string;
  jenis_pelatihan: string;
  program_id?: string;
  tempat_pelatihan?: string;
  motivasi: string;
  username?: string;
  password?: string;
}

export interface TempatPelatihan {
  id: string;
  nama_tempat: string;
  alamat_lengkap: string;
  kapasitas: number;
  fasilitas: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface CreateTempatPayload {
  nama_tempat: string;
  alamat_lengkap: string;
  kapasitas: number;
  fasilitas: string;
  status?: 'Aktif' | 'Nonaktif';
}

// --- Mata Pelajaran ---

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  program_id?: string | null;
  urutan: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMataPelajaranPayload {
  kode: string;
  nama: string;
  deskripsi?: string;
  program_id?: string;
  urutan?: number;
}

// --- Nilai ---

export type TipeNilai = 'mata_pelajaran' | 'pretest' | 'posttest' | 'kehadiran';

export interface Nilai {
  id: string;
  pendaftar_id: string;
  mata_pelajaran_id?: string | null;
  tipe_nilai: TipeNilai;
  nilai: number;
  catatan?: string | null;
  tanggal?: string | null;
  created_at?: string;
  updated_at?: string;
  mata_pelajaran?: MataPelajaran;
}

export interface CreateNilaiPayload {
  pendaftar_id: string;
  mata_pelajaran_id?: string;
  tipe_nilai: TipeNilai;
  nilai: number;
  catatan?: string;
  tanggal?: string;
}

// --- Absensi (data for printable attendance sheet) ---

export interface AbsensiKehadiran {
  total: number;
  hadir: number;
  persen: number;
}

export interface AbsensiData {
  peserta: Pendaftar[];
  nilai: Nilai[];
  hasil_posttest: Record<string, HasilUjian>;
  hasil_pretest: Record<string, HasilUjian>;
  kehadiran: Record<string, AbsensiKehadiran>;
}

