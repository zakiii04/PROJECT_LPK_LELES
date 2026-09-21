<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Pendaftar;
use App\Models\JadwalPelatihan;
use App\Models\SoalUjian;
use App\Models\ProgramPelatihan;
use App\Models\Angkatan;
use App\Models\TempatPelatihan;
use App\Models\PaymentMethod;
use App\Models\HasilUjian;
use App\Models\Kelulusan;
use App\Http\Controllers\ProgramPelatihanController;
use App\Http\Controllers\AngkatanController;
use App\Http\Controllers\TempatPelatihanController;
use App\Http\Controllers\PendaftarController;
use App\Http\Controllers\JadwalPelatihanController;
use App\Http\Controllers\KelulusanController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\AuthController;

// Home Page
Route::get('/', function () {
    return Inertia::render('Home', [
        'programs' => ProgramPelatihan::all(),
    ]);
});

// Authentication API Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/refresh', [AuthController::class, 'refresh']);
Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

// Single Unified Login Route
Route::get('/login', function () {
    return Inertia::render('Login');
})->name('login');

// Redirect legacy login URLs to single login
Route::get('/admin', function () {
    return Inertia::render('Login');
});
Route::get('/peserta/login', function () {
    return Inertia::render('Login');
});

// Dashboards — Direct Props (Inertia Server-Side Loaded)
Route::get('/admin/dashboard', function () {
    return Inertia::render('Admin/Dashboard', [
        'initialPendaftarList' => Pendaftar::with(['program', 'angkatan', 'user', 'tagihan.pembayarans.paymentMethod'])->latest('tanggal_daftar')->get(),
        'initialJadwalList'    => JadwalPelatihan::with('peserta')->get(),
        'initialSoalList'      => SoalUjian::all(),
        'initialProgramList'   => ProgramPelatihan::all(),
        'initialAngkatanList'  => Angkatan::with(['program', 'pendaftar'])->withCount('pendaftar')->get(),
        'initialTempatList'    => TempatPelatihan::all(),
        'initialInstrukturList'=> \App\Models\Instruktur::with('user')->orderBy('nama')->get(),
        'initialPaymentMethods'=> PaymentMethod::all(),
    ]);
});

Route::get('/admin/peserta/{id}', function ($id) {
    $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'interview', 'kelulusan'])->find($id);
    return Inertia::render('Admin/PesertaDetail', [
        'id'                  => $id,
        'initialPendaftar'    => $pendaftar,
        'initialAngkatanList' => Angkatan::with(['program', 'pendaftar'])->withCount('pendaftar')->get(),
        'initialProgramList'  => ProgramPelatihan::all(),
    ]);
});

Route::get('/peserta/dashboard', function () {
    $user = auth()->user();
    $pendaftar = null;
    if ($user) {
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'tagihan.pembayarans.paymentMethod'])->where('user_id', $user->id)->first();
    }
    // JANGAN fallback ke latest()->first(): itu membocorkan akun peserta lain
    // ke sesi yang tidak terautentikasi. Biarkan null agar frontend redirect ke login.
    if (!$pendaftar) {
        return Inertia::render('Peserta/Dashboard', [
            'initialPendaftar'       => null,
            'initialJadwalList'      => [],
            'initialHasilUjianList'  => [],
            'initialKelulusanRecord' => null,
        ]);
    }

    $jadwalList = [];
    $hasilUjianList = [];
    $kelulusanRecord = null;
    if ($pendaftar) {
        if ($pendaftar->status === 'diterima' && !empty($pendaftar->angkatan_id)) {
            $jadwalList = $pendaftar->jadwal()
                ->where('jadwal_pelatihans.angkatan_id', $pendaftar->angkatan_id)
                ->with('angkatan')
                ->orderBy('hari_ke')
                ->orderBy('tanggal')
                ->get();
        }
        $hasilUjianList = HasilUjian::where('pendaftar_id', $pendaftar->id)
            ->orderBy('nilai', 'desc')
            ->orderBy('tanggal', 'desc')
            ->get();
        $kelulusanRecord = Kelulusan::where('pendaftar_id', $pendaftar->id)->first();
    }

    return Inertia::render('Peserta/Dashboard', [
        'initialPendaftar'       => $pendaftar,
        'initialJadwalList'      => $jadwalList,
        'initialHasilUjianList'  => $hasilUjianList,
        'initialKelulusanRecord' => $kelulusanRecord,
    ]);
});

Route::get('/peserta/ujian', function () {
    $user = auth()->user();
    $pendaftar = null;
    if ($user) {
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'user'])->where('user_id', $user->id)->first();
    }
    // JANGAN fallback ke latest()->first(): membocorkan akun peserta lain.
    // Biarkan null agar halaman ujian menampilkan error + redirect ke login.

    return Inertia::render('Peserta/Ujian', [
        'initialPendaftar' => $pendaftar,
    ]);
});

Route::get('/hrd/dashboard', function () {
    return Inertia::render('Hrd/Dashboard', [
        'initialPendaftarList' => Pendaftar::with(['program', 'angkatan', 'user', 'interview'])->latest('tanggal_daftar')->get(),
        'initialAngkatanList'  => Angkatan::all(),
    ]);
});

Route::get('/instruktur/dashboard', function () {
    return Inertia::render('Instruktur/Dashboard', [
        'initialPendaftarList' => Pendaftar::with(['program', 'angkatan', 'user'])->latest('tanggal_daftar')->get(),
        'initialJadwalList'    => JadwalPelatihan::all(),
        'initialAngkatanList'  => Angkatan::all(),
    ]);
});

// Pendaftaran
Route::get('/pendaftaran', function () {
    return Inertia::render('Pendaftaran', [
        'initialProgramList' => ProgramPelatihan::all(),
    ]);
});

