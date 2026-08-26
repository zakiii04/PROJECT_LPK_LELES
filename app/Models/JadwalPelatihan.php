<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalPelatihan extends Model
{
    protected $table = 'jadwal_pelatihans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'judul',
        'jenis_pelatihan',
        'tanggal',
        'jam',
        'ruangan',
        'jenis_sesi',
        'status',
    ];

    public function peserta()
    {
        return $this->belongsToMany(Pendaftar::class, 'peserta_jadwals', 'jadwal_id', 'pendaftar_id');
    }
}
