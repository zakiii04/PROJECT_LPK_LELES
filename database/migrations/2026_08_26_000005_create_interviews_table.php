<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->dateTime('tanggal_interview');
            $table->string('pewawancara');
            $table->integer('skor_komunikasi');
            $table->integer('skor_sikap');
            $table->integer('skor_kesiapan');
            $table->double('skor_total');
            $table->text('catatan')->nullable();
            $table->string('status'); // Lulus, Pertimbangan, Tidak Lulus
            $table->uuid('pendaftar_id')->unique();
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
