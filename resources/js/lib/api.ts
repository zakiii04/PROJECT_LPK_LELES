import apiClient from '@/lib/axios';
import type {
  ApiResponse, PaginatedData,
  LoginCredentials, LoginResponse, ChangePasswordPayload,
  User, CreateUserPayload,
  ProgramPelatihan, CreateProgramPayload, UpdateProgramPayload,
  Angkatan, CreateAngkatanPayload, UpdateAngkatanPayload, AngkatanStatus,
  Pendaftar, CreatePendaftarPayload, PendaftarStatus,
  PembayaranInfo, Cicilan, CreateCicilanPayload,
  Interview, CreateInterviewPayload,
  JadwalPelatihan, CreateJadwalPayload,
  Kehadiran, CreateKehadiranPayload, BulkKehadiranPayload, KehadiranRekap,
  SoalUjian, CreateSoalPayload, MulaiUjianParams, SubmitUjianPayload,
  HasilUjian, Kelulusan, CreateKelulusanPayload,
  DashboardSummary, StatItem, UploadResponse,
  PaymentMethod, CreatePaymentMethodPayload,
  TempatPelatihan,
} from '@/lib/types';

// Generic request handler — unwraps Laravel { success, data, message } envelope
async function request<T>(promise: Promise<any>): Promise<ApiResponse<T>> {
  try {
    const res = await promise;
    const responseBody = res.data;
    return {
      success: responseBody?.success ?? true,
      message: responseBody?.message,
      data: (responseBody?.data !== undefined ? responseBody.data : responseBody) as T,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err.response?.data?.message ||
        err.message ||
        'Gagal menghubungi server.',
    };
  }
}

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  login: (creds: LoginCredentials) =>
    request<LoginResponse>(apiClient.post('/auth/login', creds)),
  logout: () =>
    request<null>(apiClient.post('/auth/logout')),
  me: () =>
    request<User>(apiClient.get('/auth/me')),
  refresh: () =>
    request<{ token: string }>(apiClient.post('/auth/refresh')),
  changePassword: (p: ChangePasswordPayload) =>
    request<null>(apiClient.post('/auth/change-password', p)),
};

// ── Users (Admin only) ───────────────────────────────
export const usersApi = {
  list: (params?: { role?: string; search?: string; per_page?: number }) =>
    request<PaginatedData<User>>(apiClient.get('/users', { params })),
  show: (id: string) =>
    request<User>(apiClient.get(`/users/${id}`)),
  create: (p: CreateUserPayload) =>
    request<User>(apiClient.post('/users', p)),
  update: (id: string, p: Partial<CreateUserPayload>) =>
    request<User>(apiClient.put(`/users/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/users/${id}`)),
};

// ── Program Pelatihan ────────────────────────────────
export const programsApi = {
  list: () =>
    request<ProgramPelatihan[]>(apiClient.get('/programs')),
  show: (id: string) =>
    request<ProgramPelatihan>(apiClient.get(`/programs/${id}`)),
  create: (p: CreateProgramPayload) =>
    request<ProgramPelatihan>(apiClient.post('/programs', p)),
  update: (id: string, p: UpdateProgramPayload) =>
    request<ProgramPelatihan>(apiClient.put(`/programs/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/programs/${id}`)),
  getAngkatan: (programId: string) =>
    request<Angkatan[]>(apiClient.get(`/programs/${programId}/angkatan`)),
  getSoal: (programId: string) =>
    request<SoalUjian[]>(apiClient.get(`/programs/${programId}/soal`)),
};
export const programApi = programsApi;

// ── Angkatan ─────────────────────────────────────────
export const angkatanApi = {
  list: (params?: { status?: AngkatanStatus; program_id?: string; tahun?: number }) =>
    request<Angkatan[]>(apiClient.get('/angkatan', { params })),
  show: (id: string) =>
    request<Angkatan>(apiClient.get(`/angkatan/${id}`)),
  create: (p: CreateAngkatanPayload) =>
    request<Angkatan>(apiClient.post('/angkatan', p)),
  update: (id: string, p: UpdateAngkatanPayload) =>
    request<Angkatan>(apiClient.put(`/angkatan/${id}`, p)),
  updateStatus: (id: string, status: AngkatanStatus) =>
    request<Angkatan>(apiClient.patch(`/angkatan/${id}/status`, { status })),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/angkatan/${id}`)),
  getPendaftar: (angkatanId: string) =>
    request<Pendaftar[]>(apiClient.get(`/angkatan/${angkatanId}/pendaftar`)),
};

// ── Tempat Pelatihan ──────────────────────────────────
export const tempatApi = {
  list: () =>
    request<TempatPelatihan[]>(apiClient.get('/tempat')),
  show: (id: string) =>
    request<TempatPelatihan>(apiClient.get(`/tempat/${id}`)),
  create: (data: Partial<TempatPelatihan>) =>
    request<TempatPelatihan>(apiClient.post('/tempat', data)),
  update: (id: string, data: Partial<TempatPelatihan>) =>
    request<TempatPelatihan>(apiClient.put(`/tempat/${id}`, data)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/tempat/${id}`)),
};

