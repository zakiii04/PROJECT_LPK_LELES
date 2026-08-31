<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HasilUjian;
use App\Models\SoalUjian;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UjianController extends Controller
{
    public function mulai(Request $request)
    {
        $request->validate([
            'tipe'       => 'required|in:pretest,posttest',
            'program_id' => 'required|string',
            'jumlah'     => 'sometimes|integer',
        ]);
        $jumlah = $request->jumlah ?? 10;
        $soal = SoalUjian::where('tipe', $request->tipe)
            ->where(function ($q) use ($request) {
                $q->where('program_id', $request->program_id)->orWhere('jenis_pelatihan', 'Semua');
            })->inRandomOrder()->limit($jumlah)->get()->makeHidden('jawaban_benar');
        return response()->json(['success' => true, 'message' => 'Soal ujian siap.', 'data' => $soal, 'total_soal' => $soal->count()]);
    }

    public function submit(Request $request)
    {
        $request->validate([
            'tipe'               => 'required|in:pretest,posttest',
            'program_id'         => 'required|string',
            'jawaban'            => 'required|array|min:1',
            'jawaban.*.soal_id'  => 'required|exists:soal_ujians,id',
            'jawaban.*.jawaban'  => 'required|integer|min:-1|max:4',
        ]);

        $pendaftar = $request->user()->pendaftar;
        if (! $pendaftar) return response()->json(['success' => false, 'message' => 'Data peserta tidak ditemukan.'], 404);

        $benar = 0;
        $total = count($request->jawaban);

        foreach ($request->jawaban as $item) {
            $soal = SoalUjian::find($item['soal_id']);
            if ($soal && $soal->jawaban_benar === $item['jawaban']) $benar++;
        }

        $salah = $total - $benar;
        $nilai = $total > 0 ? round($benar / $total * 100, 2) : 0;

        $hasil = HasilUjian::create([
            'id'           => Str::uuid()->toString(),
            'tipe'         => $request->tipe,
            'nilai'        => $nilai,
            'benar'        => $benar,
            'salah'        => $salah,
            'total_soal'   => $total,
            'tanggal'      => now(),
            'pendaftar_id' => $pendaftar->id,
        ]);

        return response()->json(['success' => true, 'message' => 'Ujian selesai.', 'data' => $hasil]);
    }
}
