<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penyelesaian pelatihan per KELAS (angkatan + tempat).
     * Satu baris = satu kelas sudah diselesaikan (kelulusan peserta kelas
     * tersebut sudah diproses). Begitu SELURUH kelas dalam satu angkatan
     * selesai, status angkatan otomatis menjadi 'Selesai'.
     */
    public function up(): void
    {
        Schema::create('penyelesaian_kelas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('angkatan_id');
            $table->foreign('angkatan_id')->references('id')->on('angkatans')->onDelete('cascade');
            $table->string('tempat_pelatihan');
            $table->date('tanggal_selesai')->nullable();
            $table->timestamps();
            $table->unique(['angkatan_id', 'tempat_pelatihan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penyelesaian_kelas');
    }
};
