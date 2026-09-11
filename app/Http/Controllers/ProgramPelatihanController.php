<?php

namespace App\Http\Controllers;

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
            'id'              => 'nullable|string|unique:program_pelatihans,id',
            'nama'            => 'required|string|unique:program_pelatihans,nama',
            'deskripsi'       => 'required|string',
            'durasi'          => 'required|string',
            'harga'           => 'required|numeric|min:0',
            'harga_formatted' => 'nullable|string',
            'icon'            => 'nullable|string',
        ]);

        if (empty($validated['id'])) {
            $validated['id'] = \Illuminate\Support\Str::slug($validated['nama'], '_') ?: ('prog_' . \Illuminate\Support\Str::random(5));
        }
        if (empty($validated['harga_formatted']) && isset($validated['harga'])) {
            $validated['harga_formatted'] = 'Rp ' . number_format((float)$validated['harga'], 0, ',', '.');
        }

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
            'harga_formatted' => 'nullable|string',
            'icon'            => 'nullable|string',
        ]);

        if (isset($validated['harga']) && empty($validated['harga_formatted'])) {
            $validated['harga_formatted'] = 'Rp ' . number_format((float)$validated['harga'], 0, ',', '.');
        }

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
