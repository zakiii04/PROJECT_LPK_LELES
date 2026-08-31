<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Home Page
Route::get('/', function () {
    return Inertia::render('Home');
});

// Single Unified Login Route
Route::get('/login', function () {
    return Inertia::render('Login');
})->name('login');

// Redirect legacy login URLs to single login
Route::get('/admin', function () {
    return Inertia::render('Login');
});
Route::get('/peserta/login', function () {
    return Inertia::render('Login');
});

// Dashboards
Route::get('/admin/dashboard', function () {
    return Inertia::render('Admin/Dashboard');
});
Route::get('/peserta/dashboard', function () {
    return Inertia::render('Peserta/Dashboard');
});
Route::get('/peserta/ujian', function () {
    return Inertia::render('Peserta/Ujian');
});
Route::get('/hrd/dashboard', function () {
    return Inertia::render('Hrd/Dashboard');
});
Route::get('/instruktur/dashboard', function () {
    return Inertia::render('Instruktur/Dashboard');
});

// Pendaftaran
Route::get('/pendaftaran', function () {
    return Inertia::render('Pendaftaran');
});
