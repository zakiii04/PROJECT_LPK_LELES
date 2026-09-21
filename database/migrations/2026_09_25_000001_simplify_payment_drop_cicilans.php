<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penyederhanaan pembayaran: hanya tabel tagihans + pembayarans.
     * - tagihans.nominal = SISA yang belum dibayar (berkurang tiap validasi).
     * - tagihans.tanggal_bayar = pembayaran pertama yang divalidasi.
     * - tagihans.tanggal_terakhir_bayar = validasi terakhir.
     * - tabel cicilans dihapus.
     */
    public function up(): void
    {
        Schema::table('tagihans', function (Blueprint $table) {
            if (!Schema::hasColumn('tagihans', 'tanggal_bayar')) {
                $table->dateTime('tanggal_bayar')->nullable()->after('status');
            }
            if (!Schema::hasColumn('tagihans', 'tanggal_terakhir_bayar')) {
                $table->dateTime('tanggal_terakhir_bayar')->nullable()->after('tanggal_bayar');
            }
        });

        // Sesuaikan nominal lama (total awal) menjadi sisa berjalan.
        DB::table('tagihans')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $t) {
                $diterima = DB::table('pembayarans')
                    ->where('tagihan_id', $t->id)
                    ->where('status', 'diterima')
                    ->get();

                $sisa = max(0, (float) $t->nominal - (float) $diterima->sum('nominal'));
                $first = $diterima->sortBy('tanggal_bayar')->first();
                $last = $diterima->sortByDesc(fn($r) => $r->tanggal_verifikasi ?? $r->tanggal_bayar)->first();

                DB::table('tagihans')->where('id', $t->id)->update([
                    'nominal' => $sisa,
                    'status' => $sisa <= 0 && $diterima->count() > 0 ? 'lunas' : $t->status,
                    'tanggal_bayar' => $first->tanggal_bayar ?? null,
                    'tanggal_terakhir_bayar' => $last ? ($last->tanggal_verifikasi ?? $last->tanggal_bayar) : null,
                ]);
            }
        });

        // Sinkron status_pembayaran pendaftar mengikuti aturan baru.
        $tagihans = DB::table('tagihans')->get();
        foreach ($tagihans as $t) {
            $menunggu = DB::table('pembayarans')->where('tagihan_id', $t->id)->where('status', 'menunggu_verifikasi')->exists();
            $diterima = DB::table('pembayarans')->where('tagihan_id', $t->id)->where('status', 'diterima')->exists();
            if ((float) $t->nominal <= 0 && $diterima) {
                $status = 'lunas';
            } elseif ($menunggu) {
                $status = 'menunggu_konfirmasi';
            } elseif ($diterima) {
                $status = 'cicilan_sebagian';
            } else {
                $status = 'belum_bayar';
            }
            DB::table('pendaftars')->where('id', $t->pendaftar_id)->update(['status_pembayaran' => $status]);
        }

        Schema::dropIfExists('cicilans');
    }

    public function down(): void
    {
        Schema::table('tagihans', function (Blueprint $table) {
            if (Schema::hasColumn('tagihans', 'tanggal_terakhir_bayar')) {
                $table->dropColumn('tanggal_terakhir_bayar');
            }
            if (Schema::hasColumn('tagihans', 'tanggal_bayar')) {
                $table->dropColumn('tanggal_bayar');
            }
        });
        // Tabel cicilans tidak dikembalikan (skema dihapus permanen).
    }
};
