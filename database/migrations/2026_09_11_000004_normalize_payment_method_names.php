<?php

use App\Models\Pembayaran;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Pembayaran::with('paymentMethod')->chunkById(100, function ($payments) {
            foreach ($payments as $payment) {
                if ($payment->paymentMethod) {
                    $payment->updateQuietly([
                        'metode_pembayaran' => $payment->paymentMethod->nama_metode,
                    ]);
                }
            }
        }, 'id');
    }

    public function down(): void
    {
        // The original UUID values are intentionally not restored.
    }
};
