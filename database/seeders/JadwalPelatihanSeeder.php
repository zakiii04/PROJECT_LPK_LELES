<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JadwalPelatihanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('peserta_jadwals')->delete();
        DB::table('jadwal_pelatihans')->delete();

        $angkatanId = 'ANG-0000-0000-0000-000000000050'; // Angkatan 50 - Menjahit 2026

        // Jadwal Pelatihan 10 Hari (Hari 1 s.d. Hari 10)
        $jadwals = [
            [
                'id'                => 'JDW-0000-0000-0000-000000000001',
                'judul'             => 'Hari 1: Pre-test Ujian & Orientasi Program Menjahit',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 1,
                'tanggal'           => '2026-05-05',
                'jam'               => '08:00 - 10:00',
                'ruangan'           => 'Ruang Teori A',
                'tempat_pelatihan'  => 'Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)',
                'pengajar'          => 'Hj. Siti Rahmah, S.Ds',
                'jenis_sesi'        => 'Orientasi',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000002',
                'judul'             => 'Hari 2: Pengenalan Mesin Jahit High-Speed & K3',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 2,
                'tanggal'           => '2026-05-06',
                'jam'               => '08:00 - 12:00',
                'ruangan'           => 'Lab Pola Busana',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Sri Wahyuni, S.Pd',
                'jenis_sesi'        => 'Teori',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000003',
                'judul'             => 'Hari 3: Teknik Pengukuran Badan & Pembuatan Pola',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 3,
                'tanggal'           => '2026-05-07',
                'jam'               => '08:00 - 12:00',
                'ruangan'           => 'Lab Pola Busana',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Hj. Siti Rahmah, S.Ds',
                'jenis_sesi'        => 'Teori',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000004',
                'judul'             => 'Hari 4: Praktik Jahit Lurus & Pengenalan Jarum DBx1',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 4,
                'tanggal'           => '2026-05-08',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Workshop Utama',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Hj. Siti Rahmah, S.Ds',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000005',
                'judul'             => 'Hari 5: Pemotongan Kain & Penggunaan Mesin Obras',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 5,
                'tanggal'           => '2026-05-09',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Workshop Utama',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Sri Wahyuni, S.Pd',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000006',
                'judul'             => 'Hari 6: Praktik Jahit Kerah Kemeja & Saku Garis',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 6,
                'tanggal'           => '2026-05-11',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Workshop 2',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Dewi Ratnasari, A.Md',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000007',
                'judul'             => 'Hari 7: Praktik Jahit Busana Wanita & Gamis Modern',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 7,
                'tanggal'           => '2026-05-12',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Workshop 2',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Dewi Ratnasari, A.Md',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000008',
                'judul'             => 'Hari 8: Finishing, Gosok Setrika Uap & QC Busana',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 8,
                'tanggal'           => '2026-05-13',
                'jam'               => '08:00 - 16:00',
                'ruangan'           => 'Workshop Utama',
                'tempat_pelatihan'  => 'Workshop Menjahit Leles (Jl. Al-Kautsar No. 12, Leles)',
                'pengajar'          => 'Hj. Siti Rahmah, S.Ds',
                'jenis_sesi'        => 'Praktik',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000009',
                'judul'             => 'Hari 9: Review Evaluasi Hasil Karya & Persiapan Ujian',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 9,
                'tanggal'           => '2026-05-14',
                'jam'               => '08:00 - 12:00',
                'ruangan'           => 'Ruang Teori A',
                'tempat_pelatihan'  => 'Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)',
                'pengajar'          => 'Hj. Siti Rahmah, S.Ds',
                'jenis_sesi'        => 'Teori',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'id'                => 'JDW-0000-0000-0000-000000000010',
                'judul'             => 'Hari 10: Post-test Ujian Akhir & Evaluasi Kelulusan',
                'jenis_pelatihan'   => 'Menjahit',
                'angkatan_id'       => $angkatanId,
                'hari_ke'           => 10,
                'tanggal'           => '2026-05-15',
                'jam'               => '09:00 - 11:00',
                'ruangan'           => 'Aula Ujian',
                'tempat_pelatihan'  => 'Gedung LPK Leles Utama (Jl. Raya Leles No. 45, Garut)',
                'pengajar'          => 'Tim Penguji LPK Leles',
                'jenis_sesi'        => 'Ujian',
                'status'            => 'Selesai',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
        ];

        DB::table('jadwal_pelatihans')->insert($jadwals);

        // Alokasikan semua peserta Angkatan 50 (Andi, Siti, Rizky, Fajar) ke 10 jadwal ini
        $pesertaIds = [
            'PD-000000-0000-0000-000000000001', // Andi
            'PD-000000-0000-0000-000000000002', // Siti
            'PD-000000-0000-0000-000000000003', // Rizky
            'PD-000000-0000-0000-000000000009', // Fajar
        ];

        $pivots = [];
        foreach ($pesertaIds as $pId) {
            foreach ($jadwals as $j) {
                $pivots[] = ['pendaftar_id' => $pId, 'jadwal_id' => $j['id']];
            }
        }

        DB::table('peserta_jadwals')->insert($pivots);
    }
}
