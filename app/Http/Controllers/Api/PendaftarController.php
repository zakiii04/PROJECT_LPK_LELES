<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pendaftar;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PendaftarController extends Controller
{
    public function index(Request $request)
    {
        $query = Pendaftar::with(['program', 'angkatan', 'user']);
        if ($request->status)            $query->where('status', $request->status);
        if ($request->angkatan_id)       $query->where('angkatan_id', $request->angkatan_id);
        if ($request->program_id)        $query->where('program_id', $request->program_id);
        if ($request->status_pembayaran) $query->where('status_pembayaran', $request->status_pembayaran);
        if ($request->search) {
            $q = $request->search;
            $query->where(function ($sq) use ($q) {
                $sq->where('nama_lengkap', 'like', "%$q%")
                    ->orWhere('nik', 'like', "%$q%")
                    ->orWhere('no_pendaftaran', 'like', "%$q%");
            });
        }
        $perPage = $request->per_page ?? 15;
        return response()->json(['success' => true, 'data' => $query->orderByDesc('tanggal_daftar')->paginate($perPage)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap'            => 'required|string',
            'nik'                     => 'required|string|size:16|unique:pendaftars,nik',
            'tempat_lahir'            => 'required|string',
            'tanggal_lahir'           => 'required|date',
            'jenis_kelamin'           => 'required|in:Laki-laki,Perempuan',
            'alamat'                  => 'required|string',
            'tinggi_badan'            => 'required|string',
            'berat_badan'             => 'required|string',
            'lingkar_pinggang'        => 'required|string',
            'riwayat_penyakit'        => 'nullable|string',
            'no_hp'                   => 'required|string',
            'email'                   => 'required|email',
            'nama_kontak_darurat'     => 'required|string',
            'no_hp_kontak_darurat'    => 'required|string',
            'hubungan_kontak_darurat' => 'required|string',
            'jenis_pelatihan'         => 'required|string',
            'program_id'              => 'nullable|exists:program_pelatihans,id',
            'motivasi'                => 'required|string',
            'biaya_pelatihan'         => 'sometimes|numeric',
        ]);

        $count  = Pendaftar::count() + 1;
        $year   = date('Y');
        $validated['id']              = Str::uuid()->toString();
        $validated['no_pendaftaran']  = 'LPK-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
        $validated['biaya_pelatihan'] = $validated['biaya_pelatihan'] ?? 0;
        $validated['tanggal_daftar']  = now();

        // Cari angkatan yang statusnya 'Pendaftaran' (Pendaftaran Buka) untuk program ini
        // (Jika Angkatan 50 sedang 'On_Going', maka pendaftar baru tidak akan masuk Angkatan 50, melainkan masuk Angkatan 51 / Pendaftaran Buka)
        $angkatanOpen = null;
        if (!empty($validated['program_id'])) {
            $angkatanOpen = \App\Models\Angkatan::where('program_id', $validated['program_id'])
                ->where('status', 'Pendaftaran')
                ->first();
        }
        if (!$angkatanOpen) {
            $angkatanOpen = \App\Models\Angkatan::where('status', 'Pendaftaran')->first();
        }
        if ($angkatanOpen) {
            $validated['angkatan_id'] = $angkatanOpen->id;
        }

        $pendaftar = Pendaftar::create($validated);
        return response()->json(['success' => true, 'message' => 'Pendaftaran berhasil dikirim.', 'data' => $pendaftar->load('angkatan')], 201);
    }

    public function show(string $id)
    {
        $p = Pendaftar::with(['program', 'angkatan', 'user', 'interview', 'cicilan', 'kelulusan'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $p]);
    }

    public function update(Request $request, string $id)
    {
        $pendaftar = Pendaftar::findOrFail($id);
        $pendaftar->update($request->except(['id', 'no_pendaftaran', 'nik']));
        return response()->json(['success' => true, 'message' => 'Data pendaftar diupdate.', 'data' => $pendaftar]);
    }

    public function destroy(string $id)
    {
        Pendaftar::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Pendaftar berhasil dihapus.']);
    }

    public function updateStatus(Request $request, string $id)
    {
        $request->validate(['status' => 'required|in:menunggu,diterima,ditolak']);
        $pendaftar = Pendaftar::findOrFail($id);
        $pendaftar->update(['status' => $request->status]);
        return response()->json(['success' => true, 'message' => 'Status diupdate.', 'data' => $pendaftar]);
    }

    public function alokasiAngkatan(Request $request, string $id)
    {
        $request->validate(['angkatan_id' => 'required|exists:angkatans,id']);
        $pendaftar = Pendaftar::findOrFail($id);
        $pendaftar->update(['angkatan_id' => $request->angkatan_id]);
        return response()->json(['success' => true, 'message' => 'Peserta dialokasikan ke angkatan.', 'data' => $pendaftar->load('angkatan')]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $pendaftar = Pendaftar::with(['program', 'angkatan', 'interview', 'cicilan', 'kelulusan'])
            ->where('user_id', $user->id)->firstOrFail();
        return response()->json(['success' => true, 'data' => $pendaftar]);
    }

    public function byAngkatan(string $angkatanId)
    {
        $pendaftar = Pendaftar::where('angkatan_id', $angkatanId)->with('user')->get();
        return response()->json(['success' => true, 'data' => $pendaftar]);
    }
}
