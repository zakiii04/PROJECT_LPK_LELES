<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalPelatihan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JadwalPelatihanController extends Controller
{
    public function index(Request $request)
    {
        $q = JadwalPelatihan::with(['peserta', 'angkatan'])->withCount('peserta');
        if ($request->jenis_sesi)       $q->where('jenis_sesi', $request->jenis_sesi);
        if ($request->jenis_pelatihan)  $q->where('jenis_pelatihan', 'like', '%' . $request->jenis_pelatihan . '%');
        if ($request->tanggal)          $q->where('tanggal', $request->tanggal);
        if ($request->angkatan_id)       $q->where('angkatan_id', $request->angkatan_id);
        if ($request->tempat_pelatihan)  $q->where('tempat_pelatihan', 'like', '%' . $request->tempat_pelatihan . '%');
        
        return response()->json(['success' => true, 'data' => $q->orderBy('hari_ke')->orderBy('tanggal')->get()]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'judul'            => 'required|string',
            'jenis_pelatihan'  => 'required|string',
            'tanggal'          => 'required|string',
            'jam'              => 'required|string',
            'ruangan'          => 'required|string',
            'jenis_sesi'       => 'required|in:Orientasi,Teori,Praktik,Ujian',
            'status'           => 'sometimes|nullable|string',
            'angkatan_id'      => 'nullable|string',
            'hari_ke'          => 'nullable|integer',
            'tempat_pelatihan' => 'nullable|string',
            'pengajar'         => 'nullable|string',
        ]);
        $v['id'] = Str::uuid()->toString();
        $jadwal = JadwalPelatihan::create($v);

        // Jika angkatan_id diisi, otomatis tarik seluruh peserta angkatan tersebut ke jadwal ini
        if (!empty($v['angkatan_id'])) {
            $pendaftarIds = \App\Models\Pendaftar::where('angkatan_id', $v['angkatan_id'])
                ->where('status', 'diterima')
                ->pluck('id');
            if ($pendaftarIds->count() > 0) {
                $jadwal->peserta()->syncWithoutDetaching($pendaftarIds);
            }
        }

        return response()->json(['success' => true, 'message' => 'Jadwal dibuat.', 'data' => $jadwal->load('peserta')], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => JadwalPelatihan::with(['peserta', 'angkatan'])->findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $j = JadwalPelatihan::findOrFail($id);
        $j->update($request->only([
            'judul', 'jenis_pelatihan', 'tanggal', 'jam', 'ruangan',
            'jenis_sesi', 'status', 'angkatan_id', 'hari_ke', 'tempat_pelatihan', 'pengajar'
        ]));
        return response()->json(['success' => true, 'message' => 'Jadwal diupdate.', 'data' => $j->load('peserta')]);
    }

    public function destroy(string $id)
    {
        JadwalPelatihan::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Jadwal dihapus.']);
    }

    public function addPeserta(Request $request, string $id)
    {
        $request->validate([
            'pendaftar_ids'   => 'required|array',
            'pendaftar_ids.*' => 'exists:pendaftars,id',
        ]);
        $jadwal = JadwalPelatihan::findOrFail($id);
        $jadwal->peserta()->syncWithoutDetaching($request->pendaftar_ids);
        return response()->json(['success' => true, 'message' => count($request->pendaftar_ids) . ' peserta ditambahkan ke jadwal.']);
    }

    public function removePeserta(string $id, string $pendaftarId)
    {
        JadwalPelatihan::findOrFail($id)->peserta()->detach($pendaftarId);
        return response()->json(['success' => true, 'message' => 'Peserta dihapus dari jadwal.']);
    }

    public function me(Request $request)
    {
        $pendaftar = $request->user()->pendaftar;
        if (! $pendaftar) return response()->json(['success' => false, 'message' => 'Tidak ditemukan.'], 404);
        return response()->json(['success' => true, 'data' => $pendaftar->jadwal()->orderBy('tanggal')->get()]);
    }
}
