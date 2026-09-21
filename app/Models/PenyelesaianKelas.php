<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenyelesaianKelas extends Model
{
    protected $table = 'penyelesaian_kelas';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'angkatan_id',
        'tempat_pelatihan',
        'tanggal_selesai',
    ];

    protected $casts = [
        'tanggal_selesai' => 'date',
    ];

    public function angkatan()
    {
        return $this->belongsTo(Angkatan::class, 'angkatan_id');
    }
}
