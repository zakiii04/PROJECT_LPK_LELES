<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kehadirans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->dateTime('tanggal');
            $table->enum('status_kehadiran', ['Hadir', 'Izin', 'Sakit', 'Alpha']);
            $table->string('catatan')->nullable();
            $table->uuid('pendaftar_id');
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kehadirans');
    }
};
