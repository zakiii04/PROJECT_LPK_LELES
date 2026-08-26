<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function buktiPembayaran(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120']);
        $path = $request->file('file')->store('bukti/pembayaran', 'public');
        return response()->json(['success' => true, 'path' => $path, 'url' => asset('storage/' . $path)]);
    }

    public function fotoProfil(Request $request)
    {
        $request->validate(['file' => 'required|image|mimes:jpg,jpeg,png|max:2048']);
        $path = $request->file('file')->store('foto/profil', 'public');
        return response()->json(['success' => true, 'path' => $path, 'url' => asset('storage/' . $path)]);
    }

    public function dokumen(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240']);
        $path = $request->file('file')->store('dokumen', 'public');
        return response()->json(['success' => true, 'path' => $path, 'url' => asset('storage/' . $path)]);
    }
}