// ── Pendaftar ────────────────────────────────────────
export const pendaftarApi = {
  list: (params?: {
    status?: PendaftarStatus;
    angkatan_id?: string;
    program_id?: string;
    status_pembayaran?: string;
    search?: string;
    per_page?: number;
  }) =>
    request<PaginatedData<Pendaftar>>(apiClient.get('/pendaftar', { params })),
  show: (id: string) =>
    request<Pendaftar>(apiClient.get(`/pendaftar/${id}`)),
  create: (p: CreatePendaftarPayload) =>
    request<Pendaftar>(apiClient.post('/pendaftar', p)),
  update: (id: string, p: Partial<CreatePendaftarPayload>) =>
    request<Pendaftar>(apiClient.put(`/pendaftar/${id}`, p)),
  updateStatus: (
    id: string,
    status: PendaftarStatus,
    verifikasiData?: {
      tinggi_badan?: string;
      berat_badan?: string;
      lingkar_pinggang?: string;
      berkas_verifikasi?: string[];
    }
  ) =>
    request<Pendaftar>(apiClient.patch(`/pendaftar/${id}/status`, { status, ...verifikasiData })),
  alokasiAngkatan: (id: string, angkatan_id: string) =>
    request<Pendaftar>(apiClient.patch(`/pendaftar/${id}/angkatan`, { angkatan_id })),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/pendaftar/${id}`)),
  me: () =>
    request<Pendaftar>(apiClient.get('/pendaftar/me')),
  meKehadiran: () =>
    request<Kehadiran[]>(apiClient.get('/pendaftar/me/kehadiran')),
  meJadwal: () =>
    request<JadwalPelatihan[]>(apiClient.get('/pendaftar/me/jadwal')),
  meUjian: () =>
    request<HasilUjian[]>(apiClient.get('/pendaftar/me/ujian')),
  meKelulusan: () =>
    request<Kelulusan>(apiClient.get('/pendaftar/me/kelulusan')),
  // Sub-resources
  getPembayaran: (id: string) =>
    request<PembayaranInfo>(apiClient.get(`/pendaftar/${id}/pembayaran`)),
  getCicilan: (id: string) =>
    request<Cicilan[]>(apiClient.get(`/pendaftar/${id}/cicilan`)),
  getInterview: (id: string) =>
    request<Interview>(apiClient.get(`/pendaftar/${id}/interview`)),
  getHasilUjian: (id: string) =>
    request<HasilUjian[]>(apiClient.get(`/pendaftar/${id}/hasil-ujian`)),
  getKehadiran: (id: string) =>
    request<{ data: Kehadiran[]; rekap: KehadiranRekap }>(
      apiClient.get(`/pendaftar/${id}/kehadiran`),
    ),
  getKelulusan: (id: string) =>
    request<Kelulusan>(apiClient.get(`/pendaftar/${id}/kelulusan`)),
};

// ── Pembayaran ───────────────────────────────────────
export const pembayaranApi = {
  uploadBukti: (pendaftarId: string, formData: FormData) =>
    request<Pendaftar>(
      apiClient.post(`/pendaftar/${pendaftarId}/pembayaran`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    ),
  verifikasi: (pendaftarId: string) =>
    request<null>(apiClient.patch(`/pendaftar/${pendaftarId}/pembayaran/verifikasi`)),
  tolak: (pendaftarId: string) =>
    request<null>(apiClient.patch(`/pendaftar/${pendaftarId}/pembayaran/tolak`)),
};

export const paymentMethodApi = {
  list: () =>
    request<PaymentMethod[]>(apiClient.get('/payment-methods')),
  create: (p: CreatePaymentMethodPayload) =>
    request<PaymentMethod>(apiClient.post('/payment-methods', p)),
  update: (id: string, p: Partial<CreatePaymentMethodPayload>) =>
    request<PaymentMethod>(apiClient.put(`/payment-methods/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/payment-methods/${id}`)),
};

// ── Cicilan ──────────────────────────────────────────
export const cicilanApi = {
  create: (pendaftarId: string, p: CreateCicilanPayload) =>
    request<Cicilan[]>(apiClient.post(`/pendaftar/${pendaftarId}/cicilan`, p)),
  uploadBukti: (cicilanId: string, formData: FormData) =>
    request<Cicilan>(
      apiClient.patch(`/cicilan/${cicilanId}/bayar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    ),
  verifikasi: (cicilanId: string) =>
    request<null>(apiClient.patch(`/cicilan/${cicilanId}/verifikasi`)),
  tolak: (cicilanId: string, catatan?: string) =>
    request<null>(apiClient.patch(`/cicilan/${cicilanId}/tolak`, { catatan })),
};

