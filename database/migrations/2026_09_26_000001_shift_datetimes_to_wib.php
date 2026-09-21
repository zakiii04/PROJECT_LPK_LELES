<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aplikasi sebelumnya berjalan di UTC padahal operasional memakai WIB.
     * Semua nilai datetime/timestamp lama tersimpan 7 jam lebih awal,
     * sehingga jam yang tampil tidak sesuai WIB. Geser +7 jam agar benar.
     * Kolom DATE murni (tgl lahir dsb.) tidak diubah.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $db = DB::getDatabaseName();
        $columns = DB::select(
            "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND DATA_TYPE IN ('datetime', 'timestamp')
             AND TABLE_NAME <> 'migrations'",
            [$db]
        );

        foreach ($columns as $c) {
            $table = str_replace('`', '', $c->TABLE_NAME);
            $column = str_replace('`', '', $c->COLUMN_NAME);
            if (!Schema::hasColumn($table, $column)) {
                continue;
            }
            DB::statement(
                "UPDATE `{$table}` SET `{$column}` = DATE_ADD(`{$column}`, INTERVAL 7 HOUR) WHERE `{$column}` IS NOT NULL"
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $db = DB::getDatabaseName();
        $columns = DB::select(
            "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND DATA_TYPE IN ('datetime', 'timestamp')
             AND TABLE_NAME <> 'migrations'",
            [$db]
        );

        foreach ($columns as $c) {
            $table = str_replace('`', '', $c->TABLE_NAME);
            $column = str_replace('`', '', $c->COLUMN_NAME);
            if (!Schema::hasColumn($table, $column)) {
                continue;
            }
            DB::statement(
                "UPDATE `{$table}` SET `{$column}` = DATE_SUB(`{$column}`, INTERVAL 7 HOUR) WHERE `{$column}` IS NOT NULL"
            );
        }
    }
};
