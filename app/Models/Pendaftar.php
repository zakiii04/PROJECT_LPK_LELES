<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pendaftar extends Model
{
    public $timestamps = false;
    protected $table = 'pendaftars';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'no_pendaftaran',
        'tanggal_daftar',
        'status',
        'nama_lengkap',
        'nik',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'provinsi',
        'kabupaten_kota',
        'kecamatan',
        'desa_kelurahan',
        'tinggi_badan',
        'berat_badan',
        'lingkar_pinggang',
        'riwayat_penyakit',
        'berkas_verifikasi',
        'no_hp',
        'email',
        'jenjang_pendidikan',
        'asal_sekolah',
        'tahun_lulus',
        'jenis_pelatihan',
        'program_id',
        'tempat_pelatihan',
        'motivasi',
        'angkatan_id',
        'user_id',
        'biaya_pelatihan',
        'status_pembayaran',
        'jenis_pembayaran',
        'metode_pembayaran',
        'bukti_pembayaran',
        'tanggal_bayar',
    ];

    protected $casts = [
        'tanggal_daftar' => 'datetime',
        'tanggal_lahir' => 'date',
        'tanggal_bayar' => 'datetime',
        'berkas_verifikasi' => 'array',
    ];

    protected static function booted()
    {
        static::updating(function ($pendaftar) {
            if ($pendaftar->isDirty('status') && $pendaftar->status !== 'diterima') {
                $pendaftar->jadwal()->detach();
            }
            if ($pendaftar->isDirty('angkatan_id') && !empty($pendaftar->getOriginal('angkatan_id'))) {
                $oldAngkatanId = $pendaftar->getOriginal('angkatan_id');
                if ($oldAngkatanId !== $pendaftar->angkatan_id) {
                    $oldJadwals = $pendaftar->jadwal()->where('angkatan_id', $oldAngkatanId)->pluck('jadwal_pelatihans.id');
                    if ($oldJadwals->count() > 0) {
                        $pendaftar->jadwal()->detach($oldJadwals);
                    }
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function program()
    {
        return $this->belongsTo(ProgramPelatihan::class, 'program_id');
    }

    public function angkatan()
    {
        return $this->belongsTo(Angkatan::class, 'angkatan_id');
    }

    public function cicilan()
    {
        return $this->hasMany(Cicilan::class, 'pendaftar_id');
    }

    public function tagihan()
    {
        return $this->hasOne(Tagihan::class, 'pendaftar_id');
    }

    public function interview()
    {
        return $this->hasOne(Interview::class, 'pendaftar_id');
    }

    public function hasilUjian()
    {
        return $this->hasMany(HasilUjian::class, 'pendaftar_id');
    }

    public function kehadiran()
    {
        return $this->hasMany(Kehadiran::class, 'pendaftar_id');
    }

    public function kelulusan()
    {
        return $this->hasOne(Kelulusan::class, 'pendaftar_id');
    }

    public function jadwal()
    {
        return $this->belongsToMany(JadwalPelatihan::class, 'peserta_jadwals', 'pendaftar_id', 'jadwal_id');
    }
}
