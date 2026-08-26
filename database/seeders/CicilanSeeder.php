<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CicilanSeeder extends Seeder
{
    public function run(): void
    {
        // Hanya Siti (PD-002) yang menggunakan cicilan — 3 termin dari Rp 4.500.000
        $cicilans = [
            [
                'id'                  => 'CIL-0000-0000-0000-000000000001',
                'termin'              => 1,
                'jumlah'              => 1500000,
                'jatuh_tempo'         => '2026-04-10 17:00:00',
                'status'              => 'lunas',
                'metode_pembayaran'   => 'Transfer Bank',
                'bukti_pembayaran'    => 'bukti/cicilan/siti-termin1.jpg',
                'tanggal_bayar'       => '2026-04-02 11:00:00',
                'tanggal_verifikasi'  => '2026-04-03 09:00:00',
                'catatan_admin'       => 'Termin 1 diterima dan dikonfirmasi.',
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000002',
            ],
            [
                'id'                  => 'CIL-0000-0000-0000-000000000002',
                'termin'              => 2,
                'jumlah'              => 1500000,
                'jatuh_tempo'         => '2026-06-10 17:00:00',
                'status'              => 'lunas',
                'metode_pembayaran'   => 'QRIS',
                'bukti_pembayaran'    => 'bukti/cicilan/siti-termin2.jpg',
                'tanggal_bayar'       => '2026-06-05 10:00:00',
                'tanggal_verifikasi'  => '2026-06-06 08:30:00',
                'catatan_admin'       => 'Termin 2 diterima dan dikonfirmasi.',
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000002',
            ],
            [
                'id'                  => 'CIL-0000-0000-0000-000000000003',
                'termin'              => 3,
                'jumlah'              => 1500000,
                'jatuh_tempo'         => '2026-08-10 17:00:00',
                'status'              => 'belum_bayar',
                'metode_pembayaran'   => null,
                'bukti_pembayaran'    => null,
                'tanggal_bayar'       => null,
                'tanggal_verifikasi'  => null,
                'catatan_admin'       => null,
                'pendaftar_id'        => 'PD-000000-0000-0000-000000000002',
            ],
        ];

        DB::table('cicilans')->insert($cicilans);
    }
}
