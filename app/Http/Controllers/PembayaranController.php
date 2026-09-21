<?php

namespace App\Http\Controllers;

use App\Models\Pembayaran;
use App\Models\Pendaftar;
use App\Models\Tagihan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PembayaranController extends Controller
{
    /**
     * Batas waktu pelunasan: 11 hari dihitung dari hari pertama pelatihan.
     * Hari pertama = tanggal sesi paling awal milik angkatan + tempat
     * pelatihan peserta (tiap tempat bisa berbeda tanggal mulai).
     */
    public const BATAS_HARI_PELUNASAN = 11;

    /**
     * Hari pertama pelatihan peserta: sesi jadwal paling awal pada
     * angkatan + tempatnya. Fallback: sesi paling awal angkatan,
     * lalu tanggal_mulai angkatan.
     */
    public function hariPertamaPelatihan(Pendaftar $pendaftar): ?\Carbon\Carbon
    {
        $pendaftar->loadMissing('angkatan');
        $angkatanId = $pendaftar->angkatan_id;

        if (!empty($angkatanId)) {
            $query = \App\Models\JadwalPelatihan::where('angkatan_id', $angkatanId)->orderBy('tanggal', 'asc');

            if (!empty($pendaftar->tempat_pelatihan)) {
                $tpName = trim(explode(' (', $pendaftar->tempat_pelatihan)[0] ?? $pendaftar->tempat_pelatihan);
                $first = (clone $query)->where('tempat_pelatihan', 'like', '%' . $tpName . '%')->first();
                if ($first && !empty($first->tanggal)) {
                    return \Carbon\Carbon::parse($first->tanggal)->startOfDay();
                }
            }

            $first = $query->first();
            if ($first && !empty($first->tanggal)) {
                return \Carbon\Carbon::parse($first->tanggal)->startOfDay();
            }
        }

        if (!empty($pendaftar->angkatan?->tanggal_mulai)) {
            return \Carbon\Carbon::parse($pendaftar->angkatan->tanggal_mulai)->startOfDay();
        }

        return null;
    }

    /** Batas akhir pelunasan = hari pertama + 11 hari. */
    public function batasAkhirPelunasan(Pendaftar $pendaftar, ?\Carbon\Carbon $base = null): ?\Carbon\Carbon
    {
        $base ??= $this->hariPertamaPelatihan($pendaftar);
        return $base ? $base->copy()->addDays(self::BATAS_HARI_PELUNASAN) : null;
    }

    /**
     * Ringkasan tenggat pembayaran: hari pertama, batas akhir (H+11),
     * sisa hari, dan status menunggak (lewat batas tapi masih ada sisa).
     * nominal tagihan = SISA yang belum dibayar.
     */
    public function tenggatInfo(Pendaftar $pendaftar, Tagihan $tagihan): array
    {
        $pendaftar->loadMissing('angkatan');
        $hariPertama = $this->hariPertamaPelatihan($pendaftar);
        $batasAkhir = $hariPertama ? $hariPertama->copy()->addDays(self::BATAS_HARI_PELUNASAN) : null;
        $sisa = (float) $tagihan->nominal;
        $today = now()->startOfDay();
        $sisaHari = $batasAkhir ? (int) $today->diffInDays($batasAkhir, false) : null;
        $menunggak = $batasAkhir && $sisa > 0 && $today->greaterThan($batasAkhir);

        return [
            'hari_pertama' => $hariPertama?->toDateString(),
            'batas_akhir' => $batasAkhir?->toDateString(),
            'batas_hari' => self::BATAS_HARI_PELUNASAN,
            'sisa_hari' => $sisaHari,
            'menunggak' => (bool) $menunggak,
            'sisa_tagihan' => $sisa,
        ];
    }
    public function info(string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);
        $pendaftar = $tagihan->pendaftar;

        return response()->json([
            'success' => true,
            'data' => array_merge(
                $tagihan->load(['pembayarans.paymentMethod', 'pendaftar'])->toArray(),
                ['tenggat' => $this->tenggatInfo($pendaftar, $tagihan)]
            ),
        ]);
    }

    /**
     * Pembayaran peserta: nominal bebas sesuai yang mau dibayar
     * (maksimal sisa tagihan). Masuk sebagai menunggu verifikasi admin.
     */
    public function store(Request $request, string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);
        $validated = $request->validate([
            'nominal' => 'required|numeric|min:1|max:' . max((float) $tagihan->nominal, 1),
            'tipe_pembayaran' => 'required|in:cash,transfer',
            'nama_penerima' => 'required_if:tipe_pembayaran,cash|nullable|string|max:255',
            'nama_pengirim' => 'required_if:tipe_pembayaran,transfer|nullable|string|max:255',
            'jenis_pengirim' => 'required_if:tipe_pembayaran,transfer|nullable|string|max:100',
            'payment_method_id' => 'required_if:tipe_pembayaran,transfer|nullable|exists:payment_methods,id',
            'metode_pembayaran' => 'nullable|string|max:255',
            'bukti_pembayaran' => 'required_if:tipe_pembayaran,transfer|nullable|file|image|max:5120',
        ]);

        $sisa = (float) $tagihan->nominal;
        if ((float) $validated['nominal'] > $sisa) {
            return response()->json(['success' => false, 'message' => 'Nominal melebihi sisa tagihan.'], 422);
        }

        if ($request->hasFile('bukti_pembayaran')) {
            $path = $request->file('bukti_pembayaran')->store('bukti', 'public');
            $validated['bukti_pembayaran'] = asset('storage/' . $path);
        }

        $paymentMethod = $validated['payment_method_id'] ?? null;
        $paymentMethodModel = $paymentMethod ? \App\Models\PaymentMethod::find($paymentMethod) : null;
        $validated['metode_pembayaran'] = $paymentMethodModel?->nama_metode
            ?? ($validated['metode_pembayaran'] ?? 'Cash');
        $validated['tagihan_id'] = $tagihan->id;
        $validated['tanggal_bayar'] = now();
        $validated['status'] = 'menunggu_verifikasi';
        unset($validated['payment_method_id']);

        DB::beginTransaction();
        try {
            $pembayaran = Pembayaran::create(array_merge($validated, ['payment_method_id' => $paymentMethod]));
            $this->syncLegacyStatus($tagihan);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil dikirim dan menunggu validasi admin.',
                'data' => $pembayaran->load('paymentMethod'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan pembayaran.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /** Validasi (terima) pembayaran terbaru yang menunggu. Nominal tagihan berkurang. */
    public function verify(string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);
        $pembayaran = $tagihan->pembayarans()->where('status', 'menunggu_verifikasi')->latest()->firstOrFail();

        DB::beginTransaction();
        try {
            $this->applyPenerimaan($pembayaran, false);
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Pembayaran berhasil divalidasi. Sisa tagihan berkurang.', 'data' => $pembayaran->fresh()->load('tagihan')]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memvalidasi pembayaran.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reject(Request $request, string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);
        $pembayaran = $tagihan->pembayarans()->where('status', 'menunggu_verifikasi')->latest()->firstOrFail();
        $pembayaran->update(['status' => 'ditolak', 'catatan_admin' => $request->input('catatan'), 'tanggal_verifikasi' => now()]);
        $this->syncLegacyStatus($tagihan->fresh());

        return response()->json(['success' => true, 'message' => 'Pembayaran ditolak.', 'data' => $pembayaran]);
    }

    /**
     * Validasi satu transaksi. Opsi `lunaskan=true` = validasi untuk lunas:
     * pembayaran diterima lalu sisa tagihan dianggap selesai (nominal 0).
     */
    public function verifyTransaction(Request $request, string $id)
    {
        $pembayaran = Pembayaran::with('tagihan')->findOrFail($id);
        $lunaskan = filter_var($request->input('lunaskan', false), FILTER_VALIDATE_BOOLEAN);

        DB::beginTransaction();
        try {
            $this->applyPenerimaan($pembayaran, $lunaskan);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $lunaskan ? 'Pembayaran divalidasi dan tagihan dilunaskan.' : 'Pembayaran berhasil divalidasi. Sisa tagihan berkurang.',
                'data' => $pembayaran->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memvalidasi pembayaran.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function rejectTransaction(Request $request, string $id)
    {
        $pembayaran = Pembayaran::with('tagihan')->findOrFail($id);

        DB::beginTransaction();
        try {
            $pembayaran->update(['status' => 'ditolak', 'catatan_admin' => $request->input('catatan'), 'tanggal_verifikasi' => now()]);
            $this->syncLegacyStatus($pembayaran->tagihan->fresh());
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Pembayaran ditolak.', 'data' => $pembayaran->fresh()]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menolak pembayaran.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Terima satu pembayaran: status diterima, nominal tagihan (sisa)
     * berkurang sebesar nominal pembayaran. Bila $lunaskan, sisa
     * dianggap selesai (nominal 0, status lunas).
     */
    private function applyPenerimaan(Pembayaran $pembayaran, bool $lunaskan = false): void
    {
        $pembayaran->update(['status' => 'diterima', 'tanggal_verifikasi' => now()]);

        $tagihan = $pembayaran->tagihan()->with('pendaftar.program')->firstOrFail();
        $sisa = max(0, (float) $tagihan->nominal - (float) $pembayaran->nominal);
        if ($lunaskan) {
            $sisa = 0;
        }

        $tagihan->update([
            'nominal' => $sisa,
            'status' => $sisa <= 0 ? 'lunas' : 'belum_lunas',
            'tanggal_bayar' => $tagihan->tanggal_bayar ?? $pembayaran->tanggal_bayar ?? now(),
            'tanggal_terakhir_bayar' => now(),
        ]);

        $this->syncLegacyStatus($tagihan->fresh());
    }

    private function getOrCreateTagihan(string $pendaftarId): Tagihan
    {
        $pendaftar = Pendaftar::with('program')->findOrFail($pendaftarId);
        return Tagihan::firstOrCreate(
            ['pendaftar_id' => $pendaftar->id],
            ['id' => Str::uuid()->toString(), 'nominal' => $pendaftar->biaya_pelatihan ?? $pendaftar->program?->harga ?? 0, 'status' => 'belum_lunas']
        );
    }

    /**
     * Sinkron status turunan. nominal tagihan = SISA yang belum dibayar:
     * lunas bila 0, menunggu bila ada yang menunggu verifikasi,
     * sebagian bila sudah ada yang diterima, selain itu belum bayar.
     */
    private function syncLegacyStatus(Tagihan $tagihan): void
    {
        $tagihan->refresh();
        $sisa = (float) $tagihan->nominal;
        $menunggu = $tagihan->pembayarans()->where('status', 'menunggu_verifikasi')->exists();
        $diterima = $tagihan->pembayarans()->where('status', 'diterima')->exists();

        $tagihan->update(['status' => $sisa <= 0 ? 'lunas' : 'belum_lunas']);

        $status_pembayaran = 'belum_bayar';
        if ($sisa <= 0) {
            $status_pembayaran = 'lunas';
        } elseif ($menunggu) {
            $status_pembayaran = 'menunggu_konfirmasi';
        } elseif ($diterima) {
            $status_pembayaran = 'cicilan_sebagian';
        }

        Pendaftar::whereKey($tagihan->pendaftar_id)->update([
            'status_pembayaran' => $status_pembayaran,
        ]);
    }
}
