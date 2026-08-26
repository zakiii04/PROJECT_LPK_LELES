<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Urutan seeder penting — harus mengikuti dependency foreign key.
     */
    public function run(): void
    {
        $this->call([
            // 1. Tabel tanpa FK
            UserSeeder::class,
            ProgramPelatihanSeeder::class,

            // 2. Tabel dengan FK ke program
            AngkatanSeeder::class,

            // 3. Tabel inti (FK ke users, program, angkatan)
            PendaftarSeeder::class,

            // 4. Tabel dengan FK ke pendaftar
            CicilanSeeder::class,
            InterviewSeeder::class,
            JadwalPelatihanSeeder::class, // termasuk peserta_jadwals
            SoalUjianSeeder::class,
            HasilUjianSeeder::class,
            KehadiranSeeder::class,
            KelulusanSeeder::class,
        ]);
    }
}
