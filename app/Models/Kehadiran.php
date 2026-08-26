<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kehadiran extends Model
{
    public $timestamps = false;
    protected $table = 'kehadirans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tanggal',
        'status_kehadiran',
        'catatan',
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
