<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelulusan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KelulusanController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Kelulusan::with('pendaftar')->get()]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'pendaftar_id'     => 'required|exists:pendaftars,id|unique:kelulusans,pendaftar_id',
            'nilai_pretest'    => 'required|numeric',
            'nilai_posttest'   => 'required|numeric',
            'nilai_kehadiran'  => 'required|numeric',
            'nilai_tugas'      => 'required|numeric',
            'nilai_akhir'      => 'required|numeric',
            'status_kelulusan' => 'required|in:Lulus,Tidak_Lulus,Dalam_Proses',
            'tanggal_lulus'    => 'required|string',
        ]);
        $count = Kelulusan::count() + 1;
        $v['id']            = Str::uuid()->toString();
        $v['no_sertifikat'] = 'SERT-LPK-' . date('Y') . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
        return response()->json(['success' => true, 'message' => 'Data kelulusan disimpan.', 'data' => Kelulusan::create($v)], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Kelulusan::with('pendaftar')->findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $k = Kelulusan::findOrFail($id);
        $k->update($request->only(['nilai_pretest', 'nilai_posttest', 'nilai_kehadiran', 'nilai_tugas', 'nilai_akhir', 'status_kelulusan', 'tanggal_lulus']));
        return response()->json(['success' => true, 'message' => 'Kelulusan diupdate.', 'data' => $k]);
    }

    public function byPendaftar(string $pendaftarId)
    {
        return response()->json(['success' => true, 'data' => Kelulusan::where('pendaftar_id', $pendaftarId)->first()]);
    }

    public function me(Request $request)
    {
        $pendaftar = $request->user()->pendaftar;
        if (! $pendaftar) return response()->json(['success' => false, 'message' => 'Tidak ditemukan.'], 404);
        return response()->json(['success' => true, 'data' => Kelulusan::where('pendaftar_id', $pendaftar->id)->first()]);
    }
}