// =========================================================
// DIRECT WEB RESOURCE ROUTES (Replacing /api/v1/)
// =========================================================

// Program Pelatihan
Route::get('/programs', [ProgramPelatihanController::class, 'index']);
Route::get('/programs/{id}', [ProgramPelatihanController::class, 'show']);
Route::post('/programs', [ProgramPelatihanController::class, 'store']);
Route::put('/programs/{id}', [ProgramPelatihanController::class, 'update']);
Route::delete('/programs/{id}', [ProgramPelatihanController::class, 'destroy']);

// Angkatan
Route::get('/angkatan', [AngkatanController::class, 'index']);
Route::get('/angkatan/{id}', [AngkatanController::class, 'show']);
Route::post('/angkatan', [AngkatanController::class, 'store']);
Route::put('/angkatan/{id}', [AngkatanController::class, 'update']);
Route::patch('/angkatan/{id}/status', [AngkatanController::class, 'updateStatus']);
Route::delete('/angkatan/{id}', [AngkatanController::class, 'destroy']);
Route::get('/angkatan/{id}/pendaftar', [PendaftarController::class, 'byAngkatan']);

// =========================================================
// PENYELESAIAN KELAS (angkatan + tempat)
// Satu baris = satu kelas selesai. Begitu SELURUH kelas (distinct
// tempat pada sesi jadwal) dalam satu angkatan selesai, status angkatan
// otomatis menjadi 'Selesai'.
// =========================================================
Route::get('/penyelesaian-kelas', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\PenyelesaianKelas::with('angkatan');
    if ($request->filled('angkatan_id')) $query->where('angkatan_id', $request->angkatan_id);
    return response()->json(['success' => true, 'data' => $query->orderBy('created_at')->get()]);
});

Route::post('/penyelesaian-kelas', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'angkatan_id'     => 'required|string|exists:angkatans,id',
        'tempat_pelatihan' => 'required|string|max:255',
        'tanggal_selesai' => 'nullable|date',
    ]);

    $exists = \App\Models\PenyelesaianKelas::where('angkatan_id', $data['angkatan_id'])
        ->where('tempat_pelatihan', $data['tempat_pelatihan'])
        ->first();
    if ($exists) {
        return response()->json(['success' => false, 'message' => 'Kelas ini sudah diselesaikan sebelumnya.'], 409);
    }

    $result = \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
        $penyelesaian = \App\Models\PenyelesaianKelas::create([
            'id'               => (string) \Illuminate\Support\Str::uuid(),
            'angkatan_id'      => $data['angkatan_id'],
            'tempat_pelatihan' => $data['tempat_pelatihan'],
            'tanggal_selesai'  => $data['tanggal_selesai'] ?? now()->toDateString(),
        ]);

        // Auto-Selesai angkatan: semua distinct tempat pada sesi jadwal
        // sudah punya catatan penyelesaian.
        $semuaTempat = \App\Models\JadwalPelatihan::where('angkatan_id', $data['angkatan_id'])
            ->whereNotNull('tempat_pelatihan')
            ->distinct()
            ->pluck('tempat_pelatihan');
        $selesaiTempat = \App\Models\PenyelesaianKelas::where('angkatan_id', $data['angkatan_id'])
            ->pluck('tempat_pelatihan');

        $angkatanSelesai = false;
        if ($semuaTempat->count() > 0 && $semuaTempat->diff($selesaiTempat)->isEmpty()) {
            $angkatan = \App\Models\Angkatan::find($data['angkatan_id']);
            if ($angkatan && $angkatan->status !== 'Selesai') {
                $angkatan->update(['status' => 'Selesai']);
                $angkatanSelesai = true;
            }
        }

        return ['penyelesaian' => $penyelesaian, 'angkatan_selesai' => $angkatanSelesai];
    });

    return response()->json([
        'success'           => true,
        'message'           => $result['angkatan_selesai']
            ? 'Kelas diselesaikan. Seluruh kelas selesai — status angkatan otomatis menjadi Selesai.'
            : 'Kelas diselesaikan.',
        'data'              => $result['penyelesaian'],
        'angkatan_selesai'  => $result['angkatan_selesai'],
    ], 201);
});

// Tempat Pelatihan
Route::get('/tempat', [TempatPelatihanController::class, 'index']);
Route::get('/tempat/{id}', [TempatPelatihanController::class, 'show']);
Route::post('/tempat', [TempatPelatihanController::class, 'store']);
Route::put('/tempat/{id}', [TempatPelatihanController::class, 'update']);
Route::delete('/tempat/{id}', [TempatPelatihanController::class, 'destroy']);

