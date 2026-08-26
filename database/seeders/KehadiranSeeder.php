<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KehadiranSeeder extends Seeder
{
    public function run(): void
    {
        // Sesi yang memiliki kehadiran (selain Ujian)
        $sesiTanggal = [
            '2026-05-05', // Orientasi
            '2026-05-06', // Teori
            '2026-05-08', // Praktik
            '2026-05-13', // Praktik
            '2026-06-03', // Teori
            '2026-06-05', // Praktik
        ];

        $peserta = [
            // [pendaftar_id, kehadiran per sesi]
            [
                'id'   => 'PD-000000-0000-0000-000000000001', // Andi
                'hadir' => ['Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir', 'Hadir'],
            ],
            [
                'id'    => 'PD-000000-0000-0000-000000000002', // Siti
                'hadir' => ['Hadir', 'Hadir', 'Izin', 'Hadir', 'Hadir', 'Sakit'],
            ],
            [
                'id'    => 'PD-000000-0000-0000-000000000003', // Rizky
                'hadir' => ['Hadir', 'Hadir', 'Hadir', 'Alpha', 'Hadir', 'Hadir'],
            ],
        ];

        $catatan = [
            'Izin'  => 'Izin keperluan keluarga yang mendesak.',
            'Sakit' => 'Sakit flu, disertai surat keterangan dokter.',
            'Alpha' => null,
            'Hadir' => null,
        ];

        $rows = [];
        $counter = 1;
        foreach ($peserta as $p) {
            foreach ($sesiTanggal as $i => $tanggal) {
                $status = $p['hadir'][$i];
                $rows[] = [
                    'id'               => sprintf('KHD-%04d-0000-0000-0000-000000000%03d', $counter, $counter),
                    'tanggal'          => $tanggal . ' 08:00:00',
                    'status_kehadiran' => $status,
                    'catatan'          => $catatan[$status],
                    'pendaftar_id'     => $p['id'],
                ];
                $counter++;
            }
        }

        DB::table('kehadirans')->insert($rows);
    }
}
