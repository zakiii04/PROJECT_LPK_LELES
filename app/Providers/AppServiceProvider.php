<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL; // 1. Import facade URL

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Hanya paksa HTTPS jika ada proxy/tunnel (serveo, ngrok, dll)
        if (request()->hasHeader('x-forwarded-proto') && request()->header('x-forwarded-proto') === 'https') {
            URL::forceScheme('https');
        }
    }
}