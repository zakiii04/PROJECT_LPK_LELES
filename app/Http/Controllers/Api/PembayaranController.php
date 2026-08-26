<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pendaftar;
use Illuminate\Http\Request;

class PembayaranController extends Controller
{
    public function show(string $pendaftarId)
    {
        $p = Pendaftar::with('cicilan')->findOrFail($pendaftarId);
        return response()->json([
            'success' => true,
            'data'    => [
                'status_pembayaran' => $p->status_pembayaran,
                'jenis_pembayaran'  => $p->jenis_pembayaran,
                'biaya_pelatihan'   => $p->biaya_pelatihan,
                'bukti_pembayaran'  => $p->bukti_pembayaran,
                'tanggal_bayar'     => $p->tanggal_bayar,
                'cicilan'           => $p->cicilan,
            ]
        ]);
    }

    public function uploadBukti(Request $request, string $pendaftarId)
    {
        $request->validate([
            'bukti'             => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'metode_pembayaran' => 'required|string',
        ]);
        $pendaftar = Pendaftar::findOrFail($pendaftarId);
        $path = $request->file('bukti')->store('bukti/pembayaran', 'public');
        $pendaftar->update([
            'bukti_pembayaran'  => $path,
            'metode_pembayaran' => $request->metode_pembayaran,
            'tanggal_bayar'     => now(),
            'status_pembayaran' => 'menunggu_konfirmasi',
        ]);
        return response()->json(['success' => true, 'message' => 'Bukti pembayaran berhasil diunggah.', 'data' => $pendaftar]);
    }

    public function verifikasi(string $pendaftarId)
    {
        $pendaftar = Pendaftar::findOrFail($pendaftarId);
        $pendaftar->update(['status_pembayaran' => 'lunas']);
        return response()->json(['success' => true, 'message' => 'Pembayaran dikonfirmasi lunas.']);
    }

    public function tolak(Request $request, string $pendaftarId)
    {
        $pendaftar = Pendaftar::findOrFail($pendaftarId);
        $pendaftar->update(['status_pembayaran' => 'belum_bayar', 'bukti_pembayaran' => null]);
        return response()->json(['success' => true, 'message' => 'Bukti pembayaran ditolak.']);
    }
}