// Instruktur (master data pengajar — dipilih / diketik manual pada form jadwal)
Route::get('/instruktur', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\Instruktur::with('user')->orderBy('nama');
    if ($request->filled('status')) $query->where('status', $request->status);
    if ($request->filled('search')) $query->where('nama', 'like', '%' . $request->search . '%');
    return response()->json(['success' => true, 'data' => $query->get()]);
});
Route::get('/instruktur/{id}', function (string $id) {
    $ins = \App\Models\Instruktur::with('user')->find($id);
    if (!$ins) return response()->json(['success' => false, 'message' => 'Instruktur tidak ditemukan'], 404);
    return response()->json(['success' => true, 'data' => $ins]);
});
Route::post('/instruktur', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'nama'     => 'required|string|max:100',
        'no_hp'    => 'nullable|string|max:20',
        'email'    => 'nullable|email|max:100',
        'keahlian' => 'nullable|string|max:150',
        'status'   => 'nullable|in:Aktif,Nonaktif',
        'username' => 'nullable|string|max:50|unique:users,username',
        'password' => 'nullable|string|min:6|required_with:username',
    ]);

    $username = $data['username'] ?? null;
    unset($data['username'], $data['password']);

    $ins = \App\Models\Instruktur::create(array_merge($data, ['id' => \Illuminate\Support\Str::uuid()]));

    // Buatkan akun login otomatis bila username + password diisi
    if ($username && $request->filled('password')) {
        $email = $data['email'] ?? null;
        if (!$email) {
            $base = \Illuminate\Support\Str::slug($username, '') ?: 'instruktur';
            $email = $base . '@instruktur.local';
            $i = 1;
            while (\App\Models\User::where('email', $email)->exists()) {
                $email = $base . $i++ . '@instruktur.local';
            }
        }
        $user = \App\Models\User::create([
            'id'       => (string) \Illuminate\Support\Str::uuid(),
            'username' => $username,
            'email'    => $email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role'     => 'INSTRUKTUR',
        ]);
        $ins->update(['user_id' => $user->id]);
    }

    return response()->json(['success' => true, 'data' => $ins->load('user')], 201);
});
Route::put('/instruktur/{id}', function (\Illuminate\Http\Request $request, string $id) {
    $ins = \App\Models\Instruktur::find($id);
    if (!$ins) return response()->json(['success' => false, 'message' => 'Instruktur tidak ditemukan'], 404);

    $ignoreId = $ins->user_id ?? '00000000-0000-0000-0000-000000000000';
    $data = $request->validate([
        'nama'     => 'sometimes|string|max:100',
        'no_hp'    => 'nullable|string|max:20',
        'email'    => 'nullable|email|max:100',
        'keahlian' => 'nullable|string|max:150',
        'status'   => 'nullable|in:Aktif,Nonaktif',
        'username' => 'nullable|string|max:50|unique:users,username,' . $ignoreId . ',id',
        'password' => 'nullable|string|min:6',
    ]);

    $username = $data['username'] ?? null;
    unset($data['username'], $data['password']);
    $ins->update($data);

    // Sinkronkan email akun login bila email master diubah & belum dipakai akun lain
    if (array_key_exists('email', $data) && $data['email'] && $ins->user_id) {
        $linked = \App\Models\User::find($ins->user_id);
        if ($linked && $data['email'] !== $linked->email
            && !\App\Models\User::where('email', $data['email'])->where('id', '!=', $linked->id)->exists()) {
            $linked->update(['email' => $data['email']]);
        }
    }

    // Buat akun bila belum ada, atau perbarui akun yang tertaut
    if ($username || $request->filled('password')) {
        if (!$ins->user_id) {
            if (!$username || !$request->filled('password')) {
                return response()->json(['success' => false, 'message' => 'Username dan password wajib diisi untuk membuat akun.'], 422);
            }
            $user = \App\Models\User::create([
                'id'       => (string) \Illuminate\Support\Str::uuid(),
                'username' => $username,
                'email'    => $ins->email ?: $username . '@instruktur.local',
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'role'     => 'INSTRUKTUR',
            ]);
            $ins->update(['user_id' => $user->id]);
        } else {
            $user = \App\Models\User::find($ins->user_id);
            if ($user) {
                if ($username) $user->username = $username;
                if ($request->filled('password')) $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
                $user->save();
            }
        }
    }

    return response()->json(['success' => true, 'data' => $ins->load('user')]);
});
Route::delete('/instruktur/{id}', function (string $id) {
    $ins = \App\Models\Instruktur::find($id);
    if (!$ins) return response()->json(['success' => false, 'message' => 'Instruktur tidak ditemukan'], 404);
    $userId = $ins->user_id;
    $ins->delete();
    // Hapus akun login yang dibuat otomatis agar tidak yatim
    if ($userId) \App\Models\User::destroy($userId);
    return response()->json(['success' => true]);
});

// Pendaftar
Route::get('/pendaftar/me', function (\Illuminate\Http\Request $request) {
    $user = $request->user() ?? auth()->user();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated. Silakan login kembali.'], 401);
    }
    $pendaftar = \App\Models\Pendaftar::with(['program', 'angkatan', 'user', 'tagihan.pembayarans.paymentMethod'])->where('user_id', $user->id)->first();
    if (!$pendaftar) {
        return response()->json(['success' => false, 'message' => 'Peserta tidak ditemukan'], 404);
    }
    return response()->json(['success' => true, 'data' => $pendaftar]);
});

Route::get('/pendaftar/me/jadwal', function (\Illuminate\Http\Request $request) {
    $user = $request->user() ?? auth()->user();
    $pendaftar = null;
    if ($user) {
        $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    }
    // Tanpa pendaftar yang terautentikasi: kembalikan kosong (jangan fallback
    // ke pendaftar lain agar peserta tidak melihat jadwal orang lain).
    if (!$pendaftar || $pendaftar->status !== 'diterima' || empty($pendaftar->angkatan_id)) {
        return response()->json(['success' => true, 'data' => []]);
    }

    // Hanya sesi yang ditempati peserta (relasi pivot peserta_jadwals).
    // Bila admin mengeluarkan peserta dari sesi, sesi itu ikut hilang di sini.
    $jadwal = $pendaftar->jadwal()
        ->where('jadwal_pelatihans.angkatan_id', $pendaftar->angkatan_id)
        ->with('angkatan')
        ->orderBy('hari_ke')
        ->orderBy('tanggal')
        ->get();

    return response()->json(['success' => true, 'data' => $jadwal]);
});

Route::get('/pendaftar/me/kehadiran', function (\Illuminate\Http\Request $request) {
    $user = $request->user() ?? auth()->user();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
    }
    $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    if (!$pendaftar) return response()->json(['success' => true, 'data' => []]);

    $data = \App\Models\Kehadiran::where('pendaftar_id', $pendaftar->id)->get();
    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/pendaftar/me/kelulusan', function (\Illuminate\Http\Request $request) {
    $user = $request->user() ?? auth()->user();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
    }
    $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    if (!$pendaftar) return response()->json(['success' => true, 'data' => null]);

    $data = \App\Models\Kelulusan::with('pendaftar.program')->where('pendaftar_id', $pendaftar->id)->first();
    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/kelulusan', [KelulusanController::class, 'index']);