// ── Interview ────────────────────────────────────────
export const interviewApi = {
  list: () =>
    request<Interview[]>(apiClient.get('/interview')),
  show: (id: string) =>
    request<Interview>(apiClient.get(`/interview/${id}`)),
  create: (p: CreateInterviewPayload) =>
    request<Interview>(apiClient.post('/interview', p)),
  update: (id: string, p: Partial<CreateInterviewPayload>) =>
    request<Interview>(apiClient.put(`/interview/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/interview/${id}`)),
};

// ── Jadwal Pelatihan ─────────────────────────────────
export const jadwalApi = {
  list: (params?: { jenis_sesi?: string; jenis_pelatihan?: string; tanggal?: string; angkatan_id?: string; tempat_pelatihan?: string }) =>
    request<JadwalPelatihan[]>(apiClient.get('/jadwal', { params })),
  show: (id: string) =>
    request<JadwalPelatihan>(apiClient.get(`/jadwal/${id}`)),
  create: (p: CreateJadwalPayload) =>
    request<JadwalPelatihan>(apiClient.post('/jadwal', p)),
  update: (id: string, p: Partial<CreateJadwalPayload>) =>
    request<JadwalPelatihan>(apiClient.put(`/jadwal/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/jadwal/${id}`)),
  addPeserta: (jadwalId: string, pendaftar_ids: string[]) =>
    request<null>(apiClient.post(`/jadwal/${jadwalId}/peserta`, { pendaftar_ids })),
  removePeserta: (jadwalId: string, pendaftarId: string) =>
    request<null>(apiClient.delete(`/jadwal/${jadwalId}/peserta/${pendaftarId}`)),
};

// ── Kehadiran ────────────────────────────────────────
export const kehadiranApi = {
  list: (params?: { pendaftar_id?: string; tanggal?: string; angkatan_id?: string }) =>
    request<Kehadiran[]>(apiClient.get('/kehadiran', { params })),
  show: (id: string) =>
    request<Kehadiran>(apiClient.get(`/kehadiran/${id}`)),
  create: (p: CreateKehadiranPayload) =>
    request<Kehadiran>(apiClient.post('/kehadiran', p)),
  createBulk: (p: BulkKehadiranPayload) =>
    request<null>(apiClient.post('/kehadiran/bulk', p)),
  update: (id: string, p: { status_kehadiran: string; catatan?: string }) =>
    request<Kehadiran>(apiClient.put(`/kehadiran/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/kehadiran/${id}`)),
};

