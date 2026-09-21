<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class PendaftarController extends Controller
{
    public function index(Request $request)
    {
        $query = Pendaftar::with(['program', 'angkatan', 'user', 'tagihan.pembayarans.paymentMethod']);
        if ($request->status)            $query->where('status', $request->status);
        if ($request->status_validasi)   $query->where('status_validasi', $request->status_validasi);
        if ($request->status_verifikasi) $query->where('status_verifikasi', $request->status_verifikasi);
        if ($request->tahap) {
            if ($request->tahap === 'validasi') {
                $query->where('status_validasi', 'menunggu');
            } elseif ($request->tahap === 'verifikasi') {
                $query->where('status_validasi', 'diterima')->whereIn('status_verifikasi', ['menunggu', 'belum_proses']);
            } elseif ($request->tahap === 'selesai') {
                $query->where('status', 'diterima');
            }
        }
        if ($request->angkatan_id)       $query->where('angkatan_id', $request->angkatan_id);
        if ($request->program_id)        $query->where('program_id', $request->program_id);
        if ($request->status_pembayaran) $query->where('status_pembayaran', $request->status_pembayaran);
        if ($request->search) {
            $q = $request->search;
            $query->where(function ($sq) use ($q) {
                $sq->where('nama_lengkap', 'like', "%$q%")
                    ->orWhere('nik', 'like', "%$q%")
                    ->orWhere('no_pendaftaran', 'like', "%$q%");
            });
        }
        $perPage = $request->per_page ?? 15;
        return response()->json(['success' => true, 'data' => $query->orderByDesc('tanggal_daftar')->paginate($perPage)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap'            => 'required|string',
            'nik'                     => 'required|string|size:16|unique:pendaftars,nik',
            'tempat_lahir'            => 'required|string',
            'tanggal_lahir'           => 'required|date',
            'jenis_kelamin'           => 'required|in:Perempuan,Laki-laki',
            'alamat'                  => 'required|string',
            'provinsi'                => 'nullable|string|max:255',
            'kabupaten_kota'          => 'nullable|string|max:255',
            'kecamatan'               => 'nullable|string|max:255',
            'desa_kelurahan'          => 'nullable|string|max:255',
            'tinggi_badan'            => 'required|numeric|min:100|max:250',
            'berat_badan'             => 'required|numeric|min:30|max:200',
            'lingkar_pinggang'        => 'required|string',
            'riwayat_penyakit'        => 'nullable|string',
            'no_hp'                   => 'required|string',
            'email'                   => 'required|email',
            'jenjang_pendidikan'      => 'nullable|string|max:100',
            'asal_sekolah'            => 'nullable|string|max:255',
            'tahun_lulus'             => 'nullable|integer|min:1900|max:' . (now()->year + 1),
            'jenis_pelatihan'         => 'required|string',
            'program_id'              => 'nullable|exists:program_pelatihans,id',
            'tempat_pelatihan'        => 'nullable|string|max:255',
            'motivasi'                => 'required|string',
            'biaya_pelatihan'         => 'sometimes|numeric',
        ]);

        $this->validateParticipantRequirements(
            $validated['tanggal_lahir'],
            $validated['tinggi_badan'],
            $validated['berat_badan']
        );

        $count  = Pendaftar::count() + 1;
        $year   = date('Y');
        $validated['id']              = Str::uuid()->toString();
        $validated['no_pendaftaran']  = 'LPK-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
        if (empty($validated['biaya_pelatihan']) || $validated['biaya_pelatihan'] == 0) {
            $prog = !empty($validated['program_id'])
                ? \App\Models\ProgramPelatihan::find($validated['program_id'])
                : \App\Models\ProgramPelatihan::where('nama', $validated['jenis_pelatihan'])->first();

            if ($prog) {
                $validated['program_id'] = $prog->id;
                $validated['biaya_pelatihan'] = $prog->harga;
            }
        }
        $validated['tanggal_daftar']  = now();
        // Alur 2 tahap: pendaftar baru selalu masuk tahap validasi dulu.
        $validated['status']            = 'menunggu';
        $validated['status_validasi']   = 'menunggu';
        $validated['status_verifikasi'] = 'belum_proses';

        // Angkatan dipilih saat admin menerima peserta, bukan ketika formulir dikirim.

        if (empty($validated['user_id'])) {
            $user = \App\Models\User::where('email', $validated['email'])->first();
            if (!$user) {
                $emailPrefix = explode('@', $validated['email'])[0] ?? ('peserta_' . Str::random(5));
                $baseUsername = Str::slug($emailPrefix, '_');
                if (empty($baseUsername)) {
                    $baseUsername = 'peserta_' . Str::random(5);
                }
                $uniqueUsername = $baseUsername;
                $counter = 1;
                while (\App\Models\User::where('username', $uniqueUsername)->exists()) {
                    $uniqueUsername = $baseUsername . '_' . $counter++;
                }

                $user = \App\Models\User::create([
                    'id'       => Str::uuid()->toString(),
                    'username' => $uniqueUsername,
                    'email'    => $validated['email'],
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    'role'     => 'PESERTA',
                ]);
            }
            $validated['user_id'] = $user->id;
        }

        $pendaftar = Pendaftar::create($validated);
        return response()->json([
            'success'          => true,
            'message'          => 'Pendaftaran berhasil dikirim. Akun login peserta otomatis diaktifkan.',
            'default_password' => 'password',
            'data'             => $pendaftar->load(['angkatan', 'user']),
        ], 201);
    }

    public function show(string $id)
    {
        $p = Pendaftar::with(['program', 'angkatan', 'user', 'interview', 'tagihan.pembayarans.paymentMethod', 'kelulusan'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $p]);
    }

    public function update(Request $request, string $id)
    {
        $pendaftar = Pendaftar::findOrFail($id);
        $oldAngkatanId = $pendaftar->angkatan_id;
        $oldStatus = $pendaftar->status;
        $pendaftar->update($request->except(['id', 'no_pendaftaran']));

        if ($pendaftar->status !== 'diterima') {
            $pendaftar->jadwal()->detach();
        } else if ($pendaftar->angkatan_id !== $oldAngkatanId || $oldStatus !== 'diterima') {
            $nonMatchingJadwals = $pendaftar->jadwal()
                ->where('angkatan_id', '!=', $pendaftar->angkatan_id)
                ->pluck('jadwal_pelatihans.id');
            if ($nonMatchingJadwals->count() > 0) {
                $pendaftar->jadwal()->detach($nonMatchingJadwals);
            }
            if (!empty($pendaftar->angkatan_id)) {
                $query = \App\Models\JadwalPelatihan::where('angkatan_id', $pendaftar->angkatan_id);
                if (!empty($pendaftar->tempat_pelatihan)) {
                    $tpName = explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan;
                    $query->where('tempat_pelatihan', 'like', '%' . trim($tpName) . '%');
                }
                $matchingJadwalIds = $query->pluck('id');
                if ($matchingJadwalIds->count() > 0) {
                    $pendaftar->jadwal()->syncWithoutDetaching($matchingJadwalIds);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pendaftar diupdate.',
            'data'    => $pendaftar->load(['program', 'angkatan', 'user']),
        ]);
    }

    public function destroy(string $id)
    {
        Pendaftar::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Pendaftar berhasil dihapus.']);
    }

    /**
     * TAHAP 1 — VALIDASI AWAL.
     * Filter pendaftar baru: khusus perempuan & memastikan data bukan asal isi.
     * Diterima -> lanjut ke tahap verifikasi. Ditolak -> status akhir ditolak.
     */
    public function validasi(Request $request, string $id)
    {
        $request->validate([
            'status'           => 'required|in:diterima,ditolak',
            'catatan_validasi' => 'nullable|string|max:1000',
            'jenis_kelamin'    => 'nullable|in:Perempuan,Laki-laki',
        ]);

        $pendaftar = Pendaftar::findOrFail($id);
        $updateData = [
            'tanggal_validasi' => now(),
        ];
        if ($request->filled('jenis_kelamin')) {
            $updateData['jenis_kelamin'] = $request->jenis_kelamin;
        }
        if ($request->has('catatan_validasi')) {
            $updateData['catatan_validasi'] = $request->catatan_validasi;
        }

        if ($request->status === 'diterima') {
            $updateData['status_validasi'] = 'diterima';
            // Masuk antrian verifikasi, status keseluruhan tetap menunggu.
            if (in_array($pendaftar->status_verifikasi, ['belum_proses', 'ditolak'], true)) {
                $updateData['status_verifikasi'] = 'menunggu';
            }
            $updateData['status'] = 'menunggu';
            $message = 'Validasi awal diterima. Pendaftar masuk ke tahap verifikasi.';
        } else {
            if (empty($updateData['catatan_validasi'] ?? $pendaftar->catatan_validasi)) {
                throw ValidationException::withMessages([
                    'catatan_validasi' => 'Alasan penolakan wajib diisi pada tahap validasi.',
                ]);
            }
            $updateData['status_validasi'] = 'ditolak';
            $updateData['status_verifikasi'] = 'belum_proses';
            $updateData['status'] = 'ditolak';
            $message = 'Pendaftar ditolak pada tahap validasi awal.';
        }

        $pendaftar->update($updateData);
        $pendaftar->jadwal()->detach();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $pendaftar->load(['program', 'angkatan', 'user']),
        ]);
    }

    /**
     * TAHAP 2 — VERIFIKASI BERKAS & FISIK (seperti alur lama).
     * Hanya bisa diproses bila sudah lolos validasi.
     * Diterima -> wajib ada angkatan, masuk jadwal, status akhir diterima.
     */
    public function verifikasi(Request $request, string $id)
    {
        $request->validate([
            'status'             => 'required|in:diterima,ditolak',
            'tinggi_badan'       => 'nullable|numeric|min:100|max:250',
            'berat_badan'        => 'nullable|numeric|min:30|max:200',
            'lingkar_pinggang'   => 'nullable|string',
            'berkas_verifikasi'  => 'nullable|array',
            'angkatan_id'        => 'nullable|string|exists:angkatans,id',
            'tempat_pelatihan'   => 'nullable|string',
            'catatan_verifikasi' => 'nullable|string|max:1000',
        ]);

        $pendaftar = Pendaftar::findOrFail($id);

        if ($pendaftar->status_validasi !== 'diterima') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftar harus lolos tahap validasi terlebih dahulu sebelum diverifikasi.',
            ], 422);
        }

        if ($request->status === 'diterima' && empty($request->angkatan_id) && empty($pendaftar->angkatan_id)) {
            throw ValidationException::withMessages([
                'angkatan_id' => 'Angkatan wajib dipilih saat menerima peserta pada tahap verifikasi.',
            ]);
        }

        $tinggiBadan = $request->input('tinggi_badan', $pendaftar->tinggi_badan);
        $beratBadan = $request->input('berat_badan', $pendaftar->berat_badan);

        if ($request->status === 'diterima') {
            $this->validateParticipantRequirements($pendaftar->tanggal_lahir, $tinggiBadan, $beratBadan);
        } else {
            if (!$request->filled('catatan_verifikasi') && empty($pendaftar->catatan_verifikasi)) {
                throw ValidationException::withMessages([
                    'catatan_verifikasi' => 'Alasan penolakan wajib diisi pada tahap verifikasi.',
                ]);
            }
        }

        $updateData = [
            'status_verifikasi'  => $request->status,
            'tanggal_verifikasi' => now(),
        ];
        if ($request->has('tinggi_badan') && $request->tinggi_badan !== null) {
            $updateData['tinggi_badan'] = $request->tinggi_badan;
        }
        if ($request->has('berat_badan') && $request->berat_badan !== null) {
            $updateData['berat_badan'] = $request->berat_badan;
        }
        if ($request->has('lingkar_pinggang') && $request->lingkar_pinggang !== null) {
            $updateData['lingkar_pinggang'] = $request->lingkar_pinggang;
        }
        if ($request->has('berkas_verifikasi')) {
            $updateData['berkas_verifikasi'] = $request->berkas_verifikasi;
        }
        if ($request->has('angkatan_id') && !empty($request->angkatan_id)) {
            $updateData['angkatan_id'] = $request->angkatan_id;
        }
        if ($request->has('tempat_pelatihan') && !empty($request->tempat_pelatihan)) {
            $updateData['tempat_pelatihan'] = $request->tempat_pelatihan;
        }
        if ($request->has('catatan_verifikasi')) {
            $updateData['catatan_verifikasi'] = $request->catatan_verifikasi;
        }
        $updateData['status'] = $request->status === 'diterima' ? 'diterima' : 'ditolak';

        $pendaftar->update($updateData);
        $this->syncJadwal($pendaftar);

        return response()->json([
            'success' => true,
            'message' => $request->status === 'diterima'
                ? 'Verifikasi diterima. Peserta masuk angkatan & jadwal, status menjadi diterima.'
                : 'Pendaftar ditolak pada tahap verifikasi.',
            'data'    => $pendaftar->load(['program', 'angkatan', 'user', 'jadwal']),
        ]);
    }

    /**
     * Kompatibilitas endpoint lama PATCH /pendaftar/{id}/status.
     * Diarahkan ke alur 2 tahap agar UI lama tidak merusak data.
     */
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status'            => 'required|in:menunggu,diterima,ditolak,lulus,sudah_bekerja,keluar',
            'tinggi_badan'      => 'nullable|numeric|min:100|max:250',
            'berat_badan'       => 'nullable|numeric|min:30|max:200',
            'lingkar_pinggang'  => 'nullable|string',
            'berkas_verifikasi' => 'nullable|array',
            'angkatan_id'       => 'nullable|string|exists:angkatans,id',
            'tempat_pelatihan'  => 'nullable|string',
        ]);

        // Status terminal pasca-pelatihan langsung ke pengubah status akhir.
        if (in_array($request->status, ['lulus', 'sudah_bekerja', 'keluar'], true)) {
            return $this->updateStatusAkhir($request, $id);
        }

        $pendaftar = Pendaftar::findOrFail($id);
        $hasVerifikasiPayload = $request->has('berkas_verifikasi') || $request->has('angkatan_id')
            || $request->has('tempat_pelatihan') || $request->has('tinggi_badan');

        // Tahap validasi belum lolos -> anggap sebagai keputusan validasi,
        // kecuali payload jelas verifikasi dan validasi sudah diterima.
        if ($pendaftar->status_validasi !== 'diterima' && !$hasVerifikasiPayload) {
            $sub = new Request([
                'status' => $request->status === 'ditolak' ? 'ditolak' : 'diterima',
                'catatan_validasi' => $request->input('catatan_validasi'),
            ]);
            return $this->validasi($sub, $id);
        }

        if ($pendaftar->status_validasi !== 'diterima') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftar harus lolos tahap validasi terlebih dahulu sebelum diverifikasi.',
            ], 422);
        }

        $sub = new Request(array_filter([
            'status' => $request->status === 'menunggu' ? 'ditolak' : $request->status,
            'tinggi_badan' => $request->input('tinggi_badan'),
            'berat_badan' => $request->input('berat_badan'),
            'lingkar_pinggang' => $request->input('lingkar_pinggang'),
            'berkas_verifikasi' => $request->input('berkas_verifikasi'),
            'angkatan_id' => $request->input('angkatan_id'),
            'tempat_pelatihan' => $request->input('tempat_pelatihan'),
        ], fn($v) => $v !== null));
        return $this->verifikasi($sub, $id);
    }

    /**
     * Ubah STATUS AKHIR peserta (menu Semua Peserta).
     * Opsi: menunggu, diterima, ditolak, lulus, sudah_bekerja, keluar.
     * 'keluar' untuk peserta yang tidak melanjutkan pelatihan.
     * Selain 'diterima', keterikatan jadwal sesi dilepas otomatis.
     */
    public function updateStatusAkhir(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:menunggu,diterima,ditolak,lulus,sudah_bekerja,keluar',
            'angkatan_id' => 'nullable|string|exists:angkatans,id',
            'tempat_pelatihan' => 'nullable|string|max:255',
        ]);

        $pendaftar = Pendaftar::findOrFail($id);
        $updateData = ['status' => $request->status];
        if ($request->filled('angkatan_id')) {
            $updateData['angkatan_id'] = $request->angkatan_id;
        }
        if ($request->has('tempat_pelatihan') && $request->tempat_pelatihan !== null) {
            $updateData['tempat_pelatihan'] = $request->tempat_pelatihan;
        }

        $pendaftar->update($updateData);
        $this->syncJadwal($pendaftar->fresh());

        $labels = [
            'menunggu' => 'Menunggu',
            'diterima' => 'Diterima',
            'ditolak' => 'Ditolak',
            'lulus' => 'Lulus',
            'sudah_bekerja' => 'Sudah Bekerja',
            'keluar' => 'Keluar',
        ];

        return response()->json([
            'success' => true,
            'message' => 'Status akhir peserta diubah menjadi ' . ($labels[$request->status] ?? $request->status) . '.',
            'data' => $pendaftar->fresh()->load(['program', 'angkatan', 'user', 'jadwal']),
        ]);
    }

    private function syncJadwal(Pendaftar $pendaftar): void
    {
        if ($pendaftar->status !== 'diterima') {
            $pendaftar->jadwal()->detach();
            return;
        }
        if (empty($pendaftar->angkatan_id)) {
            return;
        }
        $nonMatchingJadwals = $pendaftar->jadwal()
            ->where('angkatan_id', '!=', $pendaftar->angkatan_id)
            ->pluck('jadwal_pelatihans.id');
        if ($nonMatchingJadwals->count() > 0) {
            $pendaftar->jadwal()->detach($nonMatchingJadwals);
        }
        $query = \App\Models\JadwalPelatihan::where('angkatan_id', $pendaftar->angkatan_id);
        if (!empty($pendaftar->tempat_pelatihan)) {
            $tpName = explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan;
            $query->where('tempat_pelatihan', 'like', '%' . trim($tpName) . '%');
        }
        $matchingJadwalIds = $query->pluck('id');
        if ($matchingJadwalIds->count() > 0) {
            $pendaftar->jadwal()->syncWithoutDetaching($matchingJadwalIds);
        }
    }

    /**
     * Alokasi / lepas peserta dari angkatan.
     * - angkatan_id diisi: pindahkan ke angkatan tsb (perilaku lama).
     * - angkatan_id null/kosong: LEPAS dari angkatan (kembali "belum masuk
     *   angkatan") + lepas seluruh pivot sesi. Dipakai admin untuk
     *   mengeluarkan peserta dari kelas secara tuntas — peserta hilang dari
     *   daftar instruktur namun riwayat nilai/ujian/pembayaran tetap utuh
     *   dan bisa dialokasikan ulang kapan saja.
     */
    public function alokasiAngkatan(Request $request, string $id)
    {
        $request->validate(['angkatan_id' => 'nullable|exists:angkatans,id']);
        $pendaftar = Pendaftar::findOrFail($id);
        $oldAngkatanId = $pendaftar->angkatan_id;
        $newAngkatanId = $request->input('angkatan_id') ?: null;

        // Angkatan yang sudah Selesai terkunci — tidak bisa tambah/pindah/lepas.
        if ($newAngkatanId !== null) {
            $target = \App\Models\Angkatan::find($newAngkatanId);
            if ($target && $target->status === 'Selesai') {
                return response()->json(['success' => false, 'message' => 'Angkatan sudah Selesai — plotting dikunci.'], 422);
            }
        } elseif ($oldAngkatanId) {
            $current = \App\Models\Angkatan::find($oldAngkatanId);
            if ($current && $current->status === 'Selesai') {
                return response()->json(['success' => false, 'message' => 'Angkatan sudah Selesai — keanggotaan dikunci.'], 422);
            }
        }

        $pendaftar->update(['angkatan_id' => $newAngkatanId]);

        // Lepas dari angkatan: cabut seluruh keterikatan sesi paket.
        if ($newAngkatanId === null) {
            $pendaftar->jadwal()->detach();
            return response()->json(['success' => true, 'message' => 'Peserta dilepas dari angkatan.', 'data' => $pendaftar->load('angkatan')]);
        }

        // Jika angkatan berubah, bersihkan jadwal dari angkatan lama
        if ($oldAngkatanId !== $request->angkatan_id) {
            $nonMatchingJadwals = $pendaftar->jadwal()
                ->where('angkatan_id', '!=', $request->angkatan_id)
                ->pluck('jadwal_pelatihans.id');
            if ($nonMatchingJadwals->count() > 0) {
                $pendaftar->jadwal()->detach($nonMatchingJadwals);
            }

            if ($pendaftar->status === 'diterima') {
                $query = \App\Models\JadwalPelatihan::where('angkatan_id', $request->angkatan_id);
                if (!empty($pendaftar->tempat_pelatihan)) {
                    $tpName = explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan;
                                        $query->where('tempat_pelatihan', 'like', '%' . trim($tpName) . '%');
                }
                $matchingJadwalIds = $query->pluck('id');
                if ($matchingJadwalIds->count() > 0) {
                    $pendaftar->jadwal()->syncWithoutDetaching($matchingJadwalIds);
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'Peserta dialokasikan ke angkatan.', 'data' => $pendaftar->load('angkatan')]);
    }

    private function validateParticipantRequirements(string $tanggalLahir, string $tinggiBadan, string $beratBadan): void
    {
        $birthDate = Carbon::parse($tanggalLahir);
        $age = $birthDate->diffInYears(now());
        $heightInMeters = (float) $tinggiBadan / 100;
        $bmi = $heightInMeters > 0 ? (float) $beratBadan / ($heightInMeters * $heightInMeters) : 0;
        $errors = [];

        if ($age < 18) {
            $errors['tanggal_lahir'] = 'Peserta harus berusia minimal 18 tahun.';
        }

        if ($bmi < 18) {
            $errors['berat_badan'] = 'BMI peserta harus minimal 18.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'interview', 'tagihan.pembayarans.paymentMethod', 'kelulusan'])
            ->where('user_id', $user->id)->firstOrFail();
        return response()->json(['success' => true, 'data' => $pendaftar]);
    }

    public function byAngkatan(string $angkatanId)
    {
        // Anggota angkatan tetap tampil walau sudah lulus / sudah bekerja.
        $pendaftar = Pendaftar::where('angkatan_id', $angkatanId)->whereIn('status', ['diterima', 'lulus', 'sudah_bekerja'])->with('user')->get();
        return response()->json(['success' => true, 'data' => $pendaftar]);
    }
}
