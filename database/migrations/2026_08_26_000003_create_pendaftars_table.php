<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftars', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('no_pendaftaran')->unique();
            $table->dateTime('tanggal_daftar')->useCurrent();
            $table->enum('status', ['menunggu', 'diterima', 'ditolak'])->default('menunggu');

            // Data Diri
            $table->string('nama_lengkap');
            $table->string('nik')->unique();
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('jenis_kelamin');
            $table->text('alamat');

            // Data Fisik
            $table->string('tinggi_badan');
            $table->string('berat_badan');
            $table->string('lingkar_pinggang');
            $table->string('riwayat_penyakit')->nullable();

            // Kontak dan pendidikan
            $table->string('no_hp');
            $table->string('email');
            $table->string('jenjang_pendidikan')->nullable();
            $table->string('asal_sekolah')->nullable();
            $table->unsignedSmallInteger('tahun_lulus')->nullable();

            // Pilihan Pelatihan
            $table->string('jenis_pelatihan');
            $table->string('program_id')->nullable();
            $table->foreign('program_id')->references('id')->on('program_pelatihans')->onDelete('set null');
            $table->string('tempat_pelatihan')->nullable();
            $table->text('motivasi');

            // Alokasi Angkatan
            $table->uuid('angkatan_id')->nullable();
            $table->foreign('angkatan_id')->references('id')->on('angkatans')->onDelete('set null');

            // Akun Login Peserta
            $table->uuid('user_id')->nullable()->unique();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');

            // Status Pembayaran
            $table->double('biaya_pelatihan');
            $table->enum('status_pembayaran', ['belum_bayar', 'menunggu_konfirmasi', 'cicilan_sebagian', 'lunas'])->default('belum_bayar');
            $table->enum('jenis_pembayaran', ['lunas', 'cicilan'])->nullable();
            $table->string('metode_pembayaran')->nullable();
            $table->string('bukti_pembayaran')->nullable();
            $table->dateTime('tanggal_bayar')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftars');
    }
};
