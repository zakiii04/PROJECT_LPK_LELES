<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolve API identity from Sanctum Bearer token WITHOUT touching the
 * shared web (cookie) session.
 *
 * Background: browsers share one `web` session cookie across tabs, so two
 * different roles logged in on two tabs would constantly overwrite each
 * other's cookie identity. By resolving the user from the per-role Bearer
 * token first (and only falling back to the session when no token is
 * present), each tab keeps its own identity in parallel.
 */
class ResolveUserFromToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (is_string($header) && str_starts_with($header, 'Bearer ')) {
            $plainToken = trim(substr($header, 7));

            if ($plainToken !== '') {
                $token = PersonalAccessToken::findToken($plainToken);

                if ($token && $token->tokenable) {
                    Auth::setUser($token->tokenable);
                    // Tandai request terotentikasi via token agar controller
                    // bisa membedakan dari session bila diperlukan.
                    $request->attributes->set('auth_via_token', true);
                    $request->attributes->set('access_token', $token);
                }
            }
        }

        return $next($request);
    }
}
