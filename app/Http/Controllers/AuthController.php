<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        $identifier = trim($request->email);

        $user = User::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email/Username atau password yang Anda masukkan salah.',
            ], 401);
        }

        // Instruktur yang dinonaktifkan tidak bisa login
        if ($user->role === 'INSTRUKTUR' && $user->instruktur && $user->instruktur->status === 'Nonaktif') {
            return response()->json([
                'success' => false,
                'message' => 'Akun instruktur Anda sedang nonaktif. Hubungi admin.',
            ], 403);
        }

        // Web session auth (agar auth()->user() di Inertia route bekerja)
        Auth::login($user, $request->boolean('remember'));

        // Regenerate session token
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Token Sanctum untuk request API
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => $user->load('pendaftar'),
        ]);
    }

    /**
     * Logout SATU peran: revoke token Bearer yang dipresentasikan + hapus
     * session cookie. Tab peran LAIN tidak terganggu karena identitas mereka
     * datang dari token masing-masing (lihat ResolveUserFromToken), bukan
     * dari cookie bersama ini.
     */
    public function logout(Request $request)
    {
        // Token dari middleware (Bearer) — utama; fallback Sanctum guard.
        $accessToken = $request->attributes->get('access_token');
        $user = $request->user() ?? auth()->user();

        if ($accessToken) {
            $accessToken->delete();
        } elseif ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        Auth::logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data'    => $user->load(['pendaftar', 'instruktur']),
        ]);
    }

    public function refresh(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user() ?? auth()->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $request->validate([
            'password_lama' => 'required|string',
            'password_baru' => 'required|string|min:6',
        ]);

        if (! Hash::check($request->password_lama, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama salah.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password_baru),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah.',
        ]);
    }
}
