<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KelulusanSeeder extends Seeder
{
    public function run(): void
    {
        // Hanya peserta yang sudah menyelesaikan program memiliki data kelulusan
        // Dalam contoh ini, Andi dan Rizky lulus, Siti masih Dalam_Proses
        $kelulusans = [
            // Andi - Lulus
            [
                'id'                => 'KLS-0000-0000-0000-000000000001',
                'nilai_pretest'     => 60.00,
                'nilai_posttest'    => 88.00,
                'nilai_kehadiran'   => 100.00, // 6/6 hadir = 100%
                'nilai_tugas'       => 85.00,
                'nilai_akhir'       => 86.75, // Rata-rata tertimbang
                'status_kelulusan'  => 'Lulus',
                'tanggal_lulus'     => '28 Agustus 2026',
                'no_sertifikat'     => 'SERT-LPK-TB-2026-00001',
                'created_at'        => now(),
                'updated_at'        => now(),
                'pendaftar_id'      => 'PD-000000-0000-0000-000000000001',
            ],
            // Siti - Dalam Proses
            [
                'id'                => 'KLS-0000-0000-0000-000000000002',
                'nilai_pretest'     => 40.00,
                'nilai_posttest'    => 80.00,
                'nilai_kehadiran'   => 66.67, // 4/6 hadir = 66.67%
                'nilai_tugas'       => 78.00,
                'nilai_akhir'       => 72.50,
                'status_kelulusan'  => 'Dalam_Proses',
                'tanggal_lulus'     => '-',
                'no_sertifikat'     => 'SERT-LPK-TB-2026-00002',
                'created_at'        => now(),
                'updated_at'        => now(),
                'pendaftar_id'      => 'PD-000000-0000-0000-000000000002',
            ],
            // Rizky - Lulus (nilai terbaik)
            [
                'id'                => 'KLS-0000-0000-0000-000000000003',
                'nilai_pretest'     => 80.00,
                'nilai_posttest'    => 100.00,
                'nilai_kehadiran'   => 83.33, // 5/6 hadir = 83.33%
                'nilai_tugas'       => 92.00,
                'nilai_akhir'       => 91.33,
                'status_kelulusan'  => 'Lulus',
                'tanggal_lulus'     => '28 Agustus 2026',
                'no_sertifikat'     => 'SERT-LPK-TB-2026-00003',
                'created_at'        => now(),
                'updated_at'        => now(),
                'pendaftar_id'      => 'PD-000000-0000-0000-000000000003',
            ],
        ];

        DB::table('kelulusans')->insert($kelulusans);
    }
}
