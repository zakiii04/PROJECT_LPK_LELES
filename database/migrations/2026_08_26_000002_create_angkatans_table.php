<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('angkatans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode_angkatan')->unique();
            $table->string('nama_angkatan');
            $table->integer('tahun');
            $table->string('periode');
            $table->dateTime('tgl_mulai_pendaftaran')->nullable();
            $table->dateTime('tgl_selesai_pendaftaran')->nullable();
            $table->dateTime('tanggal_mulai');
            $table->dateTime('tanggal_selesai');
            $table->integer('kuota')->default(30);
            $table->string('instruktur_nama');
            $table->enum('status', ['Pendaftaran', 'On_Going', 'Selesai', 'Mendatang'])->default('Pendaftaran');
            $table->timestamps(); // created_at
            $table->string('program_id');
            $table->foreign('program_id')->references('id')->on('program_pelatihans')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('angkatans');
    }
};
