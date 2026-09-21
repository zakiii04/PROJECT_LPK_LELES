<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SoalUjian extends Model
{
    public $timestamps = false;
    protected $table = 'soal_ujians';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'jenis_pelatihan',
        'tipe',
        'pertanyaan',
        'opsi',
        'jawaban_benar',
        'program_id',
        'gambar_soal',
        'is_active',
    ];

    protected $casts = [
        'opsi' => 'array',
        'is_active' => 'boolean',
    ];

    public function program()
    {
        return $this->belongsTo(ProgramPelatihan::class, 'program_id');
    }
}
