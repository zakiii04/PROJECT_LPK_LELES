<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HasilUjianSeeder extends Seeder
{
    public function run(): void
    {
        $hasilUjians = [
            // --- Pretest Andi ---
            [
                'id'           => 'HU-000000-0000-0000-000000000001',
                'tipe'         => 'pretest',
                'nilai'        => 60.00,
                'benar'        => 3,
                'salah'        => 2,
                'total_soal'   => 5,
                'tanggal'      => '2026-05-15 09:00:00',
                'pendaftar_id' => 'PD-000000-0000-0000-000000000001',
            ],
            // --- Posttest Andi ---
            [
                'id'           => 'HU-000000-0000-0000-000000000002',
                'tipe'         => 'posttest',
                'nilai'        => 88.00,
                'benar'        => 4,
                'salah'        => 1,
                'total_soal'   => 5,
                'tanggal'      => '2026-08-25 09:00:00',
                'pendaftar_id' => 'PD-000000-0000-0000-000000000001',
            ],
            // --- Pretest Siti ---
            [
                'id'           => 'HU-000000-0000-0000-000000000003',
                'tipe'         => 'pretest',
                'nilai'        => 40.00,
                'benar'        => 2,
                'salah'        => 3,
                'total_soal'   => 5,
                'tanggal'      => '2026-05-15 09:00:00',
                'pendaftar_id' => 'PD-000000-0000-0000-000000000002',
            ],
            // --- Posttest Siti ---
            [
                'id'           => 'HU-000000-0000-0000-000000000004',
                'tipe'         => 'posttest',
                'nilai'        => 80.00,
                'benar'        => 4,
                'salah'        => 1,
                'total_soal'   => 5,
                'tanggal'      => '2026-08-25 09:30:00',
                'pendaftar_id' => 'PD-000000-0000-0000-000000000002',
            ],
            // --- Pretest Rizky ---
            [
                'id'           => 'HU-000000-0000-0000-000000000005',
                'tipe'         => 'pretest',
                'nilai'        => 80.00,
                'benar'        => 4,
                'salah'        => 1,
                'total_soal'   => 5,
                'tanggal'      => '2026-05-15 09:00:00',
                'pendaftar_id' => 'PD-000000-0000-0000-000000000003',
            ],
            // --- Posttest Rizky ---
            [
                'id'           => 'HU-000000-0000-0000-000000000006',
                'tipe'         => 'posttest',
                'nilai'        => 100.00,
                'benar'        => 5,
                'salah'        => 0,
                'total_soal'   => 5,
                'tanggal'      => '2026-08-25 10:00:00',
                'pendaftar_id' => 'PD-000000-0000-0000-000000000003',
            ],
        ];

        DB::table('hasil_ujians')->insert($hasilUjians);
    }
}
