<?php

namespace Database\Seeders;

use App\Models\Instruktur;
use App\Models\JadwalPelatihan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InstrukturSeeder extends Seeder
{
    public function run(): void
    {
        $names = JadwalPelatihan::distinct()->pluck('pengajar')->filter()->map(fn ($n) => trim($n))->unique()->values();

        // Nama bawaan selalu dipastikan ada
        $names = $names->merge(['Hj. Siti Rahmah, S.Ds', 'Sri Wahyuni, S.Pd', 'Dewi Ratnasari, A.Md', 'Tim Penguji LPK Leles'])->unique()->values();

        foreach ($names as $nama) {
            Instruktur::firstOrCreate(
                ['nama' => $nama],
                ['id' => (string) Str::uuid(), 'status' => 'Aktif']
            );
        }

        // Tautkan akun User INSTRUKTUR lama yang belum punya baris master
        $linkedUserIds = Instruktur::whereNotNull('user_id')->pluck('user_id')->all();
        $legacyUsers = User::where('role', 'INSTRUKTUR')->whereNotIn('id', $linkedUserIds)->get();
        foreach ($legacyUsers as $user) {
            $nama = trim((string) preg_replace('/^instruktur[_\\s-]+/i', '', $user->username));
            $nama = $nama !== '' ? ucwords(str_replace(['_', '-', '.'], ' ', $nama)) : $user->username;
            // Hindari bentrok nama dengan baris yang sudah ada
            $base = $nama;
            $i = 1;
            while (Instruktur::where('nama', $nama)->exists()) {
                $nama = $base . ' (' . $user->username . ')';
                if ($i++ > 1) $nama = $base . ' ' . $i;
            }
            Instruktur::create([
                'id'      => (string) Str::uuid(),
                'nama'    => $nama,
                'email'   => $user->email,
                'status'  => 'Aktif',
                'user_id' => $user->id,
            ]);
        }
    }
}