Route::get('/kelulusan/{id}', [KelulusanController::class, 'show']);
Route::post('/kelulusan', [KelulusanController::class, 'store']);
Route::put('/kelulusan/{id}', [KelulusanController::class, 'update']);
Route::delete('/kelulusan/{id}', [KelulusanController::class, 'destroy']);
Route::get('/sertifikat/{no}', function (string $no) {
    $data = Kelulusan::with('pendaftar.program')->where('no_sertifikat', $no)->firstOrFail();
    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/pendaftar', [PendaftarController::class, 'index']);
Route::get('/pendaftar/{id}', [PendaftarController::class, 'show']);
Route::post('/pendaftar', [PendaftarController::class, 'store']);
Route::put('/pendaftar/{id}', [PendaftarController::class, 'update']);
Route::patch('/pendaftar/{id}/status', [PendaftarController::class, 'updateStatus']);
Route::patch('/pendaftar/{id}/status-akhir', [PendaftarController::class, 'updateStatusAkhir']);
Route::patch('/pendaftar/{id}/validasi', [PendaftarController::class, 'validasi']);
Route::patch('/pendaftar/{id}/verifikasi', [PendaftarController::class, 'verifikasi']);
Route::patch('/pendaftar/{id}/angkatan', [PendaftarController::class, 'alokasiAngkatan']);
Route::delete('/pendaftar/{id}', [PendaftarController::class, 'destroy']);

// Jadwal Pelatihan
Route::get('/jadwal', [JadwalPelatihanController::class, 'index']);
Route::put('/jadwal-paket', [JadwalPelatihanController::class, 'updatePaket']);
Route::get('/jadwal/{id}', [JadwalPelatihanController::class, 'show']);
Route::post('/jadwal', [JadwalPelatihanController::class, 'store']);
Route::put('/jadwal/{id}', [JadwalPelatihanController::class, 'update']);
Route::delete('/jadwal/{id}', [JadwalPelatihanController::class, 'destroy']);
Route::post('/jadwal/{id}/peserta', [JadwalPelatihanController::class, 'addPeserta']);
Route::delete('/jadwal/{id}/peserta/{pendaftar_id}', [JadwalPelatihanController::class, 'removePeserta']);

// Soal Ujian (inline CRUD with image support)
Route::get('/soal', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\SoalUjian::query();
    if ($request->filled('tipe')) $query->where('tipe', $request->tipe);
    if ($request->filled('program_id')) $query->where('program_id', $request->program_id);
    if ($request->filled('is_active')) {
        $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $request->is_active);
    }
    return response()->json(['success' => true, 'data' => $query->get()]);
});

Route::get('/soal/random', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\SoalUjian::query()->where('is_active', true);
    if ($request->filled('tipe')) $query->where('tipe', $request->tipe);
    if ($request->filled('program_id')) $query->where('program_id', $request->program_id);
    $jumlah = $request->input('jumlah', 20);
    return response()->json(['success' => true, 'data' => $query->inRandomOrder()->limit($jumlah)->get()]);
});

Route::get('/soal/{id}', function (string $id) {
    $soal = \App\Models\SoalUjian::find($id);
    if (!$soal) return response()->json(['success' => false, 'message' => 'Soal tidak ditemukan'], 404);
    return response()->json(['success' => true, 'data' => $soal]);
});

Route::post('/soal', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'jenis_pelatihan' => 'required|string',
        'tipe'            => 'required|in:pretest,posttest',
        'pertanyaan'      => 'required|string',
        'opsi'            => 'required|array|min:2',
        'jawaban_benar'   => 'required|integer|min:0',
        'program_id'      => 'nullable|string',
        'gambar_soal'     => 'nullable|file|image|max:5120',
        'is_active'       => 'nullable|boolean',
    ]);

    if ($request->hasFile('gambar_soal')) {
        $path = $request->file('gambar_soal')->store('soal', 'public');
        $data['gambar_soal'] = asset('storage/' . $path);
    }

    if (is_string($data['opsi'] ?? null)) {
        $data['opsi'] = json_decode($data['opsi'], true);
    }

    if (!array_key_exists('is_active', $data)) {
        $data['is_active'] = true;
    } else {
        $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $data['is_active'];
    }

    $soal = \App\Models\SoalUjian::create(array_merge($data, ['id' => \Illuminate\Support\Str::uuid()]));
    return response()->json(['success' => true, 'data' => $soal], 201);
});

Route::put('/soal/{id}', function (\Illuminate\Http\Request $request, string $id) {
    $soal = \App\Models\SoalUjian::find($id);
    if (!$soal) return response()->json(['success' => false, 'message' => 'Soal tidak ditemukan'], 404);

    $data = $request->validate([
        'jenis_pelatihan' => 'sometimes|string',
        'tipe'            => 'sometimes|in:pretest,posttest',
        'pertanyaan'      => 'sometimes|string',
        'opsi'            => 'sometimes|array|min:2',
        'jawaban_benar'   => 'sometimes|integer|min:0',
        'program_id'      => 'nullable|string',
        'gambar_soal'     => 'nullable|file|image|max:5120',
        'is_active'       => 'nullable|boolean',
    ]);

    if ($request->hasFile('gambar_soal')) {
        $path = $request->file('gambar_soal')->store('soal', 'public');
        $data['gambar_soal'] = asset('storage/' . $path);
    }

    if (isset($data['opsi']) && is_string($data['opsi'])) {
        $data['opsi'] = json_decode($data['opsi'], true);
    }

    if (array_key_exists('is_active', $data)) {
        $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $data['is_active'];
    }

    $soal->update($data);
    return response()->json(['success' => true, 'data' => $soal]);
});

