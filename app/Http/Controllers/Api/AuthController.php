<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Email atau password salah.'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logout berhasil.']);
    }

    public function me(Request $request)
    {
        return response()->json(['success' => true, 'data' => $request->user()->load('pendaftar')]);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;
        return response()->json(['success' => true, 'token' => $token]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'password_lama' => 'required|string',
            'password_baru' => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($request->password_lama, $request->user()->password)) {
            return response()->json(['success' => false, 'message' => 'Password lama salah.'], 422);
        }

        $request->user()->update(['password' => Hash::make($request->password_baru)]);

        return response()->json(['success' => true, 'message' => 'Password berhasil diubah.']);
    }
}
