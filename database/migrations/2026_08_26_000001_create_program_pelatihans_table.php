<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_pelatihans', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('nama')->unique();
            $table->text('deskripsi');
            $table->string('durasi');
            $table->double('harga');
            $table->string('harga_formatted');
            $table->string('icon')->nullable();
            $table->timestamps(); // created_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_pelatihans');
    }
};
