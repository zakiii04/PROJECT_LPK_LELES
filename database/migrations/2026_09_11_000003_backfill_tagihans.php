<?php

use App\Models\Pendaftar;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Pendaftar::with('program')->chunkById(100, function ($pendaftars) {
            foreach ($pendaftars as $pendaftar) {
                DB::table('tagihans')->insertOrIgnore([
                    'id' => Str::uuid()->toString(),
                    'pendaftar_id' => $pendaftar->id,
                    'nominal' => $pendaftar->biaya_pelatihan ?? $pendaftar->program?->harga ?? 0,
                    'status' => 'belum_lunas',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }, 'id');
    }

    public function down(): void
    {
        DB::table('tagihans')->delete();
    }
};
