<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Angkatan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AngkatanController extends Controller
{
    public function index(Request $request)
    {
        $query = Angkatan::with(['program', 'pendaftar'])->withCount('pendaftar');
        if ($request->status)     $query->where('status', $request->status);
        if ($request->program_id) $query->where('program_id', $request->program_id);
        if ($request->tahun)      $query->where('tahun', $request->tahun);
        return response()->json(['success' => true, 'data' => $query->orderByDesc('created_at')->get()]);
    }

    public function show(string $id)
    {
        $angkatan = Angkatan::with(['program', 'pendaftar'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $angkatan]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_angkatan'           => 'required|string|unique:angkatans',
            'nama_angkatan'           => 'required|string',
            'tahun'                   => 'required|integer',
            'periode'                 => 'required|string',
            'tgl_mulai_pendaftaran'   => 'nullable|date',
            'tgl_selesai_pendaftaran' => 'nullable|date',
            'tanggal_mulai'           => 'required|date',
            'tanggal_selesai'         => 'required|date',
            'kuota'                   => 'sometimes|integer|min:1',
            'instruktur_nama'         => 'required|string',
            'status'                  => 'sometimes|in:Pendaftaran,On_Going,Selesai,Mendatang',
            'program_id'              => 'required|string',
        ]);

        if (!empty($validated['program_id'])) {
            $prog = \App\Models\ProgramPelatihan::where('id', $validated['program_id'])
                ->orWhere('nama', 'like', '%' . $validated['program_id'] . '%')
                ->first();
            if ($prog) {
                $validated['program_id'] = $prog->id;
            }
        }

        $validated['id'] = Str::uuid()->toString();
        $angkatan = Angkatan::create($validated);
        return response()->json(['success' => true, 'message' => 'Angkatan berhasil dibuat.', 'data' => $angkatan->load(['program', 'pendaftar'])], 201);
    }

    public function update(Request $request, string $id)
    {
        $angkatan = Angkatan::findOrFail($id);
        $validated = $request->validate([
            'kode_angkatan'           => 'sometimes|string|unique:angkatans,kode_angkatan,' . $id,
            'nama_angkatan'           => 'sometimes|string',
            'tahun'                   => 'sometimes|integer',
            'periode'                 => 'sometimes|string',
            'tgl_mulai_pendaftaran'   => 'nullable|date',
            'tgl_selesai_pendaftaran' => 'nullable|date',
            'tanggal_mulai'           => 'sometimes|date',
            'tanggal_selesai'         => 'sometimes|date',
            'kuota'                   => 'sometimes|integer|min:1',
            'instruktur_nama'         => 'sometimes|string',
            'status'                  => 'sometimes|in:Pendaftaran,On_Going,Selesai,Mendatang',
            'program_id'              => 'sometimes|nullable|string',
        ]);

        if (!empty($validated['program_id'])) {
            $prog = \App\Models\ProgramPelatihan::where('id', $validated['program_id'])
                ->orWhere('nama', 'like', '%' . $validated['program_id'] . '%')
                ->first();
            if ($prog) {
                $validated['program_id'] = $prog->id;
            }
        }

        $angkatan->update($validated);
        return response()->json(['success' => true, 'message' => 'Angkatan berhasil diupdate.', 'data' => $angkatan->load(['program', 'pendaftar'])]);
    }

    public function updateStatus(Request $request, string $id)
    {
        $angkatan = Angkatan::findOrFail($id);
        $request->validate(['status' => 'required|in:Pendaftaran,On_Going,Selesai,Mendatang']);
        $angkatan->update(['status' => $request->status]);
        return response()->json(['success' => true, 'message' => 'Status angkatan diupdate.', 'data' => $angkatan]);
    }

    public function destroy(string $id)
    {
        Angkatan::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Angkatan berhasil dihapus.']);
    }

    public function byProgram(string $programId)
    {
        $angkatan = Angkatan::where('program_id', $programId)->withCount('pendaftar')->get();
        return response()->json(['success' => true, 'data' => $angkatan]);
    }
}
