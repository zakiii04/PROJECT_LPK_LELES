<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TempatPelatihan extends Model
{
    protected $table = 'tempat_pelatihans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nama_tempat',
        'alamat_lengkap',
        'kapasitas',
        'fasilitas',
        'status',
    ];
}
