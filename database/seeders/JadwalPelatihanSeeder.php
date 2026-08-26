<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JadwalPelatihanSeeder extends Seeder
{
    public function run(): void
    {
        // Jadwal untuk angkatan Tata Boga (On_Going)
        $jadwals = [
            [
                'id'                => 'JDW-0000-0000-0000-000000000001',
                'judul'             => 'Orientasi & Pengenalan Program',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-05-05',
                'jam'               => '08:00 - 10:00',
                'ruangan'           => 'Aula Utama',
                'jenis_sesi'        => 'Orientasi',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000002',
                'judul'             => 'Dasar-Dasar Ilmu Gizi & Sanitasi Makanan',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-05-06',
                'jam'               => '08:00 - 12:00',
                'ruangan'           => 'Ruang Kelas A',
                'jenis_sesi'        => 'Teori',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000003',
                'judul'             => 'Teknik Dasar Pengolahan Bahan Makanan',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-05-08',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Dapur Praktik 1',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000004',
                'judul'             => 'Masakan Indonesia Tradisional',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-05-13',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Dapur Praktik 1',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000005',
                'judul'             => 'Pretest Modul 1 - Dasar Tata Boga',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-05-15',
                'jam'               => '09:00 - 11:00',
                'ruangan'           => 'Ruang Ujian',
                'jenis_sesi'        => 'Ujian',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000006',
                'judul'             => 'Pengenalan Pastry & Bakery',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-06-03',
                'jam'               => '08:00 - 12:00',
                'ruangan'           => 'Ruang Kelas A',
                'jenis_sesi'        => 'Teori',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000007',
                'judul'             => 'Praktik Roti & Kue Kering',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-06-05',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Dapur Pastry',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000008',
                'judul'             => 'Posttest Modul 2 - Pastry & Bakery',
                'jenis_pelatihan'   => 'Tata Boga & Pastry',
                'tanggal'           => '2026-08-25',
                'jam'               => '09:00 - 11:00',
                'ruangan'           => 'Ruang Ujian',
                'jenis_sesi'        => 'Ujian',
                'status'            => 'Reguler',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
        ];

        DB::table('jadwal_pelatihans')->insert($jadwals);

        // Mapping peserta ke jadwal (semua 3 peserta TB ikut semua jadwal TB)
        $pesertaIds = [
            'PD-000000-0000-0000-000000000001', // Andi
            'PD-000000-0000-0000-000000000002', // Siti
            'PD-000000-0000-0000-000000000003', // Rizky
        ];

        $jadwalIds = [
            'JDW-0000-0000-0000-000000000001',
            'JDW-0000-0000-0000-000000000002',
            'JDW-0000-0000-0000-000000000003',
            'JDW-0000-0000-0000-000000000004',
            'JDW-0000-0000-0000-000000000005',
            'JDW-0000-0000-0000-000000000006',
            'JDW-0000-0000-0000-000000000007',
            'JDW-0000-0000-0000-000000000008',
        ];

        $pivots = [];
        foreach ($pesertaIds as $pId) {
            foreach ($jadwalIds as $jId) {
                $pivots[] = ['pendaftar_id' => $pId, 'jadwal_id' => $jId];
            }
        }

        DB::table('peserta_jadwals')->insert($pivots);
    }
}
