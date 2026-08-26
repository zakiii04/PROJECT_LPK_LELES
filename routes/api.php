<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProgramPelatihanController;
use App\Http\Controllers\Api\AngkatanController;
use App\Http\Controllers\Api\PendaftarController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\CicilanController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\JadwalPelatihanController;
use App\Http\Controllers\Api\KehadiranController;
use App\Http\Controllers\Api\SoalUjianController;
use App\Http\Controllers\Api\UjianController;
use App\Http\Controllers\Api\HasilUjianController;
use App\Http\Controllers\Api\KelulusanController;
use App\Http\Controllers\Api\SertifikatController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UploadController;

/*
|--------------------------------------------------------------------------
| API Routes — LPK Alkautsar
| Base URL: /api/v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // =========================================================
    // 🔓 PUBLIC ROUTES (No Auth Required)
    // =========================================================

    // Auth
    Route::post('auth/login', [AuthController::class, 'login']);

    // Program Pelatihan (publik bisa lihat)
    Route::get('programs', [ProgramPelatihanController::class, 'index']);
    Route::get('programs/{id}', [ProgramPelatihanController::class, 'show']);

    // Pendaftaran baru (publik bisa daftar)
    Route::post('pendaftar', [PendaftarController::class, 'store']);

    // Verifikasi sertifikat (publik)
    Route::get('sertifikat/{no_sertifikat}', [SertifikatController::class, 'verify']);


    // =========================================================
    // 🔐 PROTECTED ROUTES (Bearer Token Required)
    // =========================================================
    Route::middleware('auth:sanctum')->group(function () {

        // ----------------------------------------------------------
        // 1. AUTH
        // ----------------------------------------------------------
        Route::prefix('auth')->group(function () {
            Route::post('logout',          [AuthController::class, 'logout']);
            Route::get('me',               [AuthController::class, 'me']);
            Route::post('refresh',         [AuthController::class, 'refresh']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });


        // ----------------------------------------------------------
        // 2. USER MANAGEMENT — hanya ADMIN
        // ----------------------------------------------------------
        Route::middleware('role:ADMIN')->prefix('users')->group(function () {
            Route::get('/',        [UserController::class, 'index']);
            Route::post('/',       [UserController::class, 'store']);
            Route::get('/{id}',    [UserController::class, 'show']);
            Route::put('/{id}',    [UserController::class, 'update']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });


        // ----------------------------------------------------------
        // 3. PROGRAM PELATIHAN
        // ----------------------------------------------------------
        Route::prefix('programs')->group(function () {
            // ADMIN saja bisa CRUD
            Route::middleware('role:ADMIN')->group(function () {
                Route::post('/',       [ProgramPelatihanController::class, 'store']);
                Route::put('/{id}',    [ProgramPelatihanController::class, 'update']);
                Route::delete('/{id}', [ProgramPelatihanController::class, 'destroy']);
            });

            // ADMIN & HRD bisa lihat angkatan dan soal per program
            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::get('/{id}/angkatan', [AngkatanController::class, 'byProgram']);
            });
            Route::middleware('role:ADMIN,INSTRUKTUR')->group(function () {
                Route::get('/{id}/soal', [SoalUjianController::class, 'byProgram']);
            });
        });


        // ----------------------------------------------------------
        // 4. ANGKATAN
        // ----------------------------------------------------------
        Route::prefix('angkatan')->group(function () {
            Route::get('/',    [AngkatanController::class, 'index']);
            Route::get('/{id}', [AngkatanController::class, 'show']);

            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::post('/',                  [AngkatanController::class, 'store']);
                Route::put('/{id}',               [AngkatanController::class, 'update']);
                Route::patch('/{id}/status',      [AngkatanController::class, 'updateStatus']);
                Route::get('/{id}/pendaftar',     [PendaftarController::class, 'byAngkatan']);
            });

            Route::middleware('role:ADMIN')->group(function () {
                Route::delete('/{id}', [AngkatanController::class, 'destroy']);
            });
        });


        // ----------------------------------------------------------
        // 5. PENDAFTAR / PESERTA
        // ----------------------------------------------------------
        Route::prefix('pendaftar')->group(function () {
            // Peserta: lihat data diri sendiri
            Route::get('/me',           [PendaftarController::class, 'me']);
            Route::get('/me/kehadiran', [KehadiranController::class, 'me']);
            Route::get('/me/jadwal',    [JadwalPelatihanController::class, 'me']);
            Route::get('/me/ujian',     [HasilUjianController::class, 'me']);
            Route::get('/me/kelulusan', [KelulusanController::class, 'me']);

            // ADMIN & HRD: semua pendaftar
            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::get('/',                      [PendaftarController::class, 'index']);
                Route::get('/{id}',                  [PendaftarController::class, 'show']);
                Route::put('/{id}',                  [PendaftarController::class, 'update']);
                Route::patch('/{id}/status',         [PendaftarController::class, 'updateStatus']);
                Route::patch('/{id}/angkatan',       [PendaftarController::class, 'alokasiAngkatan']);
            });

            Route::middleware('role:ADMIN')->group(function () {
                Route::delete('/{id}', [PendaftarController::class, 'destroy']);
            });

            // Relasi sub-resource per pendaftar
            Route::get('/{id}/pembayaran',   [PembayaranController::class, 'show']);
            Route::get('/{id}/cicilan',      [CicilanController::class, 'index']);
            Route::get('/{id}/interview',    [InterviewController::class, 'byPendaftar']);
            Route::get('/{id}/hasil-ujian',  [HasilUjianController::class, 'byPendaftar']);
            Route::get('/{id}/kehadiran',    [KehadiranController::class, 'byPendaftar']);
            Route::get('/{id}/kelulusan',    [KelulusanController::class, 'byPendaftar']);
        });


        // ----------------------------------------------------------
        // 6. PEMBAYARAN
        // ----------------------------------------------------------
        Route::prefix('pendaftar/{pendaftar_id}/pembayaran')->group(function () {
            // Peserta upload bukti
            Route::post('/', [PembayaranController::class, 'uploadBukti']);

            // ADMIN & HRD verifikasi
            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::patch('/verifikasi', [PembayaranController::class, 'verifikasi']);
                Route::patch('/tolak',      [PembayaranController::class, 'tolak']);
            });
        });

        // 6a. CICILAN
        Route::prefix('pendaftar/{pendaftar_id}/cicilan')->group(function () {
            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::post('/', [CicilanController::class, 'store']);
            });
        });

        Route::prefix('cicilan')->group(function () {
            Route::patch('/{id}/bayar',      [CicilanController::class, 'uploadBukti']);   // PESERTA
            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::patch('/{id}/verifikasi', [CicilanController::class, 'verifikasi']);
                Route::patch('/{id}/tolak',      [CicilanController::class, 'tolak']);
            });
        });


        // ----------------------------------------------------------
        // 7. INTERVIEW / SELEKSI
        // ----------------------------------------------------------
        Route::middleware('role:ADMIN,HRD')->prefix('interview')->group(function () {
            Route::get('/',        [InterviewController::class, 'index']);
            Route::post('/',       [InterviewController::class, 'store']);
            Route::get('/{id}',    [InterviewController::class, 'show']);
            Route::put('/{id}',    [InterviewController::class, 'update']);
            Route::delete('/{id}', [InterviewController::class, 'destroy']);
        });


        // ----------------------------------------------------------
        // 8. JADWAL PELATIHAN
        // ----------------------------------------------------------
        Route::prefix('jadwal')->group(function () {
            Route::get('/', [JadwalPelatihanController::class, 'index']);
            Route::get('/{id}', [JadwalPelatihanController::class, 'show']);

            Route::middleware('role:ADMIN,INSTRUKTUR')->group(function () {
                Route::post('/',                                   [JadwalPelatihanController::class, 'store']);
                Route::put('/{id}',                                [JadwalPelatihanController::class, 'update']);
                Route::post('/{id}/peserta',                       [JadwalPelatihanController::class, 'addPeserta']);
                Route::delete('/{id}/peserta/{pendaftar_id}',      [JadwalPelatihanController::class, 'removePeserta']);
            });

            Route::middleware('role:ADMIN')->group(function () {
                Route::delete('/{id}', [JadwalPelatihanController::class, 'destroy']);
            });
        });


        // ----------------------------------------------------------
        // 9. KEHADIRAN / PRESENSI
        // ----------------------------------------------------------
        Route::prefix('kehadiran')->group(function () {
            Route::middleware('role:ADMIN,INSTRUKTUR')->group(function () {
                Route::get('/',          [KehadiranController::class, 'index']);
                Route::post('/',         [KehadiranController::class, 'store']);
                Route::post('/bulk',     [KehadiranController::class, 'storeBulk']);
                Route::get('/{id}',      [KehadiranController::class, 'show']);
                Route::put('/{id}',      [KehadiranController::class, 'update']);
            });

            Route::middleware('role:ADMIN')->group(function () {
                Route::delete('/{id}',   [KehadiranController::class, 'destroy']);
            });
        });


        // ----------------------------------------------------------
        // 10. BANK SOAL UJIAN
        // ----------------------------------------------------------
        Route::middleware('role:ADMIN,INSTRUKTUR')->prefix('soal')->group(function () {
            Route::get('/',        [SoalUjianController::class, 'index']);
            Route::get('/random',  [SoalUjianController::class, 'random']);
            Route::post('/',       [SoalUjianController::class, 'store']);
            Route::get('/{id}',    [SoalUjianController::class, 'show']);
            Route::put('/{id}',    [SoalUjianController::class, 'update']);
            Route::delete('/{id}', [SoalUjianController::class, 'destroy']);
        });


        // ----------------------------------------------------------
        // 11. UJIAN & HASIL UJIAN
        // ----------------------------------------------------------

        // Peserta: ambil soal & submit jawaban
        Route::middleware('role:PESERTA')->prefix('ujian')->group(function () {
            Route::get('/mulai',   [UjianController::class, 'mulai']);
            Route::post('/submit', [UjianController::class, 'submit']);
        });

        // ADMIN & INSTRUKTUR: lihat semua hasil
        Route::middleware('role:ADMIN,INSTRUKTUR')->prefix('hasil-ujian')->group(function () {
            Route::get('/',     [HasilUjianController::class, 'index']);
            Route::get('/{id}', [HasilUjianController::class, 'show']);
        });


        // ----------------------------------------------------------
        // 12. KELULUSAN & SERTIFIKAT
        // ----------------------------------------------------------
        Route::prefix('kelulusan')->group(function () {
            Route::middleware('role:ADMIN,HRD')->group(function () {
                Route::get('/',        [KelulusanController::class, 'index']);
                Route::post('/',       [KelulusanController::class, 'store']);
                Route::get('/{id}',    [KelulusanController::class, 'show']);
            });

            Route::middleware('role:ADMIN')->group(function () {
                Route::put('/{id}',    [KelulusanController::class, 'update']);
            });
        });

        Route::prefix('sertifikat/{no_sertifikat}')->group(function () {
            Route::get('/download', [SertifikatController::class, 'download']);
        });


        // ----------------------------------------------------------
        // 13. DASHBOARD & STATISTIK — hanya ADMIN & HRD
        // ----------------------------------------------------------
        Route::middleware('role:ADMIN,HRD')->prefix('dashboard')->group(function () {
            Route::get('/summary',            [DashboardController::class, 'summary']);
            Route::get('/pendaftar-per-bulan',[DashboardController::class, 'pendaftarPerBulan']);
            Route::get('/kelulusan-stats',    [DashboardController::class, 'kelulusanStats']);
            Route::get('/pembayaran-stats',   [DashboardController::class, 'pembayaranStats']);
            Route::get('/kehadiran-stats',    [DashboardController::class, 'kehadiranStats']);
        });


        // ----------------------------------------------------------
        // 14. UPLOAD FILE
        // ----------------------------------------------------------
        Route::prefix('upload')->group(function () {
            Route::post('/bukti-pembayaran', [UploadController::class, 'buktiPembayaran']);
            Route::post('/foto-profil',      [UploadController::class, 'fotoProfil']);
            Route::post('/dokumen',          [UploadController::class, 'dokumen']);
        });

    }); // end auth:sanctum
});
