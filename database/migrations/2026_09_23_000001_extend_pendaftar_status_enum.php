<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const NEW = ['menunggu', 'diterima', 'ditolak', 'lulus', 'sudah_bekerja', 'keluar'];
    private const OLD = ['menunggu', 'diterima', 'ditolak'];

    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $list = implode("','", self::NEW);
            DB::statement("ALTER TABLE `pendaftars` MODIFY COLUMN `status` ENUM('{$list}') NOT NULL DEFAULT 'menunggu'");
            return;
        }

        Schema::table('pendaftars', function (Blueprint $table) {
            $table->string('status_tmp')->nullable();
        });
        DB::table('pendaftars')->update(['status_tmp' => DB::raw('`status`')]);
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->enum('status', self::NEW)->default('menunggu');
        });
        DB::table('pendaftars')->update(['status' => DB::raw('`status_tmp`')]);
        Schema::table('pendaftars', function (Blueprint $table) {
            $table->dropColumn('status_tmp');
        });
    }

    public function down(): void
    {
        // Kembalikan hanya bila tidak ada baris memakai status baru.
        $used = DB::table('pendaftars')->whereNotIn('status', self::OLD)->count();
        if ($used > 0) {
            throw new \RuntimeException("Tidak bisa rollback: {$used} baris memakai status baru (lulus/sudah_bekerja/keluar).");
        }

        if (DB::getDriverName() === 'mysql') {
            $list = implode("','", self::OLD);
            DB::statement("ALTER TABLE `pendaftars` MODIFY COLUMN `status` ENUM('{$list}') NOT NULL DEFAULT 'menunggu'");
        }
    }
};
