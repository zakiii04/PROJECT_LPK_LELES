<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Pembayaran extends Model
{
    protected $table = 'pembayarans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'tagihan_id', 'nominal', 'tipe_pembayaran', 'nama_penerima',
        'nama_pengirim', 'jenis_pengirim', 'payment_method_id', 'metode_pembayaran',
        'bukti_pembayaran', 'status', 'tanggal_bayar', 'tanggal_verifikasi', 'catatan_admin',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'tanggal_bayar' => 'datetime',
        'tanggal_verifikasi' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Pembayaran $pembayaran) {
            $pembayaran->id ??= Str::uuid()->toString();
        });
    }

    public function tagihan()
    {
        return $this->belongsTo(Tagihan::class, 'tagihan_id');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }
}
