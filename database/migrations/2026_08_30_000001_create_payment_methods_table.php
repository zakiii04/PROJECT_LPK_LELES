<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('nama_metode');
            $table->string('rekening')->nullable();
            $table->text('deskripsi')->nullable();
            $table->enum('jenis', ['bank', 'ewallet', 'qris', 'lainnya'])->default('bank');
            $table->boolean('is_active')->default(true);
            $table->integer('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
