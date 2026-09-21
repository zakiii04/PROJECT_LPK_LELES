<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            if (!Schema::hasColumn('pendaftars', 'jenis_kelamin')) {
                $table->string('jenis_kelamin')->nullable()->after('tanggal_lahir');
            }
            if (!Schema::hasColumn('pendaftars', 'status_validasi')) {
                $table->enum('status_validasi', ['menunggu', 'diterima', 'ditolak'])->default('menunggu')->after('status');
            }
            if (!Schema::hasColumn('pendaftars', 'status_verifikasi')) {
                $table->enum('status_verifikasi', ['belum_proses', 'menunggu', 'diterima', 'ditolak'])->default('belum_proses')->after('status_validasi');
            }
            if (!Schema::hasColumn('pendaftars', 'catatan_validasi')) {
                $table->text('catatan_validasi')->nullable()->after('status_verifikasi');
            }
            if (!Schema::hasColumn('pendaftars', 'catatan_verifikasi')) {
                $table->text('catatan_verifikasi')->nullable()->after('catatan_validasi');
            }
            if (!Schema::hasColumn('pendaftars', 'tanggal_validasi')) {
                $table->dateTime('tanggal_validasi')->nullable()->after('catatan_verifikasi');
            }
            if (!Schema::hasColumn('pendaftars', 'tanggal_verifikasi')) {
                $table->dateTime('tanggal_verifikasi')->nullable()->after('tanggal_validasi');
            }
        });

        // Backfill existing rows to new two-stage flow:
        // menunggu        -> validasi menunggu, verifikasi belum_proses
        // diterima        -> validasi diterima, verifikasi diterima
        // ditolak         -> validasi ditolak, verifikasi belum_proses
        try {
            DB::table('pendaftars')->where('status', 'menunggu')->update([
                'status_validasi' => 'menunggu',
                'status_verifikasi' => 'belum_proses',
            ]);
            DB::table('pendaftars')->where('status', 'diterima')->update([
                'status_validasi' => 'diterima',
                'status_verifikasi' => 'diterima',
            ]);
            DB::table('pendaftars')->where('status', 'ditolak')->update([
                'status_validasi' => 'ditolak',
                'status_verifikasi' => 'belum_proses',
            ]);
            // Rows that already have angkatan/berkas but still menunggu are mid-flow:
            // treat as passed validation, waiting verification.
            DB::table('pendaftars')
                ->where('status', 'menunggu')
                ->whereNotNull('angkatan_id')
                ->update([
                    'status_validasi' => 'diterima',
                    'status_verifikasi' => 'menunggu',
                ]);
        } catch (\Throwable $e) {
            // ignore backfill errors on fresh installs
        }
    }

    public function down(): void
    {
        Schema::table('pendaftars', function (Blueprint $table) {
            $columns = ['status_validasi', 'status_verifikasi', 'catatan_validasi', 'catatan_verifikasi', 'tanggal_validasi', 'tanggal_verifikasi'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('pendaftars', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
