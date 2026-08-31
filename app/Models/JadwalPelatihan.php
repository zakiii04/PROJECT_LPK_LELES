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
        'angkatan_id',
        'hari_ke',
        'tanggal',
        'jam',
        'ruangan',
        'tempat_pelatihan',
        'pengajar',
        'jenis_sesi',
        'status',
    ];

    public function angkatan()
    {
        return $this->belongsTo(Angkatan::class, 'angkatan_id');
    }

    public function peserta()
    {
        return $this->belongsToMany(Pendaftar::class, 'peserta_jadwals', 'jadwal_id', 'pendaftar_id');
    }
}
