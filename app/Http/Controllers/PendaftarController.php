<?php

namespace App\Http\Controllers;

use App\Models\Pendaftar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
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
            'alamat'                  => 'required|string',
            'tinggi_badan'            => 'required|numeric|min:100|max:250',
            'berat_badan'             => 'required|numeric|min:30|max:200',
            'lingkar_pinggang'        => 'required|string',
            'riwayat_penyakit'        => 'nullable|string',
            'no_hp'                   => 'required|string',
            'email'                   => 'required|email',
            'jenis_pelatihan'         => 'required|string',
            'program_id'              => 'nullable|exists:program_pelatihans,id',
            'motivasi'                => 'required|string',
            'biaya_pelatihan'         => 'sometimes|numeric',
        ]);

        $this->validateParticipantRequirements(
            $validated['tanggal_lahir'],
            $validated['tinggi_badan'],
            $validated['berat_badan']
        );

        $count  = Pendaftar::count() + 1;
        $year   = date('Y');
        $validated['id']              = Str::uuid()->toString();
        $validated['no_pendaftaran']  = 'LPK-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
        if (empty($validated['biaya_pelatihan']) || $validated['biaya_pelatihan'] == 0) {
            $prog = !empty($validated['program_id'])
                ? \App\Models\ProgramPelatihan::find($validated['program_id'])
                : \App\Models\ProgramPelatihan::where('nama', $validated['jenis_pelatihan'])->first();

            if ($prog) {
                $validated['program_id'] = $prog->id;
                $validated['biaya_pelatihan'] = $prog->harga;
            }
        }
        $validated['tanggal_daftar']  = now();

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

        if (empty($validated['user_id'])) {
            $user = \App\Models\User::where('email', $validated['email'])->first();
            if (!$user) {
                $emailPrefix = explode('@', $validated['email'])[0] ?? ('peserta_' . Str::random(5));
                $baseUsername = Str::slug($emailPrefix, '_');
                if (empty($baseUsername)) {
                    $baseUsername = 'peserta_' . Str::random(5);
                }
                $uniqueUsername = $baseUsername;
                $counter = 1;
                while (\App\Models\User::where('username', $uniqueUsername)->exists()) {
                    $uniqueUsername = $baseUsername . '_' . $counter++;
                }

                $user = \App\Models\User::create([
                    'id'       => Str::uuid()->toString(),
                    'username' => $uniqueUsername,
                    'email'    => $validated['email'],
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                    'role'     => 'PESERTA',
                ]);
            }
            $validated['user_id'] = $user->id;
        }

        $pendaftar = Pendaftar::create($validated);
        return response()->json([
            'success'          => true,
            'message'          => 'Pendaftaran berhasil dikirim. Akun login peserta otomatis diaktifkan.',
            'default_password' => 'password',
            'data'             => $pendaftar->load(['angkatan', 'user']),
        ], 201);
    }

    public function show(string $id)
    {
        $p = Pendaftar::with(['program', 'angkatan', 'user', 'interview', 'cicilan', 'kelulusan'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $p]);
    }

    public function update(Request $request, string $id)
    {
        $pendaftar = Pendaftar::findOrFail($id);
        $oldAngkatanId = $pendaftar->angkatan_id;
        $oldStatus = $pendaftar->status;
        $pendaftar->update($request->except(['id', 'no_pendaftaran']));

        if ($pendaftar->status !== 'diterima') {
            $pendaftar->jadwal()->detach();
        } else if ($pendaftar->angkatan_id !== $oldAngkatanId || $oldStatus !== 'diterima') {
            $nonMatchingJadwals = $pendaftar->jadwal()
                ->where('angkatan_id', '!=', $pendaftar->angkatan_id)
                ->pluck('jadwal_pelatihans.id');
            if ($nonMatchingJadwals->count() > 0) {
                $pendaftar->jadwal()->detach($nonMatchingJadwals);
            }
            if (!empty($pendaftar->angkatan_id)) {
                $query = \App\Models\JadwalPelatihan::where('angkatan_id', $pendaftar->angkatan_id);
                if (!empty($pendaftar->tempat_pelatihan)) {
                    $tpName = explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan;
                    $query->where('tempat_pelatihan', 'like', '%' . trim($tpName) . '%');
                }
                $matchingJadwalIds = $query->pluck('id');
                if ($matchingJadwalIds->count() > 0) {
                    $pendaftar->jadwal()->syncWithoutDetaching($matchingJadwalIds);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pendaftar diupdate.',
            'data'    => $pendaftar->load(['program', 'angkatan', 'user']),
        ]);
    }

    public function destroy(string $id)
    {
        Pendaftar::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Pendaftar berhasil dihapus.']);
    }

    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status'            => 'required|in:menunggu,diterima,ditolak',
            'tinggi_badan'      => 'nullable|numeric|min:100|max:250',
            'berat_badan'       => 'nullable|numeric|min:30|max:200',
            'lingkar_pinggang'  => 'nullable|string',
            'berkas_verifikasi' => 'nullable|array',
            'angkatan_id'       => 'nullable|string|exists:angkatans,id',
            'tempat_pelatihan'  => 'nullable|string',
        ]);

        $pendaftar = Pendaftar::findOrFail($id);
        $tinggiBadan = $request->input('tinggi_badan', $pendaftar->tinggi_badan);
        $beratBadan = $request->input('berat_badan', $pendaftar->berat_badan);

        if ($request->status === 'diterima') {
            $this->validateParticipantRequirements($pendaftar->tanggal_lahir, $tinggiBadan, $beratBadan);
        }

        $updateData = ['status' => $request->status];

        if ($request->has('tinggi_badan') && $request->tinggi_badan !== null) {
            $updateData['tinggi_badan'] = $request->tinggi_badan;
        }
        if ($request->has('berat_badan') && $request->berat_badan !== null) {
            $updateData['berat_badan'] = $request->berat_badan;
        }
        if ($request->has('lingkar_pinggang') && $request->lingkar_pinggang !== null) {
            $updateData['lingkar_pinggang'] = $request->lingkar_pinggang;
        }
        if ($request->has('berkas_verifikasi')) {
            $updateData['berkas_verifikasi'] = $request->berkas_verifikasi;
        }
        if ($request->has('angkatan_id') && !empty($request->angkatan_id)) {
            $updateData['angkatan_id'] = $request->angkatan_id;
        }
        if ($request->has('tempat_pelatihan') && !empty($request->tempat_pelatihan)) {
            $updateData['tempat_pelatihan'] = $request->tempat_pelatihan;
        }

        $pendaftar->update($updateData);

        if ($pendaftar->status !== 'diterima') {
            // Ketika status diubah menjadi menunggu atau ditolak, lepaskan seluruh jadwal sesi
            $pendaftar->jadwal()->detach();
        } else if (!empty($pendaftar->angkatan_id)) {
            // Jika diterima, bersihkan jadwal dari angkatan lama terlebih dahulu
            $nonMatchingJadwals = $pendaftar->jadwal()
                ->where('angkatan_id', '!=', $pendaftar->angkatan_id)
                ->pluck('jadwal_pelatihans.id');
            if ($nonMatchingJadwals->count() > 0) {
                $pendaftar->jadwal()->detach($nonMatchingJadwals);
            }

            // Hubungkan peserta ke jadwal angkatan & tempat pelatihan saat ini
            $query = \App\Models\JadwalPelatihan::where('angkatan_id', $pendaftar->angkatan_id);
            if (!empty($pendaftar->tempat_pelatihan)) {
                $tpName = explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan;
                                $query->where('tempat_pelatihan', 'like', '%' . trim($tpName) . '%');
            }
            $matchingJadwalIds = $query->pluck('id');
            if ($matchingJadwalIds->count() > 0) {
                $pendaftar->jadwal()->syncWithoutDetaching($matchingJadwalIds);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Status dan data verifikasi berhasil diupdate.',
            'data'    => $pendaftar->load(['program', 'angkatan', 'user', 'jadwal']),
        ]);
    }

    public function alokasiAngkatan(Request $request, string $id)
    {
        $request->validate(['angkatan_id' => 'required|exists:angkatans,id']);
        $pendaftar = Pendaftar::findOrFail($id);
        $oldAngkatanId = $pendaftar->angkatan_id;
        $pendaftar->update(['angkatan_id' => $request->angkatan_id]);

        // Jika angkatan berubah, bersihkan jadwal dari angkatan lama
        if ($oldAngkatanId !== $request->angkatan_id) {
            $nonMatchingJadwals = $pendaftar->jadwal()
                ->where('angkatan_id', '!=', $request->angkatan_id)
                ->pluck('jadwal_pelatihans.id');
            if ($nonMatchingJadwals->count() > 0) {
                $pendaftar->jadwal()->detach($nonMatchingJadwals);
            }

            if ($pendaftar->status === 'diterima') {
                $query = \App\Models\JadwalPelatihan::where('angkatan_id', $request->angkatan_id);
                if (!empty($pendaftar->tempat_pelatihan)) {
                    $tpName = explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan;
                                        $query->where('tempat_pelatihan', 'like', '%' . trim($tpName) . '%');
                }
                $matchingJadwalIds = $query->pluck('id');
                if ($matchingJadwalIds->count() > 0) {
                    $pendaftar->jadwal()->syncWithoutDetaching($matchingJadwalIds);
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'Peserta dialokasikan ke angkatan.', 'data' => $pendaftar->load('angkatan')]);
    }

    private function validateParticipantRequirements(string $tanggalLahir, string $tinggiBadan, string $beratBadan): void
    {
        $birthDate = Carbon::parse($tanggalLahir);
        $age = $birthDate->diffInYears(now());
        $heightInMeters = (float) $tinggiBadan / 100;
        $bmi = $heightInMeters > 0 ? (float) $beratBadan / ($heightInMeters * $heightInMeters) : 0;
        $errors = [];

        if ($age < 18) {
            $errors['tanggal_lahir'] = 'Peserta harus berusia minimal 18 tahun.';
        }

        if ($bmi < 18) {
            $errors['berat_badan'] = 'BMI peserta harus minimal 18.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
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
