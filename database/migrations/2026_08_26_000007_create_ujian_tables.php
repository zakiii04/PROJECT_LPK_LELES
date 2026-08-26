<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soal_ujians', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('jenis_pelatihan'); // 'Semua' atau ID Program
            $table->enum('tipe', ['pretest', 'posttest'])->default('pretest');
            $table->text('pertanyaan');
            $table->json('opsi'); // Array pilihan A, B, C, D (stored as JSON)
            $table->integer('jawaban_benar'); // Index 0..3
            $table->string('program_id')->nullable();
            $table->foreign('program_id')->references('id')->on('program_pelatihans')->onDelete('set null');
        });

        Schema::create('hasil_ujians', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('tipe', ['pretest', 'posttest']);
            $table->double('nilai');
            $table->integer('benar');
            $table->integer('salah');
            $table->integer('total_soal');
            $table->dateTime('tanggal')->useCurrent();
            $table->uuid('pendaftar_id');
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hasil_ujians');
        Schema::dropIfExists('soal_ujians');
    }
};