Route::patch('/soal/{id}/status', function (\Illuminate\Http\Request $request, string $id) {
    $soal = \App\Models\SoalUjian::find($id);
    if (!$soal) return response()->json(['success' => false, 'message' => 'Soal tidak ditemukan'], 404);

    $data = $request->validate([
        'is_active' => 'required|boolean',
    ]);

    $soal->update(['is_active' => (bool) $data['is_active']]);
    return response()->json(['success' => true, 'data' => $soal]);
});

Route::delete('/soal/{id}', function (string $id) {
    $soal = \App\Models\SoalUjian::find($id);
    if (!$soal) return response()->json(['success' => false, 'message' => 'Soal tidak ditemukan'], 404);
    $soal->delete();
    return response()->json(['success' => true, 'message' => 'Soal berhasil dihapus']);
});

// Ujian routes (peserta) — hanya soal aktif, urutan acak
Route::get('/ujian/mulai', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\SoalUjian::query()->where('is_active', true);
    if ($request->filled('tipe')) $query->where('tipe', $request->tipe);
    if ($request->filled('program_id')) {
        $progId = $request->program_id;
        $query->where(function ($sq) use ($progId) {
            $sq->where('program_id', $progId)
               ->orWhere('program_id', '')
               ->orWhereNull('program_id')
               ->orWhere('jenis_pelatihan', 'Semua');
        });
    }
    $jumlah = (int)$request->input('jumlah', 20);
    $soals = $query->inRandomOrder()->limit($jumlah)->get();

    // Fallback: if no specific program soal found, return any ACTIVE soal with that tipe
    if ($soals->isEmpty() && $request->filled('tipe')) {
        $soals = \App\Models\SoalUjian::where('is_active', true)->where('tipe', $request->tipe)->inRandomOrder()->limit($jumlah)->get();
    }
    // Fallback 2: if still empty, return any ACTIVE soal
    if ($soals->isEmpty()) {
        $soals = \App\Models\SoalUjian::where('is_active', true)->inRandomOrder()->limit($jumlah)->get();
    }

    return response()->json(['success' => true, 'data' => $soals]);
});

Route::post('/ujian/submit', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'tipe'         => 'required|in:pretest,posttest',
        'program_id'   => 'required|string',
        'jawaban'      => 'required|array',
        'pendaftar_id' => 'nullable|string',
    ]);

    // 1. Resolve real pendaftar — STRICT, tanpa fallback ke peserta lain.
    // Prioritas: pendaftar milik user yang sedang login (anti lintas-akun).
    $pendaftar = null;
    $authUser = auth()->user() ?? $request->user();
    if ($authUser) {
        $pendaftar = \App\Models\Pendaftar::where('user_id', $authUser->id)->first();
    }
    // Jika client mengirim pendaftar_id eksplisit, hanya terima bila milik user ini
    // (atau bila tidak ada sesi login sama sekali, pakai apa adanya — tapi JANGAN
    // pernah fallback ke latest()).
    if (!empty($data['pendaftar_id'])) {
        $claimed = \App\Models\Pendaftar::find($data['pendaftar_id']);
        if ($claimed) {
            if ($authUser) {
                if ($claimed->user_id === $authUser->id) {
                    $pendaftar = $claimed;
                }
                // else: abaikan pendaftar_id milik orang lain — tetap pakai milik auth user
            } else {
                $pendaftar = $claimed;
            }
        }
    }
    if (!$pendaftar) {
        return response()->json([
            'success' => false,
            'message' => 'Data peserta tidak ditemukan. Silakan login kembali.',
        ], 401);
    }

    // 2. Enforce maximum 3 attempts per test type
    $existingAttempts = \App\Models\HasilUjian::where('pendaftar_id', $pendaftar->id)
        ->where('tipe', $data['tipe'])
        ->get();

    if ($existingAttempts->count() >= 3) {
        return response()->json([
            'success'     => false,
            'message'     => 'Batas maksimal pengerjaan ulang (3 kali) telah tercapai.',
            'max_reached' => true,
            'attempts'    => $existingAttempts->count(),
            'best_nilai'  => $existingAttempts->max('nilai'),
        ], 422);
    }

    // 3. Grade answers (+ snapshot rincian per soal untuk croschek admin/instruktur)
    $soalIds = collect($data['jawaban'])->pluck('soal_id')->toArray();
    $soalList = \App\Models\SoalUjian::whereIn('id', $soalIds)->get()->keyBy('id');

    $benar = 0;
    $salah = 0;
    $detail = [];
    foreach ($data['jawaban'] as $item) {
        $soal = $soalList->get($item['soal_id']);
        $jawabanPeserta = (int) $item['jawaban'];
        $kunci = $soal ? (int) $soal->jawaban_benar : null;
        $isBenar = $soal && $jawabanPeserta === $kunci;
        if ($isBenar) {
            $benar++;
        } else {
            $salah++;
        }
        $detail[] = [
            'soal_id'         => $item['soal_id'],
            'pertanyaan'      => $soal->pertanyaan ?? '(soal dihapus)',
            'opsi'            => $soal->opsi ?? [],
            'gambar_soal'     => $soal->gambar_soal ?? null,
            'jawaban_peserta' => $jawabanPeserta,
            'jawaban_benar'   => $kunci,
            'benar'           => $isBenar,
        ];
    }
    $total = count($data['jawaban']);
    $nilai = $total > 0 ? round(($benar / $total) * 100) : 0;

    // 4. Create current attempt record in HasilUjian
    $hasil = \App\Models\HasilUjian::create([
        'id'           => (string) \Illuminate\Support\Str::uuid(),
        'tipe'         => $data['tipe'],
        'nilai'        => $nilai,
        'benar'        => $benar,
        'salah'        => $salah,
        'total_soal'   => $total,
        'detail'       => $detail,
        'pendaftar_id' => $pendaftar->id,
        'tanggal'      => now(),
    ]);

    // 5. Calculate and store best score (nilai tertinggi)
    $prevMaxNilai = $existingAttempts->max('nilai') ?? 0;
    $bestNilai = max($prevMaxNilai, $nilai);

    // Update into Nilai table so certificate and transcripts use highest score.
    // (firstOrNew + isi id manual: updateOrCreate tanpa id gagal insert karena
    //  kolom id tidak punya default value; isi id hanya untuk baris baru agar
    //  primary key baris lama tidak tertimpa.)
    $nilaiRow = \App\Models\Nilai::firstOrNew(
        [
            'pendaftar_id'      => $pendaftar->id,
            'tipe_nilai'        => $data['tipe'],
            'mata_pelajaran_id' => null,
        ]
    );
    if (!$nilaiRow->exists) {
        $nilaiRow->id = (string) \Illuminate\Support\Str::uuid();
    }
    $nilaiRow->fill([
        'nilai'   => $bestNilai,
        'tanggal' => now(),
        'catatan' => 'Ujian ' . ucfirst($data['tipe']) . ' (Nilai Tertinggi dari ' . ($existingAttempts->count() + 1) . 'x percobaan)',
    ]);
    $nilaiRow->save();

    return response()->json([
        'success'     => true,
        'data'        => $hasil,
        'best_nilai'  => $bestNilai,
        'attempt'     => $existingAttempts->count() + 1,
        'max_attempt' => 3,
    ]);
});

