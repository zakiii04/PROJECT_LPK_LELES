<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kelulusans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->double('nilai_pretest');
            $table->double('nilai_posttest');
            $table->double('nilai_kehadiran');
            $table->double('nilai_tugas');
            $table->double('nilai_akhir');
            $table->enum('status_kelulusan', ['Lulus', 'Tidak_Lulus', 'Dalam_Proses']);
            $table->string('tanggal_lulus');
            $table->string('no_sertifikat')->unique();
            $table->timestamps(); // created_at
            $table->uuid('pendaftar_id')->unique();
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kelulusans');
    }
};
