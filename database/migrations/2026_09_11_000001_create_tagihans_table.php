<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tagihans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pendaftar_id')->unique();
            $table->decimal('nominal', 15, 2);
            $table->enum('status', ['belum_lunas', 'lunas'])->default('belum_lunas');
            $table->timestamps();
            $table->foreign('pendaftar_id')->references('id')->on('pendaftars')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tagihans');
    }
};
