<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SoalUjianSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('soal_ujians')->delete();

        $soals = [
            // --- Pretest Menjahit ---
            [
                'id'               => 'SOAL-0000-0000-0000-000000000001',
                'jenis_pelatihan'  => 'Menjahit',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Alat yang digunakan untuk mengukur badan saat membuat pola busana adalah?',
                'opsi'             => json_encode(['Penggaris Kayu', 'Pita Ukur / Metlin', 'Jangka', 'Busur']),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-MENJAHIT',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000002',
                'jenis_pelatihan'  => 'Menjahit',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Jarum jahit yang khusus digunakan pada mesin jahit industri High-Speed adalah?',
                'opsi'             => json_encode(['Jarum Tangan', 'Jarum DBx1', 'Jarum Pentul', 'Jarum Sol']),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-MENJAHIT',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000003',
                'jenis_pelatihan'  => 'Menjahit',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Teknik penyelesaian tepi kain agar tidak berserabut dinamakan?',
                'opsi'             => json_encode(['Mengobras', 'Membordir', 'Mencanting', 'Memilin']),
                'jawaban_benar'    => 0,
                'program_id'       => 'PROG-MENJAHIT',
            ],
            // --- Posttest Menjahit ---
            [
                'id'               => 'SOAL-0000-0000-0000-000000000004',
                'jenis_pelatihan'  => 'Menjahit',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'Bagian pola dasar busana wanita yang diukur dari leher sampai batas pinggang disebut?',
                'opsi'             => json_encode(['Panjang Muka', 'Lingkar Dada', 'Lebar Bahu', 'Lingkar Pinggul']),
                'jawaban_benar'    => 0,
                'program_id'       => 'PROG-MENJAHIT',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000005',
                'jenis_pelatihan'  => 'Menjahit',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'Kain keras berkatap yang menempel dengan cara disetrika untuk melapisi kerah kemeja dinamakan?',
                'opsi'             => json_encode(['Furing', 'Kain Interfacing / Viselin', 'Kain Blaco', 'Kain Sifon']),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-MENJAHIT',
            ],
            // --- Soal Umum ---
            [
                'id'               => 'SOAL-0000-0000-0000-000000000006',
                'jenis_pelatihan'  => 'Semua',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Apa kepanjangan dari K3 dalam dunia kerja?',
                'opsi'             => json_encode([
                    'Kebersihan, Kerapian, Keindahan',
                    'Keselamatan dan Kesehatan Kerja',
                    'Keahlian, Kecepatan, Ketepatan',
                    'Kualitas, Kuantitas, Kontrol',
                ]),
                'jawaban_benar'    => 1,
                'program_id'       => null,
            ],
        ];

        DB::table('soal_ujians')->insert($soals);
    }
}
