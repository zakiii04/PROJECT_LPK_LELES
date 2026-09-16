<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('angkatans', 'instruktur_nama')) {
            Schema::table('angkatans', fn (Blueprint $table) => $table->dropColumn('instruktur_nama'));
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('angkatans', 'instruktur_nama')) {
            Schema::table('angkatans', fn (Blueprint $table) => $table->string('instruktur_nama')->nullable()->after('kuota'));
        }
    }
};
