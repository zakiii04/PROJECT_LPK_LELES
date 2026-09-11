<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('soal_ujians', function (Blueprint $table) {
            $table->string('gambar_soal')->nullable()->after('program_id');
        });
    }

    public function down(): void
    {
        Schema::table('soal_ujians', function (Blueprint $table) {
            $table->dropColumn('gambar_soal');
        });
    }
};
