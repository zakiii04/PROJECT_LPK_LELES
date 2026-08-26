<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SoalUjian;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SoalUjianController extends Controller
{
    public function index(Request $request)
    {
        $q = SoalUjian::query();
        if ($request->tipe)       $q->where('tipe', $request->tipe);
        if ($request->program_id) $q->where('program_id', $request->program_id);
        return response()->json(['success' => true, 'data' => $q->get()]);
    }

    public function random(Request $request)
    {
        $request->validate([
            'tipe'       => 'required|in:pretest,posttest',
            'program_id' => 'required|string',
            'jumlah'     => 'sometimes|integer|min:1|max:50',
        ]);
        $jumlah = $request->jumlah ?? 10;
        $soal = SoalUjian::where('tipe', $request->tipe)
            ->where(function ($q) use ($request) {
                $q->where('program_id', $request->program_id)->orWhere('jenis_pelatihan', 'Semua');
            })->inRandomOrder()->limit($jumlah)->get()->makeHidden('jawaban_benar');
        return response()->json(['success' => true, 'data' => $soal]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'jenis_pelatihan' => 'required|string',
            'tipe'            => 'required|in:pretest,posttest',
            'pertanyaan'      => 'required|string',
            'opsi'            => 'required|array|size:4',
            'jawaban_benar'   => 'required|integer|min:0|max:3',
            'program_id'      => 'nullable|exists:program_pelatihans,id',
        ]);
        $v['id'] = Str::uuid()->toString();
        $soal = SoalUjian::create($v);
        return response()->json(['success' => true, 'message' => 'Soal ditambahkan.', 'data' => $soal], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => SoalUjian::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $soal = SoalUjian::findOrFail($id);
        $soal->update($request->only(['pertanyaan', 'opsi', 'jawaban_benar', 'tipe', 'jenis_pelatihan', 'program_id']));
        return response()->json(['success' => true, 'message' => 'Soal diupdate.', 'data' => $soal]);
    }

    public function destroy(string $id)
    {
        SoalUjian::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Soal dihapus.']);
    }

    public function byProgram(string $programId)
    {
        $soal = SoalUjian::where('program_id', $programId)->orWhere('jenis_pelatihan', 'Semua')->get();
        return response()->json(['success' => true, 'data' => $soal]);
    }
}
