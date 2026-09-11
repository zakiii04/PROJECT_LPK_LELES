<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MataPelajaran extends Model
{
    protected $table = 'mata_pelajarans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'kode',
        'nama',
        'deskripsi',
        'program_id',
        'urutan',
    ];

    public function nilai()
    {
        return $this->hasMany(Nilai::class, 'mata_pelajaran_id');
    }
}