// ── Soal Ujian ───────────────────────────────────────
export const soalApi = {
  list: (params?: { tipe?: string; program_id?: string }) =>
    request<SoalUjian[]>(apiClient.get('/soal', { params })),
  show: (id: string) =>
    request<SoalUjian>(apiClient.get(`/soal/${id}`)),
  random: (params: { tipe: string; program_id: string; jumlah?: number }) =>
    request<SoalUjian[]>(apiClient.get('/soal/random', { params })),
  create: (p: CreateSoalPayload) => {
    if (p.gambar_soal instanceof File) {
      const fd = new FormData();
      fd.append('jenis_pelatihan', p.jenis_pelatihan);
      fd.append('tipe', p.tipe);
      fd.append('pertanyaan', p.pertanyaan);
      p.opsi.forEach((o) => fd.append('opsi[]', o));
      fd.append('jawaban_benar', String(p.jawaban_benar));
      if (p.program_id) fd.append('program_id', p.program_id);
      fd.append('gambar_soal', p.gambar_soal);
      return request<SoalUjian>(
        apiClient.post('/soal', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      );
    }
    return request<SoalUjian>(apiClient.post('/soal', p));
  },
  update: (id: string, p: Partial<CreateSoalPayload>) => {
    if (p.gambar_soal instanceof File) {
      const fd = new FormData();
      if (p.jenis_pelatihan) fd.append('jenis_pelatihan', p.jenis_pelatihan);
      if (p.tipe) fd.append('tipe', p.tipe);
      if (p.pertanyaan) fd.append('pertanyaan', p.pertanyaan);
      if (p.opsi) p.opsi.forEach((o) => fd.append('opsi[]', o));
      if (p.jawaban_benar !== undefined) fd.append('jawaban_benar', String(p.jawaban_benar));
      if (p.program_id) fd.append('program_id', p.program_id);
      fd.append('gambar_soal', p.gambar_soal);
      fd.append('_method', 'PUT');
      return request<SoalUjian>(
        apiClient.post(`/soal/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      );
    }
    return request<SoalUjian>(apiClient.put(`/soal/${id}`, p));
  },
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/soal/${id}`)),
};

// ── Ujian (Peserta) ──────────────────────────────────
export const ujianApi = {
  mulai: (params: MulaiUjianParams) =>
    request<SoalUjian[]>(apiClient.get('/ujian/mulai', { params })),
  submit: (p: SubmitUjianPayload) =>
    request<HasilUjian>(apiClient.post('/ujian/submit', p)),
};

// ── Hasil Ujian ──────────────────────────────────────
export const hasilUjianApi = {
  list: () =>
    request<HasilUjian[]>(apiClient.get('/hasil-ujian')),
  show: (id: string) =>
    request<HasilUjian>(apiClient.get(`/hasil-ujian/${id}`)),
};

// ── Kelulusan ────────────────────────────────────────
export const kelulusanApi = {
  list: () =>
    request<Kelulusan[]>(apiClient.get('/kelulusan')),
  show: (id: string) =>
    request<Kelulusan>(apiClient.get(`/kelulusan/${id}`)),
  create: (p: CreateKelulusanPayload) =>
    request<Kelulusan>(apiClient.post('/kelulusan', p)),
  update: (id: string, p: Partial<CreateKelulusanPayload>) =>
    request<Kelulusan>(apiClient.put(`/kelulusan/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/kelulusan/${id}`)),
};

// ── Sertifikat ───────────────────────────────────────
export const sertifikatApi = {
  verify: (no: string) =>
    request<Kelulusan>(apiClient.get(`/sertifikat/${encodeURIComponent(no)}`)),
  download: (no: string) =>
    request<Kelulusan>(
      apiClient.get(`/sertifikat/${encodeURIComponent(no)}/download`),
    ),
};

// ── Dashboard ────────────────────────────────────────
export const dashboardApi = {
  summary: () =>
    request<DashboardSummary>(apiClient.get('/dashboard/summary')),
  pendaftarPerBulan: () =>
    request<StatItem[]>(apiClient.get('/dashboard/pendaftar-per-bulan')),
  kelulusanStats: () =>
    request<StatItem[]>(apiClient.get('/dashboard/kelulusan-stats')),
  pembayaranStats: () =>
    request<StatItem[]>(apiClient.get('/dashboard/pembayaran-stats')),
  kehadiranStats: () =>
    request<StatItem[]>(apiClient.get('/dashboard/kehadiran-stats')),
};

// ── Upload ───────────────────────────────────────────
export const uploadApi = {
  buktiPembayaran: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<UploadResponse>(
      apiClient.post('/upload/bukti-pembayaran', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  fotoProfil: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<UploadResponse>(
      apiClient.post('/upload/foto-profil', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  dokumen: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<UploadResponse>(
      apiClient.post('/upload/dokumen', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
};

// ── Mata Pelajaran ──────────────────────────────────
import type { MataPelajaran, CreateMataPelajaranPayload, Nilai, CreateNilaiPayload, AbsensiData } from './types';

export const mataPelajaranApi = {
  list: (params?: { program_id?: string }) =>
    request<MataPelajaran[]>(apiClient.get('/mata-pelajaran', { params })),
  create: (p: CreateMataPelajaranPayload) =>
    request<MataPelajaran>(apiClient.post('/mata-pelajaran', p)),
  update: (id: string, p: Partial<CreateMataPelajaranPayload>) =>
    request<MataPelajaran>(apiClient.put(`/mata-pelajaran/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/mata-pelajaran/${id}`)),
};

// ── Nilai ───────────────────────────────────────────
export const nilaiApi = {
  list: (params?: { pendaftar_id?: string; mata_pelajaran_id?: string; tipe_nilai?: string }) =>
    request<Nilai[]>(apiClient.get('/nilai', { params })),
  create: (p: CreateNilaiPayload) =>
    request<Nilai>(apiClient.post('/nilai', p)),
  update: (id: string, p: { nilai: number; catatan?: string; tanggal?: string }) =>
    request<Nilai>(apiClient.put(`/nilai/${id}`, p)),
  destroy: (id: string) =>
    request<null>(apiClient.delete(`/nilai/${id}`)),
  bulk: (data: Array<CreateNilaiPayload & { mata_pelajaran_id?: string }>) =>
    request<{ message: string }>(apiClient.post('/nilai/bulk', { data })),
};

// ── Absensi ─────────────────────────────────────────
export const absensiApi = {
  get: (params: { angkatan_id?: string; program_id?: string }) =>
    request<AbsensiData>(apiClient.get('/absensi', { params })),
};

