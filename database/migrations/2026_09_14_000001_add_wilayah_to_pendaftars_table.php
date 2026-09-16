<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Store the administrative address selected in the registration form. */
    public function up(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->string('provinsi')->nullable()->after('alamat');
            $table->string('kabupaten_kota')->nullable()->after('provinsi');
            $table->string('kecamatan')->nullable()->after('kabupaten_kota');
            $table->string('desa_kelurahan')->nullable()->after('kecamatan');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->dropColumn(['provinsi', 'kabupaten_kota', 'kecamatan', 'desa_kelurahan']);
        });
    }
};
