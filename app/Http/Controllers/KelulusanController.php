<?php

namespace App\Http\Controllers;

use App\Models\Kelulusan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KelulusanController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Kelulusan::with(['pendaftar.program', 'pendaftar.angkatan'])->latest()->get(),
        ]);
    }

    public function show(string $id)
    {
        return response()->json([
            'success' => true,
            'data' => Kelulusan::with(['pendaftar.program', 'pendaftar.angkatan'])->findOrFail($id),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);
        $kelulusan = Kelulusan::where('pendaftar_id', $validated['pendaftar_id'])->first();

        if ($kelulusan) {
            $kelulusan->update($validated);
        } else {
            $validated['id'] = Str::uuid()->toString();
            $validated['no_sertifikat'] = $this->nextCertificateNumber();
            $kelulusan = Kelulusan::create($validated);
        }

        $this->syncStatusAkhir($kelulusan->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Data kelulusan berhasil disimpan.',
            'data' => $kelulusan->fresh()->load(['pendaftar.program', 'pendaftar.angkatan']),
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $kelulusan = Kelulusan::findOrFail($id);
        $validated = $this->validatePayload($request, true);
        $kelulusan->update($validated);

        $this->syncStatusAkhir($kelulusan->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Data kelulusan berhasil diperbarui.',
            'data' => $kelulusan->fresh()->load(['pendaftar.program', 'pendaftar.angkatan']),
        ]);
    }

    public function destroy(string $id)
    {
        $kelulusan = Kelulusan::findOrFail($id);
        $pendaftarId = $kelulusan->pendaftar_id;
        $wasLulus = $kelulusan->status_kelulusan === 'Lulus';
        $kelulusan->delete();

        // Reset kelulusan Lulus -> kembalikan peserta ke diterima.
        if ($wasLulus) {
            $pendaftar = \App\Models\Pendaftar::find($pendaftarId);
            if ($pendaftar && $pendaftar->status === 'lulus') {
                $pendaftar->update(['status' => 'diterima']);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data kelulusan berhasil dihapus.',
        ]);
    }

    /**
     * Sinkron status akhir peserta dari hasil kelulusan:
     * Lulus -> status 'lulus'; selain itu yang terlanjur 'lulus' kembali 'diterima'.
     */
    private function syncStatusAkhir(Kelulusan $kelulusan): void
    {
        $pendaftar = \App\Models\Pendaftar::find($kelulusan->pendaftar_id);
        if (!$pendaftar) return;

        if ($kelulusan->status_kelulusan === 'Lulus') {
            if ($pendaftar->status !== 'lulus') {
                $pendaftar->update(['status' => 'lulus']);
            }
        } elseif ($pendaftar->status === 'lulus') {
            $pendaftar->update(['status' => 'diterima']);
        }
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $rules = [
            'pendaftar_id' => ($partial ? 'sometimes|' : 'required|') . 'exists:pendaftars,id',
            'nilai_pretest' => 'sometimes|numeric|min:0|max:100',
            'nilai_posttest' => 'sometimes|numeric|min:0|max:100',
            'nilai_kehadiran' => 'sometimes|numeric|min:0|max:100',
            'nilai_tugas' => 'sometimes|numeric|min:0|max:100',
            'nilai_akhir' => 'sometimes|numeric|min:0|max:100',
            'status_kelulusan' => 'sometimes|in:Lulus,Tidak_Lulus,Dalam_Proses',
            'tanggal_lulus' => 'sometimes|string|max:255',
        ];

        return $request->validate($rules);
    }

    private function nextCertificateNumber(): string
    {
        $year = now()->year;
        $sequence = Kelulusan::whereYear('created_at', $year)->count() + 1;

        do {
            $number = sprintf('SERT-LPK-%d-%05d', $year, $sequence++);
        } while (Kelulusan::where('no_sertifikat', $number)->exists());

        return $number;
    }
}
