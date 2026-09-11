<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mata_pelajarans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode', 20);
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->string('program_id')->nullable();
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });

        Schema::create('nilais', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pendaftar_id');
            $table->uuid('mata_pelajaran_id')->nullable();
            $table->enum('tipe_nilai', ['mata_pelajaran', 'pretest', 'posttest', 'kehadiran'])->default('mata_pelajaran');
            $table->float('nilai')->default(0);
            $table->text('catatan')->nullable();
            $table->date('tanggal')->nullable();
            $table->timestamps();

            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
            $table->foreign('mata_pelajaran_id')->references('id')->on('mata_pelajarans')->onDelete('set null');
            // Unique: one score per peserta per mata_pelajaran per tipe
            $table->unique(['pendaftar_id', 'mata_pelajaran_id', 'tipe_nilai'], 'nilai_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nilais');
        Schema::dropIfExists('mata_pelajarans');
    }
};
