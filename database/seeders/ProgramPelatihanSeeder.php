<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProgramPelatihanSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('program_pelatihans')->delete();

        $programs = [
            [
                'id'              => 'PROG-MENJAHIT',
                'nama'            => 'Menjahit',
                'deskripsi'       => 'Program pelatihan intensif keahlian menjahit, pembuatan pola busana, dan jahit pakaian industri profesional LPK.',
                'durasi'          => '3 Bulan',
                'harga'           => 3000000,
                'harga_formatted' => 'Rp 3.000.000',
                'icon'            => 'scissors',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
        ];

        DB::table('program_pelatihans')->insert($programs);
    }
}
