<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal_pelatihans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('judul');
            $table->string('jenis_pelatihan');
            $table->string('tanggal');
            $table->string('jam');
            $table->string('ruangan');
            $table->enum('jenis_sesi', ['Orientasi', 'Teori', 'Praktik', 'Ujian'])->default('Teori');
            $table->string('status')->default('Reguler');
            $table->timestamps(); // created_at
        });

        Schema::create('peserta_jadwals', function (Blueprint $table) {
            $table->uuid('pendaftar_id');
            $table->uuid('jadwal_id');
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
            $table->foreign('jadwal_id')->references('id')->on('jadwal_pelatihans')->onDelete('cascade');
            $table->primary(['pendaftar_id', 'jadwal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peserta_jadwals');
        Schema::dropIfExists('jadwal_pelatihans');
    }
};
