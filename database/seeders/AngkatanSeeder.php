<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AngkatanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('angkatans')->delete();

        $angkatans = [
            // Angkatan 49 (Selesai)
            [
                'id'                       => 'ANG-0000-0000-0000-000000000049',
                'kode_angkatan'            => 'ANG-49',
                'nama_angkatan'            => 'Angkatan 49 - Menjahit 2025',
                'tahun'                    => 2025,
                'periode'                  => 'Oktober - Desember 2025',
                'tgl_mulai_pendaftaran'    => '2025-08-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2025-09-20 17:00:00',
                'tanggal_mulai'            => '2025-10-01 08:00:00',
                'tanggal_selesai'          => '2025-12-28 17:00:00',
                'kuota'                    => 30,
                'status'                   => 'Selesai',
                'program_id'               => 'PROG-MENJAHIT',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            // Angkatan 50 (On Going)
            [
                'id'                       => 'ANG-0000-0000-0000-000000000050',
                'kode_angkatan'            => 'ANG-50',
                'nama_angkatan'            => 'Angkatan 50 - Menjahit 2026',
                'tahun'                    => 2026,
                'periode'                  => 'Mei - Agustus 2026',
                'tgl_mulai_pendaftaran'    => '2026-03-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2026-04-20 17:00:00',
                'tanggal_mulai'            => '2026-05-05 08:00:00',
                'tanggal_selesai'          => '2026-08-29 17:00:00',
                'kuota'                    => 25,
                'status'                   => 'On_Going',
                'program_id'               => 'PROG-MENJAHIT',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            // Angkatan 51 (Pendaftaran Buka)
            [
                'id'                       => 'ANG-0000-0000-0000-000000000051',
                'kode_angkatan'            => 'ANG-51',
                'nama_angkatan'            => 'Angkatan 51 - Menjahit 2026',
                'tahun'                    => 2026,
                'periode'                  => 'September - November 2026',
                'tgl_mulai_pendaftaran'    => '2026-08-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2026-09-20 17:00:00',
                'tanggal_mulai'            => '2026-10-01 08:00:00',
                'tanggal_selesai'          => '2026-12-20 17:00:00',
                'kuota'                    => 30,
                'status'                   => 'Pendaftaran',
                'program_id'               => 'PROG-MENJAHIT',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
        ];

        DB::table('angkatans')->insert($angkatans);
    }
}
