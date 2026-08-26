<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProgramPelatihanSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            [
                'id'              => 'PROG-MNJMN-RESTORAN',
                'nama'            => 'Manajemen Restoran',
                'deskripsi'       => 'Program pelatihan komprehensif tentang manajemen operasional restoran, meliputi manajemen dapur, pelayanan, keuangan, dan SDM dalam industri kuliner. Peserta akan belajar langsung dari praktisi berpengalaman di bidang F&B.',
                'durasi'          => '3 Bulan',
                'harga'           => 3500000,
                'harga_formatted' => 'Rp 3.500.000',
                'icon'            => 'utensils',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'id'              => 'PROG-TATA-BOGA',
                'nama'            => 'Tata Boga & Pastry',
                'deskripsi'       => 'Program pelatihan seni memasak dan kue yang mencakup teknik dasar hingga lanjutan dalam memasak masakan Indonesia, internasional, serta pastry dan bakery modern. Dilengkapi praktik di dapur profesional berstandar industri.',
                'durasi'          => '4 Bulan',
                'harga'           => 4500000,
                'harga_formatted' => 'Rp 4.500.000',
                'icon'            => 'cake',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'id'              => 'PROG-HOUSEKEEPING',
                'nama'            => 'Housekeeping Hotel',
                'deskripsi'       => 'Program pelatihan housekeeping untuk industri perhotelan yang mencakup teknik pembersihan kamar, laundry, pengelolaan linen, serta standar kebersihan dan higienitas hotel berbintang.',
                'durasi'          => '2 Bulan',
                'harga'           => 2500000,
                'harga_formatted' => 'Rp 2.500.000',
                'icon'            => 'hotel',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'id'              => 'PROG-FRONT-OFFICE',
                'nama'            => 'Front Office Hotel',
                'deskripsi'       => 'Pelatihan pelayanan front office hotel meliputi reservasi, check-in/out, penanganan tamu, komunikasi profesional, serta penggunaan sistem Property Management System (PMS) hotel modern.',
                'durasi'          => '2 Bulan',
                'harga'           => 2800000,
                'harga_formatted' => 'Rp 2.800.000',
                'icon'            => 'concierge-bell',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'id'              => 'PROG-BARISTA',
                'nama'            => 'Barista & Coffee Shop',
                'deskripsi'       => 'Program pelatihan barista profesional yang membahas jenis kopi, teknik seduh manual brew, pengoperasian mesin espresso, latte art, serta manajemen bisnis coffee shop skala kecil hingga menengah.',
                'durasi'          => '2 Bulan',
                'harga'           => 3000000,
                'harga_formatted' => 'Rp 3.000.000',
                'icon'            => 'coffee',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
        ];

        DB::table('program_pelatihans')->insert($programs);
    }
}
