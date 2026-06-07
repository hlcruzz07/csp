<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CounselorController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('admin')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/', fn() => redirect()->route('adminDashboard'));

    Route::get('/dashboard', [AdminController::class, 'index'])->name('adminDashboard');
    Route::get('/students', [AdminController::class, 'students'])->name('students');
});

Route::prefix('counselor')->middleware(['auth', 'verified', 'role:counselor'])->group(function () {

    Route::get('/', fn() => redirect()->route('counselorDashboard'));

    Route::get('/dashboard', [CounselorController::class, 'index'])->name('counselorDashboard');
});

Route::prefix('student')->middleware(['auth', 'verified', 'role:student'])->group(function () {

    Route::get('/', fn() => redirect()->route('studentDashboard'));

    Route::get('/dashboard', [StudentController::class, 'index'])->name('studentDashboard');
});
require __DIR__ . '/settings.php';
