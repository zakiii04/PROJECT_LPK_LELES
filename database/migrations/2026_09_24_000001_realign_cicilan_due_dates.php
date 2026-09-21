<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sesuaikan jatuh tempo cicilan yang belum dibayar ke aturan baru:
     * 11 hari dari hari pertama pelatihan (termin 1 = H, 2 = H+5, 3 = H+11).
     * Cicilan lunas / menunggu konfirmasi tidak diubah.
     */
    public function up(): void
    {
        if (!Schema::hasTable('cicilans') || !Schema::hasTable('pendaftars')) {
            return;
        }
        if (!class_exists(\App\Models\Cicilan::class)) {
            return;
        }

        $ctl = new \App\Http\Controllers\PembayaranController();

        \App\Models\Cicilan::whereIn('status', ['belum_bayar', 'ditolak'])
            ->with('pendaftar.angkatan')
            ->chunkById(200, function ($rows) use ($ctl) {
                foreach ($rows as $c) {
                    $p = $c->pendaftar;
                    if (!$p) continue;
                    $base = $ctl->hariPertamaPelatihan($p);
                    if (!$base) continue;
                    $offsets = [1 => 0, 2 => 5, 3 => 11];
                    $offset = $offsets[(int) $c->termin] ?? 11;
                    $c->update([
                        'jatuh_tempo' => $base->copy()->addDays($offset),
                    ]);
                }
            });
    }

    public function down(): void
    {
        // Tidak dikembalikan (data turunan jadwal pelatihan).
    }
};
