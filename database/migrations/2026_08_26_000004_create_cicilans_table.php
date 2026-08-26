<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cicilans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('termin'); // 1, 2, atau 3
            $table->double('jumlah');
            $table->dateTime('jatuh_tempo');
            $table->string('status'); // belum_bayar, menunggu_konfirmasi, lunas, ditolak
            $table->string('metode_pembayaran')->nullable();
            $table->string('bukti_pembayaran')->nullable();
            $table->dateTime('tanggal_bayar')->nullable();
            $table->dateTime('tanggal_verifikasi')->nullable();
            $table->string('catatan_admin')->nullable();
            $table->uuid('pendaftar_id');
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cicilans');
    }
};
