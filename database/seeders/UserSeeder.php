<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->delete();

        $users = [
            [
                'id'         => '11111111-0000-0000-0000-000000000001',
                'username'   => 'admin',
                'email'      => 'admin@lpk-alkautsar.id',
                'password'   => Hash::make('password'),
                'role'       => 'ADMIN',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '11111111-0000-0000-0000-000000000002',
                'username'   => 'hrd_sari',
                'email'      => 'hrd@lpk-alkautsar.id',
                'password'   => Hash::make('password'),
                'role'       => 'HRD',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '11111111-0000-0000-0000-000000000003',
                'username'   => 'instruktur_budi',
                'email'      => 'instruktur1@lpk-alkautsar.id',
                'password'   => Hash::make('password'),
                'role'       => 'INSTRUKTUR',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '11111111-0000-0000-0000-000000000004',
                'username'   => 'instruktur_dewi',
                'email'      => 'instruktur2@lpk-alkautsar.id',
                'password'   => Hash::make('password'),
                'role'       => 'INSTRUKTUR',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // 10 Akun Peserta (Menjahit)
            [
                'id'         => '22222222-0000-0000-0000-000000000001',
                'username'   => 'peserta_andi',
                'email'      => 'andi.pratama@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000002',
                'username'   => 'peserta_siti',
                'email'      => 'siti.rahayu@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000003',
                'username'   => 'peserta_rizky',
                'email'      => 'rizky.maulana@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000004',
                'username'   => 'peserta_fitri',
                'email'      => 'fitri.handayani@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000005',
                'username'   => 'peserta_dian',
                'email'      => 'dian.permata@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000006',
                'username'   => 'peserta_budi',
                'email'      => 'budi.santoso@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000007',
                'username'   => 'peserta_rina',
                'email'      => 'rina.wulandari@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000008',
                'username'   => 'peserta_dewi',
                'email'      => 'dewi.anggraini@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000009',
                'username'   => 'peserta_fajar',
                'email'      => 'fajar.ramadhan@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id'         => '22222222-0000-0000-0000-000000000010',
                'username'   => 'peserta_nabila',
                'email'      => 'nabila.putri@gmail.com',
                'password'   => Hash::make('password'),
                'role'       => 'PESERTA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($users);
    }
}
