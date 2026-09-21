<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // CORS — harus paling awal agar preflight OPTIONS ditangani
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            // Resolve Bearer token lebih dulu (identitas per-tab/per-peran).
            // Inertia visit tidak membawa header ini sehingga render halaman
            // tetap memakai cookie session seperti sebelumnya.
            \App\Http\Middleware\ResolveUserFromToken::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'auth/*',
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            // Identitas API dari Bearer token per-peran (paralel antar-tab),
            // tanpa mengutak-atik cookie session web yang dipakai bersama.
            'token.user' => \App\Http\Middleware\ResolveUserFromToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Token tidak valid atau tidak disertakan.',
            ], 401);
        });
    })->create();