Route::get('/pendaftar/me/ujian', function () {
    $user = auth()->user() ?? request()->user();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
    }
    $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    if (!$pendaftar) return response()->json(['success' => true, 'data' => []]);

    $list = \App\Models\HasilUjian::where('pendaftar_id', $pendaftar->id)
        ->orderBy('nilai', 'desc')
        ->orderBy('tanggal', 'desc')
        ->get();

    return response()->json(['success' => true, 'data' => $list]);
});

Route::get('/hasil-ujian', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\HasilUjian::with('pendaftar.program');
    if ($request->filled('pendaftar_id')) $query->where('pendaftar_id', $request->pendaftar_id);
    if ($request->filled('tipe')) $query->where('tipe', $request->tipe);
    $list = $query->orderBy('tanggal', 'desc')->get();
    return response()->json(['success' => true, 'data' => $list]);
});

// Detail satu percobaan ujian + snapshot croschek jawaban per soal.
// Untuk attempt lama yang belum punya snapshot `detail`, susun ulang dari
// data soal saat ini (ditandai reconstructed=true).
Route::get('/hasil-ujian/{id}', function (string $id) {
    $hasil = \App\Models\HasilUjian::with('pendaftar.program')->find($id);
    if (!$hasil) return response()->json(['success' => false, 'message' => 'Hasil ujian tidak ditemukan'], 404);

    $detail = $hasil->detail;
    $reconstructed = false;
    if (empty($detail) || !is_array($detail)) {
        // Attempt lama (sebelum snapshot disimpan): tak ada rincian jawaban
        // peserta yang tersimpan, jadi kembalikan soal terkait bila masih ada.
        $reconstructed = true;
        $detail = [];
    }

    return response()->json(['success' => true, 'data' => array_merge($hasil->toArray(), [
        'reconstructed' => $reconstructed,
    ])]);
});

// Daftar percobaan ujian milik satu peserta (dipakai Admin/Instruktur).
Route::get('/pendaftar/{id}/hasil-ujian', function (\Illuminate\Http\Request $request, string $id) {
    $pendaftar = \App\Models\Pendaftar::with('program')->find($id);
    if (!$pendaftar) return response()->json(['success' => false, 'message' => 'Peserta tidak ditemukan'], 404);
    $query = \App\Models\HasilUjian::where('pendaftar_id', $id);
    if ($request->filled('tipe')) $query->where('tipe', $request->tipe);
    $list = $query->orderBy('tanggal', 'desc')->get();
    return response()->json(['success' => true, 'data' => $list]);
});

// Pembayaran routes
Route::get('/pendaftar/{id}/pembayaran', [PembayaranController::class, 'info']);
Route::post('/pendaftar/{id}/pembayaran', [PembayaranController::class, 'store']);
Route::post('/pendaftar/{id}/pembayaran/manual', [PembayaranController::class, 'storeManual']);

// Riwayat seluruh transaksi pembayaran (menu Histori Pembayaran admin).
// Filter: status, tipe_pembayaran, search (nama/no.pendaftaran/nik),
// tanggal_dari, tanggal_sampai (berdasar tanggal_bayar).
Route::get('/pembayaran', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\Pembayaran::with(['tagihan.pendaftar.program', 'paymentMethod']);
    if ($request->filled('status')) $query->where('status', $request->status);
    if ($request->filled('tipe_pembayaran')) $query->where('tipe_pembayaran', $request->tipe_pembayaran);
    if ($request->filled('tanggal_dari')) $query->whereDate('tanggal_bayar', '>=', $request->tanggal_dari);
    if ($request->filled('tanggal_sampai')) $query->whereDate('tanggal_bayar', '<=', $request->tanggal_sampai);
    if ($request->filled('search')) {
        $q = $request->search;
        $query->whereHas('tagihan.pendaftar', function ($sq) use ($q) {
            $sq->where('nama_lengkap', 'like', "%$q%")
                ->orWhere('no_pendaftaran', 'like', "%$q%")
                ->orWhere('nik', 'like', "%$q%");
        });
    }
    $list = $query->orderBy('tanggal_bayar', 'desc')->paginate($request->input('per_page', 20));
    return response()->json(['success' => true, 'data' => $list]);
});
Route::patch('/pendaftar/{id}/pembayaran/verifikasi', [PembayaranController::class, 'verify']);
Route::patch('/pendaftar/{id}/pembayaran/tolak', [PembayaranController::class, 'reject']);
Route::patch('/pembayaran/{id}/verifikasi', [PembayaranController::class, 'verifyTransaction']);
Route::patch('/pembayaran/{id}/tolak', [PembayaranController::class, 'rejectTransaction']);

