<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kehadiran;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KehadiranController extends Controller
{
    public function index(Request $request)
    {
        $q = Kehadiran::with('pendaftar');
        if ($request->pendaftar_id) $q->where('pendaftar_id', $request->pendaftar_id);
        if ($request->tanggal)      $q->whereDate('tanggal', $request->tanggal);
        return response()->json(['success' => true, 'data' => $q->orderByDesc('tanggal')->get()]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'pendaftar_id'     => 'required|exists:pendaftars,id',
            'tanggal'          => 'required|date',
            'status_kehadiran' => 'required|in:Hadir,Izin,Sakit,Alpha',
            'catatan'          => 'nullable|string',
        ]);
        $v['id'] = Str::uuid()->toString();
        $k = Kehadiran::create($v);
        return response()->json(['success' => true, 'message' => 'Kehadiran dicatat.', 'data' => $k], 201);
    }

    public function storeBulk(Request $request)
    {
        $request->validate([
            'tanggal'                 => 'required|date',
            'data'                    => 'required|array|min:1',
            'data.*.pendaftar_id'     => 'required|exists:pendaftars,id',
            'data.*.status_kehadiran' => 'required|in:Hadir,Izin,Sakit,Alpha',
            'data.*.catatan'          => 'nullable|string',
        ]);
        $rows = [];
        foreach ($request->data as $item) {
            $rows[] = [
                'id'               => Str::uuid()->toString(),
                'tanggal'          => $request->tanggal,
                'status_kehadiran' => $item['status_kehadiran'],
                'catatan'          => $item['catatan'] ?? null,
                'pendaftar_id'     => $item['pendaftar_id'],
            ];
        }
        Kehadiran::insert($rows);
        return response()->json(['success' => true, 'message' => count($rows) . ' kehadiran berhasil dicatat.']);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Kehadiran::with('pendaftar')->findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $k = Kehadiran::findOrFail($id);
        $v = $request->validate(['status_kehadiran' => 'required|in:Hadir,Izin,Sakit,Alpha', 'catatan' => 'nullable|string']);
        $k->update($v);
        return response()->json(['success' => true, 'message' => 'Kehadiran diupdate.', 'data' => $k]);
    }

    public function destroy(string $id)
    {
        Kehadiran::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Kehadiran dihapus.']);
    }

    public function byPendaftar(string $pendaftarId)
    {
        $data  = Kehadiran::where('pendaftar_id', $pendaftarId)->orderBy('tanggal')->get();
        $total = $data->count();
        $hadir = $data->where('status_kehadiran', 'Hadir')->count();
        return response()->json([
            'success' => true,
            'data'    => $data,
            'rekap'   => [
                'total'      => $total,
                'hadir'      => $hadir,
                'persentase' => $total ? round($hadir / $total * 100, 2) : 0
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $pendaftar = $user->pendaftar;
        if (! $pendaftar) return response()->json(['success' => false, 'message' => 'Data pendaftar tidak ditemukan.'], 404);
        $data = Kehadiran::where('pendaftar_id', $pendaftar->id)->orderBy('tanggal')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }
}
