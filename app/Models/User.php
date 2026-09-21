<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $keyType  = 'string';
    public    $incrementing = false;

    protected $fillable = [
        'id',
        'username',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // Relasi ke Pendaftar
    public function pendaftar()
    {
        return $this->hasOne(\App\Models\Pendaftar::class, 'user_id');
    }

    // Relasi ke Instruktur (akun login instruktur yang dibuat otomatis)
    public function instruktur()
    {
        return $this->hasOne(\App\Models\Instruktur::class, 'user_id');
    }
}
