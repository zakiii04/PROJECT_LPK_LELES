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
        'initialPendaftarList' => Pendaftar::with(['program', 'angkatan', 'user', 'cicilan', 'tagihan.pembayarans.paymentMethod'])->latest('tanggal_daftar')->get(),
        'initialJadwalList'    => JadwalPelatihan::with('peserta')->get(),
        'initialSoalList'      => SoalUjian::all(),
        'initialProgramList'   => ProgramPelatihan::all(),
        'initialAngkatanList'  => Angkatan::with(['program', 'pendaftar'])->withCount('pendaftar')->get(),
        'initialTempatList'    => TempatPelatihan::all(),
        'initialPaymentMethods'=> PaymentMethod::all(),
    ]);
});

Route::get('/admin/peserta/{id}', function ($id) {
    $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'interview', 'cicilan', 'kelulusan'])->find($id);
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
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'cicilan', 'tagihan.pembayarans.paymentMethod'])->where('user_id', $user->id)->first();
    }
    if (!$pendaftar) {
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'cicilan', 'tagihan.pembayarans.paymentMethod'])->latest('tanggal_daftar')->first();
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
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'cicilan'])->where('user_id', $user->id)->first();
    }
    if (!$pendaftar) {
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'user', 'cicilan'])->latest('tanggal_daftar')->first();
    }

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

// Tempat Pelatihan
Route::get('/tempat', [TempatPelatihanController::class, 'index']);
Route::get('/tempat/{id}', [TempatPelatihanController::class, 'show']);
Route::post('/tempat', [TempatPelatihanController::class, 'store']);
Route::put('/tempat/{id}', [TempatPelatihanController::class, 'update']);
Route::delete('/tempat/{id}', [TempatPelatihanController::class, 'destroy']);

// Pendaftar
Route::get('/pendaftar/me', function (\Illuminate\Http\Request $request) {
    $user = $request->user() ?? auth()->user();
    $pendaftar = null;
    if ($user) {
        $pendaftar = \App\Models\Pendaftar::with(['program', 'angkatan', 'user', 'cicilan'])->where('user_id', $user->id)->first();
    }
    if (!$pendaftar) {
        $pendaftar = \App\Models\Pendaftar::with(['program', 'angkatan', 'user', 'cicilan'])->latest('tanggal_daftar')->first();
    }
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
    if (!$pendaftar) {
        $pendaftar = \App\Models\Pendaftar::latest('tanggal_daftar')->first();
    }
    if (!$pendaftar || $pendaftar->status !== 'diterima' || empty($pendaftar->angkatan_id)) {
        return response()->json(['success' => true, 'data' => []]);
    }

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
    $pendaftar = null;
    if ($user) {
        $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    }
    if (!$pendaftar) {
        $pendaftar = \App\Models\Pendaftar::latest('tanggal_daftar')->first();
    }
    if (!$pendaftar) return response()->json(['success' => true, 'data' => []]);

    $data = \App\Models\Kehadiran::where('pendaftar_id', $pendaftar->id)->get();
    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/pendaftar/me/kelulusan', function (\Illuminate\Http\Request $request) {
    $user = $request->user() ?? auth()->user();
    $pendaftar = null;
    if ($user) {
        $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    }
    if (!$pendaftar) {
        $pendaftar = \App\Models\Pendaftar::latest('tanggal_daftar')->first();
    }
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
Route::patch('/pendaftar/{id}/angkatan', [PendaftarController::class, 'alokasiAngkatan']);
Route::delete('/pendaftar/{id}', [PendaftarController::class, 'destroy']);

// Jadwal Pelatihan
Route::get('/jadwal', [JadwalPelatihanController::class, 'index']);
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
    return response()->json(['success' => true, 'data' => $query->get()]);
});

