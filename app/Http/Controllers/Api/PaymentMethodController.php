<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentMethodController extends Controller
{
    public function index()
    {
        if (PaymentMethod::count() === 0) {
            $this->seedDefaults();
        }

        $methods = PaymentMethod::orderBy('urutan')->orderBy('nama_metode')->get();

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_metode' => 'required|string|max:255',
            'rekening' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'jenis' => 'required|in:bank,ewallet,qris,lainnya',
            'is_active' => 'sometimes|boolean',
            'urutan' => 'sometimes|integer|min:0',
        ]);

        $validated['id'] = (string) Str::uuid();
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['urutan'] = $validated['urutan'] ?? PaymentMethod::max('urutan') + 1;

        $method = PaymentMethod::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran berhasil ditambahkan.',
            'data' => $method,
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $method = PaymentMethod::findOrFail($id);

        $validated = $request->validate([
            'nama_metode' => 'sometimes|string|max:255',
            'rekening' => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'jenis' => 'sometimes|in:bank,ewallet,qris,lainnya',
            'is_active' => 'sometimes|boolean',
            'urutan' => 'sometimes|integer|min:0',
        ]);

        $method->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran berhasil diperbarui.',
            'data' => $method->fresh(),
        ]);
    }

    public function destroy(string $id)
    {
        $method = PaymentMethod::findOrFail($id);
        $method->delete();

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran berhasil dihapus.',
        ]);
    }

    protected function seedDefaults(): void
    {
        $defaultMethods = [
            [
                'id' => (string) Str::uuid(),
                'nama_metode' => 'Bank BCA',
                'rekening' => '1234567890 a.n. LPK Leles',
                'deskripsi' => 'Transfer antar bank BCA',
                'jenis' => 'bank',
                'is_active' => true,
                'urutan' => 1,
            ],
            [
                'id' => (string) Str::uuid(),
                'nama_metode' => 'Bank Mandiri',
                'rekening' => '9876543210 a.n. LPK Leles',
                'deskripsi' => 'Transfer antar bank Mandiri',
                'jenis' => 'bank',
                'is_active' => true,
                'urutan' => 2,
            ],
            [
                'id' => (string) Str::uuid(),
                'nama_metode' => 'QRIS',
                'rekening' => 'Scan QRIS untuk pembayaran cepat',
                'deskripsi' => 'Pembayaran via QRIS',
                'jenis' => 'qris',
                'is_active' => true,
                'urutan' => 3,
            ],
            [
                'id' => (string) Str::uuid(),
                'nama_metode' => 'E-Wallet',
                'rekening' => '0812-3456-7890 a.n. LPK Leles',
                'deskripsi' => 'Dana / GoPay / OVO',
                'jenis' => 'ewallet',
                'is_active' => true,
                'urutan' => 4,
            ],
        ];

        foreach ($defaultMethods as $method) {
            PaymentMethod::create($method);
        }
    }
}
