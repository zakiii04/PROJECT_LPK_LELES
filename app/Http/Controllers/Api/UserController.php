<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = User::query();
        if ($request->role)   $q->where('role', $request->role);
        if ($request->search) $q->where(function ($sq) use ($request) {
            $sq->where('username', 'like', '%' . $request->search . '%')->orWhere('email', 'like', '%' . $request->search . '%');
        });
        return response()->json(['success' => true, 'data' => $q->orderByDesc('created_at')->paginate($request->per_page ?? 15)]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'username' => 'required|string|unique:users',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:ADMIN,HRD,INSTRUKTUR,PESERTA',
        ]);
        $v['id']       = Str::uuid()->toString();
        $v['password'] = Hash::make($v['password']);
        return response()->json(['success' => true, 'message' => 'User dibuat.', 'data' => User::create($v)], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => User::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $v = $request->validate([
            'username' => 'sometimes|string|unique:users,username,' . $id,
            'email'    => 'sometimes|email|unique:users,email,' . $id,
            'role'     => 'sometimes|in:ADMIN,HRD,INSTRUKTUR,PESERTA',
        ]);
        if ($request->password) $v['password'] = Hash::make($request->password);
        $user->update($v);
        return response()->json(['success' => true, 'message' => 'User diupdate.', 'data' => $user]);
    }

    public function destroy(string $id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'User dihapus.']);
    }
}