Route::get('/soal/random', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\SoalUjian::query();
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
    ]);

    if ($request->hasFile('gambar_soal')) {
        $path = $request->file('gambar_soal')->store('soal', 'public');
        $data['gambar_soal'] = asset('storage/' . $path);
    }

    if (is_string($data['opsi'] ?? null)) {
        $data['opsi'] = json_decode($data['opsi'], true);
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
    ]);

    if ($request->hasFile('gambar_soal')) {
        $path = $request->file('gambar_soal')->store('soal', 'public');
        $data['gambar_soal'] = asset('storage/' . $path);
    }

    if (isset($data['opsi']) && is_string($data['opsi'])) {
        $data['opsi'] = json_decode($data['opsi'], true);
    }

    $soal->update($data);
    return response()->json(['success' => true, 'data' => $soal]);
});

Route::delete('/soal/{id}', function (string $id) {
    $soal = \App\Models\SoalUjian::find($id);
    if (!$soal) return response()->json(['success' => false, 'message' => 'Soal tidak ditemukan'], 404);
    $soal->delete();
    return response()->json(['success' => true, 'message' => 'Soal berhasil dihapus']);
});

// Ujian routes (peserta)
Route::get('/ujian/mulai', function (\Illuminate\Http\Request $request) {
    $query = \App\Models\SoalUjian::query();
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

    // Fallback: if no specific program soal found, return any soal with that tipe
    if ($soals->isEmpty() && $request->filled('tipe')) {
        $soals = \App\Models\SoalUjian::where('tipe', $request->tipe)->inRandomOrder()->limit($jumlah)->get();
    }
    // Fallback 2: if still empty, return any available soal
    if ($soals->isEmpty()) {
        $soals = \App\Models\SoalUjian::inRandomOrder()->limit($jumlah)->get();
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

    // 1. Resolve real pendaftar
    $pendaftar = null;
    if (!empty($data['pendaftar_id'])) {
        $pendaftar = \App\Models\Pendaftar::find($data['pendaftar_id']);
    }
    if (!$pendaftar && auth()->check()) {
        $pendaftar = \App\Models\Pendaftar::where('user_id', auth()->id())->first();
    }
    if (!$pendaftar) {
        $pendaftar = \App\Models\Pendaftar::latest('tanggal_daftar')->first();
    }
    if (!$pendaftar) {
        return response()->json([
            'success' => false,
            'message' => 'Data peserta tidak ditemukan. Silakan login kembali.',
        ], 404);
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

    // 3. Grade answers
    $soalIds = collect($data['jawaban'])->pluck('soal_id')->toArray();
    $soalList = \App\Models\SoalUjian::whereIn('id', $soalIds)->get()->keyBy('id');

    $benar = 0;
    $salah = 0;
    foreach ($data['jawaban'] as $item) {
        $soal = $soalList->get($item['soal_id']);
        if ($soal && (int)$item['jawaban'] === (int)$soal->jawaban_benar) {
            $benar++;
        } else {
            $salah++;
        }
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
        'pendaftar_id' => $pendaftar->id,
        'tanggal'      => now(),
    ]);

    // 5. Calculate and store best score (nilai tertinggi)
    $prevMaxNilai = $existingAttempts->max('nilai') ?? 0;
    $bestNilai = max($prevMaxNilai, $nilai);

    // Update into Nilai table so certificate and transcripts use highest score
    \App\Models\Nilai::updateOrCreate(
        [
            'pendaftar_id'      => $pendaftar->id,
            'tipe_nilai'        => $data['tipe'],
            'mata_pelajaran_id' => null,
        ],
        [
            'nilai'   => $bestNilai,
            'tanggal' => now(),
            'catatan' => 'Ujian ' . ucfirst($data['tipe']) . ' (Nilai Tertinggi dari ' . ($existingAttempts->count() + 1) . 'x percobaan)',
        ]
    );

    return response()->json([
        'success'     => true,
        'data'        => $hasil,
        'best_nilai'  => $bestNilai,
        'attempt'     => $existingAttempts->count() + 1,
        'max_attempt' => 3,
    ]);
});

Route::get('/pendaftar/me/ujian', function () {
    $user = auth()->user();
    $pendaftar = null;
    if ($user) {
        $pendaftar = \App\Models\Pendaftar::where('user_id', $user->id)->first();
    }
    if (!$pendaftar) {
        $pendaftar = \App\Models\Pendaftar::latest('tanggal_daftar')->first();
    }
    if (!$pendaftar) return response()->json(['success' => true, 'data' => []]);

    $list = \App\Models\HasilUjian::where('pendaftar_id', $pendaftar->id)
        ->orderBy('nilai', 'desc')
        ->orderBy('tanggal', 'desc')
        ->get();

    return response()->json(['success' => true, 'data' => $list]);
});

Route::get('/hasil-ujian', function () {
    $list = \App\Models\HasilUjian::orderBy('nilai', 'desc')->orderBy('tanggal', 'desc')->get();
    return response()->json(['success' => true, 'data' => $list]);
});

// Pembayaran routes
Route::get('/pendaftar/{id}/pembayaran', [PembayaranController::class, 'info']);
Route::post('/pendaftar/{id}/pembayaran', [PembayaranController::class, 'store']);
Route::patch('/pendaftar/{id}/pembayaran/verifikasi', [PembayaranController::class, 'verify']);
Route::patch('/pendaftar/{id}/pembayaran/tolak', [PembayaranController::class, 'reject']);
Route::patch('/pembayaran/{id}/verifikasi', [PembayaranController::class, 'verifyTransaction']);
Route::patch('/pembayaran/{id}/tolak', [PembayaranController::class, 'rejectTransaction']);

// Cicilan routes
Route::get('/pendaftar/{id}/cicilan', [PendaftarController::class, 'getCicilan']);
Route::post('/pendaftar/{id}/cicilan', [PendaftarController::class, 'createCicilan']);
Route::patch('/cicilan/{id}/bayar', function (\Illuminate\Http\Request $request, string $id) {
    $cicilan = \App\Models\Cicilan::find($id);
    if (!$cicilan) return response()->json(['success' => false, 'message' => 'Cicilan tidak ditemukan'], 404);

    if ($request->hasFile('bukti_pembayaran')) {
        $path = $request->file('bukti_pembayaran')->store('bukti', 'public');
        $cicilan->bukti_pembayaran = asset('storage/' . $path);
    }
    if ($request->filled('metode_pembayaran')) {
        $cicilan->metode_pembayaran = $request->metode_pembayaran;
    }
    $cicilan->status = 'menunggu_konfirmasi';
    $cicilan->tanggal_bayar = now();
    $cicilan->save();

    return response()->json(['success' => true, 'data' => $cicilan]);
});

Route::patch('/cicilan/{id}/verifikasi', function (string $id) {
    $cicilan = \App\Models\Cicilan::find($id);
    if (!$cicilan) return response()->json(['success' => false, 'message' => 'Cicilan tidak ditemukan'], 404);
    $cicilan->update(['status' => 'lunas', 'tanggal_verifikasi' => now()]);

    // Cek apakah semua cicilan lunas
    $allCicilan = \App\Models\Cicilan::where('pendaftar_id', $cicilan->pendaftar_id)->get();
    $semuaLunas = $allCicilan->every(fn($c) => $c->status === 'lunas');
    if ($semuaLunas) {
        \App\Models\Pendaftar::where('id', $cicilan->pendaftar_id)->update(['status_pembayaran' => 'lunas']);
    } else {
        \App\Models\Pendaftar::where('id', $cicilan->pendaftar_id)->update(['status_pembayaran' => 'cicilan_sebagian']);
    }

    return response()->json(['success' => true, 'message' => 'Cicilan diverifikasi']);
});

Route::patch('/cicilan/{id}/tolak', function (\Illuminate\Http\Request $request, string $id) {
    $cicilan = \App\Models\Cicilan::find($id);
    if (!$cicilan) return response()->json(['success' => false, 'message' => 'Cicilan tidak ditemukan'], 404);
    $cicilan->update([
        'status'        => 'ditolak',
        'catatan_admin' => $request->input('catatan'),
    ]);
    return response()->json(['success' => true, 'message' => 'Cicilan ditolak']);
});

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
    $query = \App\Models\Pendaftar::with(['angkatan', 'program'])
        ->where('status', 'diterima');

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


