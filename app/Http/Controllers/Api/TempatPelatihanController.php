<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TempatPelatihan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TempatPelatihanController extends Controller
{
    public function index()
    {
        // Auto-seed default places if empty
        if (TempatPelatihan::count() === 0) {
            TempatPelatihan::create([
                'id' => 't-1',
                'nama_tempat' => 'Gedung LPK Leles Utama',
                'alamat_lengkap' => 'Jl. Raya Leles No. 45, Kecamatan Leles, Kabupaten Garut',
                'kapasitas' => 50,
                'fasilitas' => 'Mesin Jahit High-Speed, Ruang Teori Ber-AC, Ruang Obras, Wifi',
                'status' => 'Aktif',
            ]);
            TempatPelatihan::create([
                'id' => 't-2',
                'nama_tempat' => 'Workshop Menjahit Leles',
                'alamat_lengkap' => 'Jl. Al-Kautsar No. 12, Leles, Kabupaten Garut',
                'kapasitas' => 30,
                'fasilitas' => 'Mesin Jahit Manual & Listrik, Meja Potong Pola, Manekin, Setrika Uap',
                'status' => 'Aktif',
            ]);
            TempatPelatihan::create([
                'id' => 't-3',
                'nama_tempat' => 'Kampus Cabang Garut Kota',
                'alamat_lengkap' => 'Jl. Ahmad Yani No. 88, Kota Garut',
                'kapasitas' => 40,
                'fasilitas' => 'Lab Komputer Desain Busana, Ruang Klasifikasi Bahan, Ruang Praktik',
                'status' => 'Aktif',
            ]);
        }

        $tempat = TempatPelatihan::orderBy('nama_tempat')->get();
        return response()->json(['success' => true, 'data' => $tempat]);
    }

    public function show(string $id)
    {
        $tempat = TempatPelatihan::findOrFail($id);
        return response()->json(['success' => true, 'data' => $tempat]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_tempat'    => 'required|string',
            'alamat_lengkap' => 'required|string',
            'kapasitas'      => 'sometimes|integer|min:1',
            'fasilitas'      => 'nullable|string',
            'status'         => 'sometimes|in:Aktif,Nonaktif',
        ]);

        $validated['id'] = 't-' . Str::random(6);
        $tempat = TempatPelatihan::create($validated);
        return response()->json(['success' => true, 'message' => 'Tempat pelatihan berhasil dibuat.', 'data' => $tempat], 201);
    }

    public function update(Request $request, string $id)
    {
        $tempat = TempatPelatihan::findOrFail($id);
        $validated = $request->validate([
            'nama_tempat'    => 'sometimes|string',
            'alamat_lengkap' => 'sometimes|string',
            'kapasitas'      => 'sometimes|integer|min:1',
            'fasilitas'      => 'nullable|string',
            'status'         => 'sometimes|in:Aktif,Nonaktif',
        ]);

        $tempat->update($validated);
        return response()->json(['success' => true, 'message' => 'Tempat pelatihan berhasil diupdate.', 'data' => $tempat]);
    }

    public function destroy(string $id)
    {
        TempatPelatihan::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Tempat pelatihan berhasil dihapus.']);
    }
}
