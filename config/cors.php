<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi CORS untuk API LPK Alkautsar.
    | Izinkan akses dari Next.js (localhost:3000) dan domain production.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',      // Next.js dev
        'http://localhost:3001',      // Next.js dev alt port
        'http://127.0.0.1:3000',
        'https://*.ngrok-free.app',   // ngrok free domain
        'https://*.ngrok.io',         // ngrok legacy
        'https://henna-niece-resistant.ngrok-free.dev', // ngrok aktif
        // Tambahkan domain production Next.js di sini:
        // 'https://lpk-alkautsar.vercel.app',
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.ngrok-free\.app$#',
        '#^https://.*\.ngrok\.io$#',
    ],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'ngrok-skip-browser-warning',  // skip ngrok warning page
        'X-CSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 86400, // cache preflight 24 jam

    'supports_credentials' => true,

];
