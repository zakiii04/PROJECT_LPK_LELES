<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tempat_pelatihans', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('nama_tempat');
            $table->text('alamat_lengkap');
            $table->integer('kapasitas')->default(30);
            $table->string('fasilitas')->nullable();
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tempat_pelatihans');
    }
};
