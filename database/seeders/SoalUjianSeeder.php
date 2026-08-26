<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SoalUjianSeeder extends Seeder
{
    public function run(): void
    {
        $soals = [
            // --- Pretest Tata Boga ---
            [
                'id'               => 'SOAL-0000-0000-0000-000000000001',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Teknik memasak dengan cara merebus bahan makanan di dalam air mendidih disebut?',
                'opsi'             => json_encode(['Sauté', 'Boiling', 'Braising', 'Roasting']),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000002',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Bahan pengembang yang biasa digunakan dalam pembuatan roti adalah?',
                'opsi'             => json_encode(['Gula pasir', 'Garam dapur', 'Ragi (yeast)', 'Soda kue']),
                'jawaban_benar'    => 2,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000003',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Suhu ideal untuk menyimpan daging segar agar tetap aman dikonsumsi adalah?',
                'opsi'             => json_encode(['0°C - 4°C', '10°C - 15°C', '20°C - 25°C', '-10°C - -5°C']),
                'jawaban_benar'    => 0,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000004',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Apa yang dimaksud dengan mise en place dalam dunia kuliner?',
                'opsi'             => json_encode([
                    'Teknik memotong sayuran',
                    'Persiapan bahan dan peralatan sebelum memasak',
                    'Cara penyajian makanan di atas piring',
                    'Metode menggoreng makanan',
                ]),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000005',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Makanan yang mengandung protein nabati terbaik adalah?',
                'opsi'             => json_encode(['Nasi putih', 'Tahu dan tempe', 'Kerupuk', 'Mie instan']),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            // --- Posttest Tata Boga ---
            [
                'id'               => 'SOAL-0000-0000-0000-000000000006',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'Teknik latte art yang digunakan untuk membuat gambar di atas kopi disebut?',
                'opsi'             => json_encode(['Free pouring', 'Etching', 'Stenciling', 'Semua benar']),
                'jawaban_benar'    => 3,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000007',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'Pada pembuatan croissant, teknik melipat adonan berulang kali disebut?',
                'opsi'             => json_encode(['Folding', 'Lamination', 'Kneading', 'Proofing']),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000008',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'Berapa persen kandungan lemak pada heavy whipping cream?',
                'opsi'             => json_encode(['18%', '25%', '36%', '45%']),
                'jawaban_benar'    => 2,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000009',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'HACCP merupakan singkatan dari?',
                'opsi'             => json_encode([
                    'Hazard Analysis Critical Control Points',
                    'Healthy And Clean Catering Plan',
                    'High Accuracy Cooking Control Protocol',
                    'Hygiene And Cleanliness Cooking Procedure',
                ]),
                'jawaban_benar'    => 0,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            [
                'id'               => 'SOAL-0000-0000-0000-000000000010',
                'jenis_pelatihan'  => 'PROG-TATA-BOGA',
                'tipe'             => 'posttest',
                'pertanyaan'       => 'Food Cost Percentage dihitung dengan rumus?',
                'opsi'             => json_encode([
                    '(Harga Jual / Biaya Bahan) × 100%',
                    '(Biaya Bahan / Harga Jual) × 100%',
                    '(Keuntungan / Harga Jual) × 100%',
                    '(Harga Jual - Biaya Bahan) × 100%',
                ]),
                'jawaban_benar'    => 1,
                'program_id'       => 'PROG-TATA-BOGA',
            ],
            // --- Soal Umum (Semua Program) ---
            [
                'id'               => 'SOAL-0000-0000-0000-000000000011',
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
            [
                'id'               => 'SOAL-0000-0000-0000-000000000012',
                'jenis_pelatihan'  => 'Semua',
                'tipe'             => 'pretest',
                'pertanyaan'       => 'Etika kerja yang baik dalam industri hospitality adalah?',
                'opsi'             => json_encode([
                    'Datang terlambat namun bekerja keras',
                    'Berpenampilan rapi, tepat waktu, dan ramah kepada tamu',
                    'Menggunakan ponsel saat melayani tamu',
                    'Berbicara keras di area tamu',
                ]),
                'jawaban_benar'    => 1,
                'program_id'       => null,
            ],
        ];

        DB::table('soal_ujians')->insert($soals);
    }
}
