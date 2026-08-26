<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilUjian extends Model
{
    public $timestamps = false;
    protected $table = 'hasil_ujians';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tipe',
        'nilai',
        'benar',
        'salah',
        'total_soal',
        'tanggal',
        'pendaftar_id',
    ];

    protected $casts = [
        'tanggal' => 'datetime',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }
}
