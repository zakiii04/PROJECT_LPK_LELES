<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cicilan extends Model
{
    public $timestamps = false;
    protected $table = 'cicilans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'termin',
        'jumlah',
        'jatuh_tempo',
        'status',
        'metode_pembayaran',
        'bukti_pembayaran',
        'tanggal_bayar',
        'tanggal_verifikasi',
        'catatan_admin',
        'pendaftar_id',
    ];

    protected $casts = [
        'jatuh_tempo' => 'datetime',
        'tanggal_bayar' => 'datetime',
        'tanggal_verifikasi' => 'datetime',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }
}
