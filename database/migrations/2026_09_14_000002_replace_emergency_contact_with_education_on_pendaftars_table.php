<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $legacyColumns = ['nama_kontak_darurat', 'no_hp_kontak_darurat', 'hubungan_kontak_darurat'];
        $existingColumns = array_filter($legacyColumns, fn (string $column) => Schema::hasColumn('pendaftars', $column));
        $hasJenjangPendidikan = Schema::hasColumn('pendaftars', 'jenjang_pendidikan');
        $hasAsalSekolah = Schema::hasColumn('pendaftars', 'asal_sekolah');
        $hasTahunLulus = Schema::hasColumn('pendaftars', 'tahun_lulus');

        Schema::table('pendaftars', function (Blueprint $table) use ($existingColumns, $hasJenjangPendidikan, $hasAsalSekolah, $hasTahunLulus) {
            if ($existingColumns) {
                $table->dropColumn($existingColumns);
            }

            if (! $hasJenjangPendidikan) {
                $table->string('jenjang_pendidikan')->nullable()->after('email');
            }
            if (! $hasAsalSekolah) {
                $table->string('asal_sekolah')->nullable()->after('jenjang_pendidikan');
            }
            if (! $hasTahunLulus) {
                $table->unsignedSmallInteger('tahun_lulus')->nullable()->after('asal_sekolah');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->dropColumn(['jenjang_pendidikan', 'asal_sekolah', 'tahun_lulus']);
            $table->string('nama_kontak_darurat')->nullable()->after('email');
            $table->string('no_hp_kontak_darurat')->nullable()->after('nama_kontak_darurat');
            $table->string('hubungan_kontak_darurat')->nullable()->after('no_hp_kontak_darurat');
        });
    }
};
