<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hasil_ujians', function (Blueprint $table) {
            // Snapshot rincian jawaban per soal untuk croschek admin/instruktur:
            // [{ soal_id, pertanyaan, opsi[], jawaban_peserta, jawaban_benar, benar }]
            $table->json('detail')->nullable()->after('total_soal');
        });
    }

    public function down(): void
    {
        Schema::table('hasil_ujians', function (Blueprint $table) {
            $table->dropColumn('detail');
        });
    }
};
