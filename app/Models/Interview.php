<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    public $timestamps = false;
    protected $table = 'interviews';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tanggal_interview',
        'pewawancara',
        'skor_komunikasi',
        'skor_sikap',
        'skor_kesiapan',
        'skor_total',
        'catatan',
        'status',
        'pendaftar_id',
    ];

    protected $casts = [
        'tanggal_interview' => 'datetime',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }
}
