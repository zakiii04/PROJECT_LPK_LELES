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
    public function info(string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);

        return response()->json([
            'success' => true,
            'data' => $tagihan->load(['pembayarans.paymentMethod', 'pendaftar']),
        ]);
    }

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

        $sisa = (float) $tagihan->nominal - (float) $tagihan->pembayarans()->where('status', 'diterima')->sum('nominal');
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

        $pembayaran = Pembayaran::create(array_merge($validated, ['payment_method_id' => $paymentMethod]));
        $this->syncLegacyStatus($tagihan);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dikirim dan menunggu validasi admin.',
            'data' => $pembayaran->load('paymentMethod'),
        ], 201);
    }

    public function verify(string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);
        $pembayaran = $tagihan->pembayarans()->where('status', 'menunggu_verifikasi')->latest()->firstOrFail();
        $pembayaran->update(['status' => 'diterima', 'tanggal_verifikasi' => now()]);
        $this->syncLegacyStatus($tagihan->fresh());

        return response()->json(['success' => true, 'message' => 'Pembayaran berhasil divalidasi.', 'data' => $pembayaran->load('tagihan')]);
    }

    public function reject(Request $request, string $pendaftarId)
    {
        $tagihan = $this->getOrCreateTagihan($pendaftarId);
        $pembayaran = $tagihan->pembayarans()->where('status', 'menunggu_verifikasi')->latest()->firstOrFail();
        $pembayaran->update(['status' => 'ditolak', 'catatan_admin' => $request->input('catatan'), 'tanggal_verifikasi' => now()]);
        $this->syncLegacyStatus($tagihan->fresh());

        return response()->json(['success' => true, 'message' => 'Pembayaran ditolak.', 'data' => $pembayaran]);
    }

    public function verifyTransaction(string $id)
    {
        $pembayaran = Pembayaran::with('tagihan')->findOrFail($id);
        $pembayaran->update(['status' => 'diterima', 'tanggal_verifikasi' => now()]);
        $this->syncLegacyStatus($pembayaran->tagihan->fresh());
        return response()->json(['success' => true, 'data' => $pembayaran]);
    }

    public function rejectTransaction(Request $request, string $id)
    {
        $pembayaran = Pembayaran::with('tagihan')->findOrFail($id);
        $pembayaran->update(['status' => 'ditolak', 'catatan_admin' => $request->input('catatan'), 'tanggal_verifikasi' => now()]);
        return response()->json(['success' => true, 'data' => $pembayaran]);
    }

    private function getOrCreateTagihan(string $pendaftarId): Tagihan
    {
        $pendaftar = Pendaftar::with('program')->findOrFail($pendaftarId);
        return Tagihan::firstOrCreate(
            ['pendaftar_id' => $pendaftar->id],
            ['id' => Str::uuid()->toString(), 'nominal' => $pendaftar->biaya_pelatihan ?? $pendaftar->program?->harga ?? 0, 'status' => 'belum_lunas']
        );
    }

    private function syncLegacyStatus(Tagihan $tagihan): void
    {
        $paid = (float) $tagihan->pembayarans()->where('status', 'diterima')->sum('nominal');
        $isPaid = $paid >= (float) $tagihan->nominal;
        $tagihan->update(['status' => $isPaid ? 'lunas' : 'belum_lunas']);
        Pendaftar::whereKey($tagihan->pendaftar_id)->update(['status_pembayaran' => $isPaid ? 'lunas' : 'belum_bayar']);
    }
}
