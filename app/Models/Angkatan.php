<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Angkatan extends Model
{
    protected $table = 'angkatans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'kode_angkatan',
        'nama_angkatan',
        'tahun',
        'periode',
        'tgl_mulai_pendaftaran',
        'tgl_selesai_pendaftaran',
        'tanggal_mulai',
        'tanggal_selesai',
        'kuota',
        'status',
        'program_id',
    ];

    protected $casts = [
        'tgl_mulai_pendaftaran' => 'datetime',
        'tgl_selesai_pendaftaran' => 'datetime',
        'tanggal_mulai' => 'datetime',
        'tanggal_selesai' => 'datetime',
    ];

    public function program()
    {
        return $this->belongsTo(ProgramPelatihan::class, 'program_id');
    }

    public function pendaftar()
    {
        return $this->hasMany(Pendaftar::class, 'angkatan_id')->where('status', 'diterima');
    }
}
