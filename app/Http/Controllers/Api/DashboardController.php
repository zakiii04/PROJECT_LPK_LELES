<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Angkatan;
use App\Models\Kelulusan;
use App\Models\Pendaftar;
use App\Models\ProgramPelatihan;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        return response()->json(['success' => true, 'data' => [
            'total_pendaftar'       => Pendaftar::count(),
            'total_diterima'        => Pendaftar::where('status', 'diterima')->count(),
            'total_menunggu'        => Pendaftar::where('status', 'menunggu')->count(),
            'total_ditolak'         => Pendaftar::where('status', 'ditolak')->count(),
            'total_angkatan_aktif'  => Angkatan::where('status', 'On_Going')->count(),
            'total_program'         => ProgramPelatihan::count(),
            'peserta_lunas'         => Pendaftar::where('status_pembayaran', 'lunas')->count(),
            'peserta_cicilan'       => Pendaftar::where('status_pembayaran', 'cicilan_sebagian')->count(),
            'peserta_belum_bayar'   => Pendaftar::where('status_pembayaran', 'belum_bayar')->count(),
            'total_kelulusan_lulus' => Kelulusan::where('status_kelulusan', 'Lulus')->count(),
        ]]);
    }

    public function pendaftarPerBulan()
    {
        $data = DB::table('pendaftars')->selectRaw('YEAR(tanggal_daftar) as tahun, MONTH(tanggal_daftar) as bulan, COUNT(*) as total')->groupByRaw('YEAR(tanggal_daftar), MONTH(tanggal_daftar)')->orderByRaw('tahun, bulan')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function kelulusanStats()
    {
        $data = Kelulusan::selectRaw('status_kelulusan, COUNT(*) as total')->groupBy('status_kelulusan')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function pembayaranStats()
    {
        $data = Pendaftar::selectRaw('status_pembayaran, COUNT(*) as total')->groupBy('status_pembayaran')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function kehadiranStats()
    {
        $data = DB::table('kehadirans')->selectRaw('status_kehadiran, COUNT(*) as total')->groupBy('status_kehadiran')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }
}
