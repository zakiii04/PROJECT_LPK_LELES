<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Models\Pendaftar;
use App\Models\ProgramPelatihan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('backfill:pendaftar-biaya {--dry-run}', function () {
    $updated = 0;
    $skipped = 0;

    $run = function () use (&$updated, &$skipped) {
        Pendaftar::query()
            ->where(function ($query) {
                $query->whereNull('biaya_pelatihan')->orWhere('biaya_pelatihan', 0);
            })
            ->orderBy('id')
            ->each(function (Pendaftar $pendaftar) use (&$updated, &$skipped) {
                $program = null;

                if ($pendaftar->program_id) {
                    $program = ProgramPelatihan::find($pendaftar->program_id);
                }

                if (!$program && $pendaftar->jenis_pelatihan) {
                    $program = ProgramPelatihan::where('nama', $pendaftar->jenis_pelatihan)->first();
                }

                if (!$program) {
                    $skipped++;
                    return;
                }

                if (!$this->option('dry-run')) {
                    $pendaftar->forceFill([
                        'program_id' => $program->id,
                        'biaya_pelatihan' => $program->harga,
                    ])->save();
                }

                $updated++;
            });
    };

    if ($this->option('dry-run')) {
        $run();
    } else {
        DB::transaction($run);
    }

    $this->info(($this->option('dry-run') ? 'Akan diperbarui: ' : 'Berhasil diperbarui: ') . $updated . ' data.');
    if ($skipped > 0) {
        $this->warn('Dilewati karena program tidak ditemukan: ' . $skipped . ' data.');
    }
})->purpose('Mengisi biaya pendaftar lama yang masih bernilai 0');
