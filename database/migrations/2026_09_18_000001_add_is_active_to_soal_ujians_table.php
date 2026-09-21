<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('soal_ujians', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('gambar_soal');
        });
    }

    public function down(): void
    {
        Schema::table('soal_ujians', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