// Payment Methods
Route::get('/payment-methods', function () {
    return response()->json(['success' => true, 'data' => \App\Models\PaymentMethod::orderBy('urutan')->get()]);
});
Route::post('/payment-methods', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'nama_metode' => 'required|string',
        'rekening'    => 'nullable|string',
        'deskripsi'   => 'nullable|string',
        'jenis'       => 'required|in:bank,ewallet,qris,lainnya',
        'is_active'   => 'nullable|boolean',
        'urutan'      => 'nullable|integer',
    ]);
    $pm = \App\Models\PaymentMethod::create(array_merge($data, ['id' => \Illuminate\Support\Str::uuid()]));
    return response()->json(['success' => true, 'data' => $pm], 201);
});
Route::put('/payment-methods/{id}', function (\Illuminate\Http\Request $request, string $id) {
    $pm = \App\Models\PaymentMethod::find($id);
    if (!$pm) return response()->json(['success' => false, 'message' => 'Tidak ditemukan'], 404);
    $pm->update($request->only(['nama_metode', 'rekening', 'deskripsi', 'jenis', 'is_active', 'urutan']));
    return response()->json(['success' => true, 'data' => $pm]);
});
Route::delete('/payment-methods/{id}', function (string $id) {
    \App\Models\PaymentMethod::destroy($id);
    return response()->json(['success' => true]);
});

// Upload routes
Route::post('/upload/bukti-pembayaran', function (\Illuminate\Http\Request $request) {
    $request->validate(['file' => 'required|file|image|max:5120']);
    $path = $request->file('file')->store('bukti', 'public');
    return response()->json(['success' => true, 'data' => ['path' => $path, 'url' => asset('storage/' . $path)]]);
});
Route::post('/upload/foto-profil', function (\Illuminate\Http\Request $request) {
    $request->validate(['file' => 'required|file|image|max:5120']);
    $path = $request->file('file')->store('profil', 'public');
    return response()->json(['success' => true, 'data' => ['path' => $path, 'url' => asset('storage/' . $path)]]);
});
Route::post('/upload/dokumen', function (\Illuminate\Http\Request $request) {
    $request->validate(['file' => 'required|file|max:10240']);
    $path = $request->file('file')->store('dokumen', 'public');
    return response()->json(['success' => true, 'data' => ['path' => $path, 'url' => asset('storage/' . $path)]]);
});

// =========================================================
// MATA PELAJARAN (Subjects)
// =========================================================
Route::get('/mata-pelajaran', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\MataPelajaran::orderBy('urutan')->orderBy('nama');
    if ($request->filled('program_id')) $query->where('program_id', $request->program_id);
    return response()->json(['success' => true, 'data' => $query->get()]);
});

Route::post('/mata-pelajaran', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'kode'       => 'required|string|max:20',
        'nama'       => 'required|string',
        'deskripsi'  => 'nullable|string',
        'program_id' => 'nullable|string',
        'urutan'     => 'nullable|integer',
    ]);
    $mp = \App\Models\MataPelajaran::create(array_merge($data, ['id' => \Illuminate\Support\Str::uuid()]));
    return response()->json(['success' => true, 'data' => $mp], 201);
});

Route::put('/mata-pelajaran/{id}', function (\Illuminate\Http\Request $request, string $id) {
    $mp = \App\Models\MataPelajaran::find($id);
    if (!$mp) return response()->json(['success' => false, 'message' => 'Tidak ditemukan'], 404);
    $mp->update($request->only(['kode', 'nama', 'deskripsi', 'program_id', 'urutan']));
    return response()->json(['success' => true, 'data' => $mp]);
});

Route::delete('/mata-pelajaran/{id}', function (string $id) {
    \App\Models\MataPelajaran::destroy($id);
    return response()->json(['success' => true]);
});

// =========================================================
// NILAI (Grades)
// =========================================================
Route::get('/nilai', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\Nilai::with(['mataPelajaran', 'pendaftar']);
    if ($request->filled('pendaftar_id')) $query->where('pendaftar_id', $request->pendaftar_id);
    if ($request->filled('mata_pelajaran_id')) $query->where('mata_pelajaran_id', $request->mata_pelajaran_id);
    if ($request->filled('tipe_nilai')) $query->where('tipe_nilai', $request->tipe_nilai);
    return response()->json(['success' => true, 'data' => $query->get()]);
});

Route::post('/nilai', function (\Illuminate\Http\Request $request) {
    $data = $request->validate([
        'pendaftar_id'      => 'required|string',
        'mata_pelajaran_id' => 'nullable|string',
        'tipe_nilai'        => 'required|in:mata_pelajaran,pretest,posttest,kehadiran',
        'nilai'             => 'required|numeric|min:0|max:100',
        'catatan'           => 'nullable|string',
        'tanggal'           => 'nullable|date',
    ]);
    $n = \App\Models\Nilai::create(array_merge($data, ['id' => \Illuminate\Support\Str::uuid()]));
    return response()->json(['success' => true, 'data' => $n], 201);
});

Route::put('/nilai/{id}', function (\Illuminate\Http\Request $request, string $id) {
    $n = \App\Models\Nilai::find($id);
    if (!$n) return response()->json(['success' => false, 'message' => 'Tidak ditemukan'], 404);
    $n->update($request->only(['nilai', 'catatan', 'tanggal']));
    return response()->json(['success' => true, 'data' => $n]);
});

