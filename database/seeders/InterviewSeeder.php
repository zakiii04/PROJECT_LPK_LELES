<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InterviewSeeder extends Seeder
{
    public function run(): void
    {
        // Hanya peserta yang sudah diterima/ditolak yang memiliki data interview
        $interviews = [
            // Andi - Lulus
            [
                'id'                  => 'ITV-0000-0000-0000-000000000001',
                'tanggal_interview'   => '2026-04-05 09:00:00',
                'pewawancara'         => 'Dewi Ratnasari, A.Md',
                'skor_komunikasi'     => 85,
                'skor_sikap'          => 90,
                'skor_kesiapan'       => 88,
                'skor_total'          => 87.67,
                'catatan'             => 'Kandidat menunjukkan motivasi tinggi dan komunikasi yang baik. Sangat berpotensi.',
                'status'              => 'Lulus',
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000001',
            ],
            // Siti - Lulus
            [
                'id'                  => 'ITV-0000-0000-0000-000000000002',
                'tanggal_interview'   => '2026-04-05 10:00:00',
                'pewawancara'         => 'Dewi Ratnasari, A.Md',
                'skor_komunikasi'     => 80,
                'skor_sikap'          => 85,
                'skor_kesiapan'       => 82,
                'skor_total'          => 82.33,
                'catatan'             => 'Kandidat cukup percaya diri dan mempunyai passion di bidang pastry.',
                'status'              => 'Lulus',
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000002',
            ],
            // Rizky - Lulus
            [
                'id'                  => 'ITV-0000-0000-0000-000000000003',
                'tanggal_interview'   => '2026-04-06 09:00:00',
                'pewawancara'         => 'Budi Santoso, S.Par',
                'skor_komunikasi'     => 78,
                'skor_sikap'          => 80,
                'skor_kesiapan'       => 83,
                'skor_total'          => 80.33,
                'catatan'             => 'Memiliki pengalaman memasak di rumah. Perlu peningkatan kepercayaan diri.',
                'status'              => 'Lulus',
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000003',
            ],
            // Dian - Tidak Lulus
            [
                'id'                  => 'ITV-0000-0000-0000-000000000004',
                'tanggal_interview'   => '2026-08-25 13:00:00',
                'pewawancara'         => 'Rina Wulandari, S.Par',
                'skor_komunikasi'     => 55,
                'skor_sikap'          => 60,
                'skor_kesiapan'       => 50,
                'skor_total'          => 55.00,
                'catatan'             => 'Kandidat kurang memahami bidang pelatihan yang dipilih dan motivasi terlihat kurang kuat.',
                'status'              => 'Tidak Lulus',
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000005',
            ],
        ];

        DB::table('interviews')->insert($interviews);
    }
}
