<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HasilUjian;
use Illuminate\Http\Request;

class HasilUjianController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => HasilUjian::with('pendaftar')->orderByDesc('tanggal')->get()]);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => HasilUjian::with('pendaftar')->findOrFail($id)]);
    }

    public function byPendaftar(string $pendaftarId)
    {
        return response()->json(['success' => true, 'data' => HasilUjian::where('pendaftar_id', $pendaftarId)->orderBy('tanggal')->get()]);
    }

    public function me(Request $request)
    {
        $pendaftar = $request->user()->pendaftar;
        if (! $pendaftar) return response()->json(['success' => false, 'message' => 'Tidak ditemukan.'], 404);
        return response()->json(['success' => true, 'data' => HasilUjian::where('pendaftar_id', $pendaftar->id)->get()]);
    }
}
