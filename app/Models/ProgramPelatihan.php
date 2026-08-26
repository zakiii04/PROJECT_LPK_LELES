<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramPelatihan extends Model
{
    protected $table = 'program_pelatihans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nama',
        'deskripsi',
        'durasi',
        'harga',
        'harga_formatted',
        'icon',
    ];

    public function angkatan()
    {
        return $this->hasMany(Angkatan::class, 'program_id');
    }

    public function pendaftar()
    {
        return $this->hasMany(Pendaftar::class, 'program_id');
    }

    public function soalUjian()
    {
        return $this->hasMany(SoalUjian::class, 'program_id');
    }
}
