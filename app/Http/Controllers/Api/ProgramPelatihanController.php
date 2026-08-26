<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgramPelatihan;
use Illuminate\Http\Request;

class ProgramPelatihanController extends Controller
{
    public function index()
    {
        $programs = ProgramPelatihan::withCount('angkatan')->get();

        return response()->json([
            'success' => true,
            'message' => 'Data program pelatihan berhasil diambil.',
            'data'    => $programs,
        ]);
    }

    public function show(string $id)
    {
        $program = ProgramPelatihan::with(['angkatan' => function ($q) {
            $q->where('status', '!=', 'Selesai')->orderBy('tanggal_mulai');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail program pelatihan berhasil diambil.',
            'data'    => $program,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id'              => 'required|string|unique:program_pelatihans,id',
            'nama'            => 'required|string|unique:program_pelatihans,nama',
            'deskripsi'       => 'required|string',
            'durasi'          => 'required|string',
            'harga'           => 'required|numeric|min:0',
            'harga_formatted' => 'required|string',
            'icon'            => 'nullable|string',
        ]);

        $program = ProgramPelatihan::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Program pelatihan berhasil ditambahkan.',
            'data'    => $program,
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $program = ProgramPelatihan::findOrFail($id);

        $validated = $request->validate([
            'nama'            => 'sometimes|string|unique:program_pelatihans,nama,' . $id,
            'deskripsi'       => 'sometimes|string',
            'durasi'          => 'sometimes|string',
            'harga'           => 'sometimes|numeric|min:0',
            'harga_formatted' => 'sometimes|string',
            'icon'            => 'nullable|string',
        ]);

        $program->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Program pelatihan berhasil diupdate.',
            'data'    => $program,
        ]);
    }

    public function destroy(string $id)
    {
        $program = ProgramPelatihan::findOrFail($id);
        $program->delete();

        return response()->json([
            'success' => true,
            'message' => 'Program pelatihan berhasil dihapus.',
        ]);
    }
}
