<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Interview;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InterviewController extends Controller
{
    public function index()
    {
        $data = Interview::with('pendaftar')->orderByDesc('tanggal_interview')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'pendaftar_id'      => 'required|exists:pendaftars,id|unique:interviews,pendaftar_id',
            'tanggal_interview' => 'required|date',
            'pewawancara'       => 'required|string',
            'skor_komunikasi'   => 'required|integer|min:0|max:100',
            'skor_sikap'        => 'required|integer|min:0|max:100',
            'skor_kesiapan'     => 'required|integer|min:0|max:100',
            'catatan'           => 'nullable|string',
            'status'            => 'required|in:Lulus,Pertimbangan,Tidak Lulus',
        ]);
        $v['id']         = Str::uuid()->toString();
        $v['skor_total'] = round(($v['skor_komunikasi'] + $v['skor_sikap'] + $v['skor_kesiapan']) / 3, 2);
        $interview       = Interview::create($v);
        return response()->json(['success' => true, 'message' => 'Data interview berhasil disimpan.', 'data' => $interview], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Interview::with('pendaftar')->findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $interview = Interview::findOrFail($id);
        $v = $request->validate([
            'skor_komunikasi' => 'sometimes|integer|min:0|max:100',
            'skor_sikap'      => 'sometimes|integer|min:0|max:100',
            'skor_kesiapan'   => 'sometimes|integer|min:0|max:100',
            'catatan'         => 'nullable|string',
            'status'          => 'sometimes|in:Lulus,Pertimbangan,Tidak Lulus',
        ]);
        if (isset($v['skor_komunikasi']) || isset($v['skor_sikap']) || isset($v['skor_kesiapan'])) {
            $kom = $v['skor_komunikasi'] ?? $interview->skor_komunikasi;
            $sik = $v['skor_sikap']      ?? $interview->skor_sikap;
            $kes = $v['skor_kesiapan']   ?? $interview->skor_kesiapan;
            $v['skor_total'] = round(($kom + $sik + $kes) / 3, 2);
        }
        $interview->update($v);
        return response()->json(['success' => true, 'message' => 'Data interview diupdate.', 'data' => $interview]);
    }

    public function destroy(string $id)
    {
        Interview::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Data interview dihapus.']);
    }

    public function byPendaftar(string $pendaftarId)
    {
        $interview = Interview::where('pendaftar_id', $pendaftarId)->first();
        return response()->json(['success' => true, 'data' => $interview]);
    }
}