Route::delete('/nilai/{id}', function (string $id) {
    \App\Models\Nilai::destroy($id);
    return response()->json(['success' => true]);
});

// Bulk upsert nilai for a batch (used when saving a whole row at once)
Route::post('/nilai/bulk', function (\Illuminate\Http\Request $request) {
    $request->validate(['data' => 'required|array', 'data.*.pendaftar_id' => 'required|string', 'data.*.tipe_nilai' => 'required|string', 'data.*.nilai' => 'required|numeric']);
    foreach ($request->data as $item) {
        \App\Models\Nilai::updateOrCreate(
            [
                'pendaftar_id'      => $item['pendaftar_id'],
                'mata_pelajaran_id' => $item['mata_pelajaran_id'] ?? null,
                'tipe_nilai'        => $item['tipe_nilai'],
            ],
            array_merge($item, ['id' => \Illuminate\Support\Str::uuid()])
        );
    }
    return response()->json(['success' => true, 'message' => 'Nilai tersimpan']);
});

// =========================================================
// ABSENSI — query peserta + nilai untuk cetak
// =========================================================
Route::get('/absensi', function (\Illuminate\Http\Request $request) {
    // Peserta angkatan yang sudah lulus / sudah bekerja tetap tercatat
    // sebagai anggota angkatan sehingga tetap muncul di rekap.
    $query = \App\Models\Pendaftar::with(['angkatan', 'program'])
        ->whereIn('status', ['diterima', 'lulus', 'sudah_bekerja']);

    if ($request->filled('angkatan_id')) $query->where('angkatan_id', $request->angkatan_id);
    if ($request->filled('program_id'))  $query->where('program_id', $request->program_id);

    $pesertaList = $query->orderBy('nama_lengkap')->get();

    // Load nilai for these participants
    $pesertaIds = $pesertaList->pluck('id')->toArray();
    $nilaiList = \App\Models\Nilai::whereIn('pendaftar_id', $pesertaIds)->get();

    // Load posttest hasil ujian (auto-fill nilai ujian akhir - highest score wins)
    $hasilPosttest = \App\Models\HasilUjian::whereIn('pendaftar_id', $pesertaIds)
        ->where('tipe', 'posttest')
        ->orderBy('nilai', 'desc')
        ->orderBy('tanggal', 'desc')
        ->get()
        ->groupBy('pendaftar_id')
        ->map(fn($g) => $g->first());

    $hasilPretest = \App\Models\HasilUjian::whereIn('pendaftar_id', $pesertaIds)
        ->where('tipe', 'pretest')
        ->orderBy('nilai', 'desc')
        ->orderBy('tanggal', 'desc')
        ->get()
        ->groupBy('pendaftar_id')
        ->map(fn($g) => $g->first());

    // Kehadiran %
    $kehadiranData = \App\Models\Kehadiran::whereIn('pendaftar_id', $pesertaIds)
        ->get()
        ->groupBy('pendaftar_id');

    return response()->json([
        'success' => true,
        'data' => [
            'peserta'          => $pesertaList,
            'nilai'            => $nilaiList,
            'hasil_posttest'   => $hasilPosttest,
            'hasil_pretest'    => $hasilPretest,
            'kehadiran'        => $kehadiranData->map(fn($k) => [
                'total'   => $k->count(),
                'hadir'   => $k->where('status_kehadiran', 'Hadir')->count(),
                'persen'  => $k->count() > 0 ? round(($k->where('status_kehadiran', 'Hadir')->count() / $k->count()) * 100) : 0,
            ]),
        ],
    ]);
});

// =========================================================
// KEHADIRAN (Attendance)
// =========================================================
Route::get('/kehadiran', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\Kehadiran::with('pendaftar');
    if ($request->filled('pendaftar_id')) $query->where('pendaftar_id', $request->pendaftar_id);
    if ($request->filled('tanggal')) $query->whereDate('tanggal', $request->tanggal);
    if ($request->filled('angkatan_id')) {
        $query->whereHas('pendaftar', function ($q) use ($request) {
            $q->where('angkatan_id', $request->angkatan_id);
        });
    }
    return response()->json(['success' => true, 'data' => $query->get()]);
});

Route::post('/kehadiran/bulk', function (\Illuminate\Http\Request $request) {
    $request->validate([
        'data' => 'required|array',
        'data.*.pendaftar_id' => 'required|string',
        'data.*.status_kehadiran' => 'required|in:Hadir,Izin,Sakit,Alpha',
    ]);
    $defaultDate = $request->input('tanggal', now()->toDateTimeString());
    foreach ($request->data as $item) {
        $rawDate = $item['tanggal'] ?? $defaultDate;
        $date = \Carbon\Carbon::parse($rawDate)->format('Y-m-d H:i:s');
        $dateOnly = \Carbon\Carbon::parse($rawDate)->toDateString();

        $existing = \App\Models\Kehadiran::where('pendaftar_id', $item['pendaftar_id'])
            ->whereDate('tanggal', $dateOnly)
            ->first();

        if ($existing) {
            $existing->update([
                'status_kehadiran' => $item['status_kehadiran'],
                'catatan'          => $item['catatan'] ?? null,
            ]);
        } else {
            \App\Models\Kehadiran::create([
                'id'               => (string) \Illuminate\Support\Str::uuid(),
                'pendaftar_id'     => $item['pendaftar_id'],
                'tanggal'          => $date,
                'status_kehadiran' => $item['status_kehadiran'],
                'catatan'          => $item['catatan'] ?? null,
            ]);
        }
    }
    return response()->json(['success' => true, 'message' => 'Kehadiran berhasil disimpan']);
});


