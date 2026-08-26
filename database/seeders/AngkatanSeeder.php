<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AngkatanSeeder extends Seeder
{
    public function run(): void
    {
        $angkatans = [
            // Angkatan Selesai
            [
                'id'                       => 'ANG-0000-0000-0000-000000000001',
                'kode_angkatan'            => 'ANG-MR-2025-I',
                'nama_angkatan'            => 'Angkatan I - Manajemen Restoran 2025',
                'tahun'                    => 2025,
                'periode'                  => 'Januari - Maret 2025',
                'tgl_mulai_pendaftaran'    => '2024-11-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2024-12-20 17:00:00',
                'tanggal_mulai'            => '2025-01-06 08:00:00',
                'tanggal_selesai'          => '2025-03-28 17:00:00',
                'kuota'                    => 30,
                'instruktur_nama'          => 'Budi Santoso, S.Par',
                'status'                   => 'Selesai',
                'program_id'               => 'PROG-MNJMN-RESTORAN',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            // Angkatan On Going
            [
                'id'                       => 'ANG-0000-0000-0000-000000000002',
                'kode_angkatan'            => 'ANG-TB-2026-I',
                'nama_angkatan'            => 'Angkatan I - Tata Boga & Pastry 2026',
                'tahun'                    => 2026,
                'periode'                  => 'Mei - Agustus 2026',
                'tgl_mulai_pendaftaran'    => '2026-03-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2026-04-20 17:00:00',
                'tanggal_mulai'            => '2026-05-05 08:00:00',
                'tanggal_selesai'          => '2026-08-29 17:00:00',
                'kuota'                    => 25,
                'instruktur_nama'          => 'Dewi Ratnasari, A.Md',
                'status'                   => 'On_Going',
                'program_id'               => 'PROG-TATA-BOGA',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            // Angkatan Pendaftaran
            [
                'id'                       => 'ANG-0000-0000-0000-000000000003',
                'kode_angkatan'            => 'ANG-HK-2026-I',
                'nama_angkatan'            => 'Angkatan I - Housekeeping Hotel 2026',
                'tahun'                    => 2026,
                'periode'                  => 'Oktober - November 2026',
                'tgl_mulai_pendaftaran'    => '2026-08-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2026-09-20 17:00:00',
                'tanggal_mulai'            => '2026-10-05 08:00:00',
                'tanggal_selesai'          => '2026-11-28 17:00:00',
                'kuota'                    => 20,
                'instruktur_nama'          => 'Rina Wulandari, S.Par',
                'status'                   => 'Pendaftaran',
                'program_id'               => 'PROG-HOUSEKEEPING',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            // Angkatan Mendatang
            [
                'id'                       => 'ANG-0000-0000-0000-000000000004',
                'kode_angkatan'            => 'ANG-BAR-2026-I',
                'nama_angkatan'            => 'Angkatan I - Barista & Coffee Shop 2026',
                'tahun'                    => 2026,
                'periode'                  => 'November 2026 - Januari 2027',
                'tgl_mulai_pendaftaran'    => '2026-09-01 08:00:00',
                'tgl_selesai_pendaftaran'  => '2026-10-15 17:00:00',
                'tanggal_mulai'            => '2026-11-03 08:00:00',
                'tanggal_selesai'          => '2027-01-23 17:00:00',
                'kuota'                    => 20,
                'instruktur_nama'          => 'Ahmad Fauzi, S.T',
                'status'                   => 'Mendatang',
                'program_id'               => 'PROG-BARISTA',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
        ];

        DB::table('angkatans')->insert($angkatans);
    }
}
