<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cicilan;
use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CicilanController extends Controller
{
    public function index(string $pendaftarId)
    {
        return response()->json(['success' => true, 'data' => Cicilan::where('pendaftar_id', $pendaftarId)->orderBy('termin')->get()]);
    }

    public function store(Request $request, string $pendaftarId)
    {
        $request->validate([
            'jumlah_per_termin' => 'required|numeric',
            'jumlah_termin'     => 'required|integer|in:2,3',
        ]);
        Pendaftar::findOrFail($pendaftarId);
        $rows = [];
        for ($i = 1; $i <= $request->jumlah_termin; $i++) {
            $rows[] = [
                'id'           => Str::uuid()->toString(),
                'termin'       => $i,
                'jumlah'       => $request->jumlah_per_termin,
                'jatuh_tempo'  => now()->addMonths($i),
                'status'       => 'belum_bayar',
                'pendaftar_id' => $pendaftarId,
            ];
        }
        Cicilan::insert($rows);
        return response()->json(['success' => true, 'message' => $request->jumlah_termin . ' termin cicilan dibuat.', 'data' => $rows], 201);
    }

    public function uploadBukti(Request $request, string $id)
    {
        $request->validate([
            'bukti'             => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'metode_pembayaran' => 'required|string',
        ]);
        $cicilan = Cicilan::findOrFail($id);
        $path = $request->file('bukti')->store('bukti/cicilan', 'public');
        $cicilan->update([
            'bukti_pembayaran'  => $path,
            'metode_pembayaran' => $request->metode_pembayaran,
            'tanggal_bayar'     => now(),
            'status'            => 'menunggu_konfirmasi',
        ]);
        return response()->json(['success' => true, 'message' => 'Bukti cicilan diunggah.', 'data' => $cicilan]);
    }

    public function verifikasi(string $id)
    {
        $c = Cicilan::findOrFail($id);
        $c->update(['status' => 'lunas', 'tanggal_verifikasi' => now()]);
        $pendaftar = $c->pendaftar;
        $totalCicilan = Cicilan::where('pendaftar_id', $pendaftar->id)->count();
        $lunasCount   = Cicilan::where('pendaftar_id', $pendaftar->id)->where('status', 'lunas')->count();
        if ($lunasCount === $totalCicilan) {
            $pendaftar->update(['status_pembayaran' => 'lunas']);
        } else {
            $pendaftar->update(['status_pembayaran' => 'cicilan_sebagian']);
        }
        return response()->json(['success' => true, 'message' => 'Cicilan termin ' . $c->termin . ' dikonfirmasi lunas.']);
    }

    public function tolak(Request $request, string $id)
    {
        $c = Cicilan::findOrFail($id);
        $c->update(['status' => 'ditolak', 'catatan_admin' => $request->catatan, 'bukti_pembayaran' => null]);
        return response()->json(['success' => true, 'message' => 'Cicilan ditolak.']);
    }
}
