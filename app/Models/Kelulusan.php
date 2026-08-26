<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelulusan extends Model
{
    protected $table = 'kelulusans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nilai_pretest',
        'nilai_posttest',
        'nilai_kehadiran',
        'nilai_tugas',
        'nilai_akhir',
        'status_kelulusan',
        'tanggal_lulus',
        'no_sertifikat',
        'pendaftar_id',
    ];

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }
}
