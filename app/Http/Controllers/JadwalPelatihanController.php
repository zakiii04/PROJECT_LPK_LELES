<?php

namespace App\Http\Controllers;

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

        // Tanggal sesi tidak boleh sebelum tanggal mulai angkatan
        if (!empty($v['angkatan_id']) && !empty($v['tanggal'])) {
            $this->assertTanggalDalamRentangAngkatan($v['angkatan_id'], $v['tanggal']);
        }

        $jadwal = JadwalPelatihan::create($v);

        if (!empty($v['angkatan_id'])) {
            $pendaftarQuery = \App\Models\Pendaftar::where('angkatan_id', $v['angkatan_id'])
                ->where('status', 'diterima');

            if (!empty($v['tempat_pelatihan'])) {
                $tempatNama = trim(explode(' (', $v['tempat_pelatihan'])[0]);
                $pendaftarQuery->where('tempat_pelatihan', 'like', '%' . $tempatNama . '%');
            }

            $pendaftarIds = $pendaftarQuery->pluck('id');
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

        // Validasi dulu sebelum disimpan bila tanggal / angkatan berubah
        $angkatanId = $request->input('angkatan_id', $j->angkatan_id);
        $tanggal = $request->input('tanggal', $j->tanggal);
        if (!empty($angkatanId) && !empty($tanggal)) {
            $this->assertTanggalDalamRentangAngkatan($angkatanId, $tanggal);
        }

        $j->update($request->only([
            'judul', 'jenis_pelatihan', 'tanggal', 'jam', 'ruangan',
            'jenis_sesi', 'status', 'angkatan_id', 'hari_ke', 'tempat_pelatihan', 'pengajar'
        ]));

        return response()->json(['success' => true, 'message' => 'Jadwal diupdate.', 'data' => $j->load('peserta')]);
    }

    /**
     * Pastikan tanggal sesi (YYYY-MM-DD) tidak sebelum tanggal mulai angkatan.
     */
    private function assertTanggalDalamRentangAngkatan(string $angkatanId, string $tanggal): void
    {
        $angkatan = \App\Models\Angkatan::find($angkatanId);
        if (!$angkatan || empty($angkatan->tanggal_mulai)) {
            return;
        }

        $mulaiAngkatan = substr((string) $angkatan->tanggal_mulai, 0, 10);
        $tglSesi = substr(trim($tanggal), 0, 10);

        if ($tglSesi < $mulaiAngkatan) {
            abort(response()->json([
                'success' => false,
                'message' => "Tanggal sesi ({$tglSesi}) tidak boleh sebelum tanggal mulai angkatan ({$mulaiAngkatan}).",
            ], 422));
        }
    }

    public function destroy(string $id)
    {
        JadwalPelatihan::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Jadwal dihapus.']);
    }

    /**
     * Update satu PAKET jadwal sekaligus (seluruh sesi dalam
     * kombinasi angkatan_id + tempat_pelatihan) langsung di route ini.
     * Mengganti N kali panggilan update per-sesi dari frontend.
     */
    public function updatePaket(Request $request)
    {
        $v = $request->validate([
            'angkatan_id'      => 'required|string|exists:angkatans,id',
            'tempat_lama'      => 'nullable|string',
            'tempat_pelatihan' => 'required|string',
            'ruangan'          => 'required|string',
            'pengajar'         => 'nullable|string',
            'tanggal_mulai'    => 'required|string',
            'tanggal_selesai'  => 'required|string',
            // Tanggal per-sesi yang sudah dihitung frontend (melewati Minggu/tanggal merah)
            'sesi'             => 'nullable|array',
            'sesi.*.id'        => 'required_with:sesi|string',
            'sesi.*.tanggal'   => 'required_with:sesi|string',
        ]);

        $tglMulai = substr(trim($v['tanggal_mulai']), 0, 10);
        $tglSelesai = substr(trim($v['tanggal_selesai']), 0, 10);

        if ($tglSelesai < $tglMulai) {
            return response()->json([
                'success' => false,
                'message' => "Tanggal selesai ({$tglSelesai}) tidak boleh sebelum tanggal mulai ({$tglMulai}).",
            ], 422);
        }

        // Batas bawah mengikuti tanggal mulai angkatan
        $this->assertTanggalDalamRentangAngkatan($v['angkatan_id'], $tglMulai);

        $tempatLama = trim($v['tempat_lama'] ?? $v['tempat_pelatihan']);

        // Samakan logika pengelompokan frontend: cocok exact ATAU saling mengandung
        // (mis. "Gedung LPK Leles Utama" vs "Gedung LPK Leles Utama (Jl. ...)").
        $allSessions = JadwalPelatihan::where('angkatan_id', $v['angkatan_id'])->get();
        $sessions = $allSessions->filter(function ($s) use ($tempatLama) {
            $stored = trim((string) $s->tempat_pelatihan);
            if ($stored === '' && $tempatLama === '') return true;
            if ($stored === $tempatLama) return true;
            $a = mb_strtolower($stored);
            $b = mb_strtolower($tempatLama);
            if ($a === '' || $b === '') return false;
            return str_contains($a, $b) || str_contains($b, $a);
        })->sortBy(fn ($s) => (int) ($s->hari_ke ?? 0))->values();

        if ($sessions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Paket jadwal tidak ditemukan (tidak ada sesi untuk angkatan & tempat tersebut).',
            ], 404);
        }

        $baseHari = (int) ($sessions->first()->hari_ke ?? 1);

        $hasSesiMap = !empty($v['sesi']) && is_array($v['sesi']);
        if ($hasSesiMap && count($v['sesi']) !== $sessions->count()) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah tanggal sesi tidak sesuai dengan jumlah sesi paket. Muat ulang halaman lalu coba lagi.',
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($sessions, $v, $tglMulai, $tglSelesai, $baseHari) {
            // Bila frontend mengirim tanggal per-sesi (sudah melewati hari libur),
            // pakai tanggal tersebut; bila tidak, distribusikan dari tanggal mulai.
            $byId = [];
            if (!empty($v['sesi']) && is_array($v['sesi'])) {
                foreach ($v['sesi'] as $item) {
                    if (isset($item['id'], $item['tanggal'])) {
                        $byId[$item['id']] = substr(trim($item['tanggal']), 0, 10);
                    }
                }
            }

            foreach ($sessions as $s) {
                if (isset($byId[$s->id])) {
                    $newTanggal = $byId[$s->id];
                } else {
                    $offset = ((int) ($s->hari_ke ?? $baseHari)) - $baseHari;
                    $newTanggal = date('Y-m-d', strtotime("{$tglMulai} +{$offset} days"));
                }

                if ($newTanggal < $tglMulai || $newTanggal > $tglSelesai) {
                    abort(response()->json([
                        'success' => false,
                        'message' => "Tanggal sesi {$newTanggal} di luar rentang jadwal {$tglMulai} s.d. {$tglSelesai}.",
                    ], 422));
                }

                $this->assertTanggalDalamRentangAngkatan($v['angkatan_id'], $newTanggal);

                $s->update([
                    'tempat_pelatihan' => $v['tempat_pelatihan'],
                    'ruangan'          => $v['ruangan'],
                    'pengajar'         => $v['pengajar'] ?? $s->pengajar,
                    'tanggal'          => $newTanggal,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Paket jadwal ({$sessions->count()} sesi) berhasil diperbarui.",
            'data' => $sessions->values(),
        ]);
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
