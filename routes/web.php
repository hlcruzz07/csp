<?php

use App\Enums\UserRole;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CounselorController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect('/dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

Route::prefix('admin')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/', fn() => redirect()->route('adminDashboard'));

    Route::get('/dashboard', [AdminController::class, 'index'])->name('adminDashboard');
    Route::get('/students', [AdminController::class, 'students'])->name('students');
});

Route::prefix('counselor')->middleware(['auth', 'verified', 'role:counselor'])->group(function () {

    Route::get('/', fn() => redirect()->route('counselorDashboard'));

    Route::get('/conversations', [CounselorController::class, 'index'])->name('counselorDashboard');
});

Route::prefix('student')->middleware(['auth', 'verified', 'role:student'])->group(function () {

    Route::get('/', fn() => redirect()->route('studentDashboard'));

    Route::get('/conversation', [StudentController::class, 'index'])->name('studentDashboard');
    Route::post('/complete', [StudentController::class, 'complete'])->name('studentComplete');
    Route::post('/updateProfile', [StudentController::class, 'updateProfile'])->name('studentUpdateProfile');
});

Route::prefix('messages')->middleware(['auth', 'verified', 'role:student|counselor'])->group(function () {
    Route::post('/create', [MessageController::class, 'create'])->name('sendMessage');
});

Route::get('/dashboard', function () {


    $user = auth()->user();

    switch ($user->role->value) {
        case UserRole::ADMIN->value:
            return redirect()->route('adminDashboard');

        case UserRole::COUNSELOR->value:
            return redirect()->route('counselorDashboard');

        case UserRole::STUDENT->value:
            return redirect()->route('studentDashboard');
        default:
            return 'test';
    }
});

Route::get('/debug-job', function () {
    app()->makeWith(\App\Jobs\FindStudentCounselorJob::class, [
        'studentId' => 1
    ])->handle();

    return 'job executed';
});


require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';
