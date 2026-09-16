<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tagihan extends Model
{
    protected $table = 'tagihans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['id', 'pendaftar_id', 'nominal', 'status'];

    protected static function booted(): void
    {
        static::creating(function (Tagihan $tagihan) {
            $tagihan->id ??= Str::uuid()->toString();
        });
    }

    public function pendaftar()
    {
        return $this->belongsTo(Pendaftar::class, 'pendaftar_id');
    }

    public function pembayarans()
    {
        return $this->hasMany(Pembayaran::class, 'tagihan_id');
    }
}
