<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelulusan;

class SertifikatController extends Controller
{
    public function verify(string $noSertifikat)
    {
        $k = Kelulusan::with('pendaftar')->where('no_sertifikat', $noSertifikat)->first();
        if (! $k) return response()->json(['success' => false, 'message' => 'Sertifikat tidak valid atau tidak ditemukan.'], 404);
        return response()->json(['success' => true, 'message' => 'Sertifikat valid.', 'data' => $k]);
    }

    public function download(string $noSertifikat)
    {
        $k = Kelulusan::with('pendaftar')->where('no_sertifikat', $noSertifikat)->firstOrFail();
        return response()->json(['success' => true, 'message' => 'Download sertifikat.', 'data' => $k]);
    }
}
