<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nilai extends Model
{
    protected $table = 'nilais';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'pendaftar_id',
        'mata_pelajaran_id',
        'tipe_nilai',
        'nilai',
        'catatan',
        'tanggal',
    ];

    protected $casts = [
        'nilai' => 'float',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }

    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class, 'mata_pelajaran_id');
    }
}
