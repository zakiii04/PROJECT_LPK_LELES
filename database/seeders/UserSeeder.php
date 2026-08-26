<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
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
            // Akun peserta
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
        ];

        DB::table('users')->insert($users);
    }
}
