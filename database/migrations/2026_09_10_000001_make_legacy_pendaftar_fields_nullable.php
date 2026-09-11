<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->string('jenis_kelamin')->nullable()->change();
            $table->string('nama_kontak_darurat')->nullable()->change();
            $table->string('no_hp_kontak_darurat')->nullable()->change();
            $table->string('hubungan_kontak_darurat')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->string('jenis_kelamin')->nullable(false)->change();
            $table->string('nama_kontak_darurat')->nullable(false)->change();
            $table->string('no_hp_kontak_darurat')->nullable(false)->change();
            $table->string('hubungan_kontak_darurat')->nullable(false)->change();
        });
    }
};
