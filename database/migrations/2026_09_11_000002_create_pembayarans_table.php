<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayarans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tagihan_id');
            $table->decimal('nominal', 15, 2);
            $table->enum('tipe_pembayaran', ['cash', 'transfer']);
            $table->string('nama_penerima')->nullable();
            $table->string('nama_pengirim')->nullable();
            $table->string('jenis_pengirim')->nullable();
            $table->uuid('payment_method_id')->nullable();
            $table->string('metode_pembayaran')->nullable();
            $table->string('bukti_pembayaran')->nullable();
            $table->enum('status', ['menunggu_verifikasi', 'diterima', 'ditolak'])->default('menunggu_verifikasi');
            $table->dateTime('tanggal_bayar');
            $table->dateTime('tanggal_verifikasi')->nullable();
            $table->string('catatan_admin')->nullable();
            $table->timestamps();
            $table->foreign('tagihan_id')->references('id')->on('tagihans')->onDelete('cascade');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayarans');
    }
};
