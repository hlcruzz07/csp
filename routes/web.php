<?php

use App\Enums\UserRole;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CounselorController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\StudentController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect('/dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

Route::get('/auth/google', [GoogleController::class, 'redirect'])
    ->name('googleLogin');

Route::get('/auth/google/callback', [GoogleController::class, 'callback']);

Route::prefix('admin')->middleware([])->group(function () {
    Route::get('/', fn() => redirect()->route('adminDashboard'));

    Route::get('/dashboard', [AdminController::class, 'index'])->name('adminDashboard');
    Route::get('/counselors', [AdminController::class, 'counselors'])->name('counselors');
});
Route::get('/setup-admin', function (Request $request) {
    $admin = User::create([
        'uuid' => (string) Str::uuid(),
        'name' => 'Harold Cruz',
        'pseudonym' => 'Donny Pangilinan',
        'email' => 'harold.cruz0407@gmail.com',
        'password' => Hash::make('password123'),
        'is_anonymous' => false,
        'role' => UserRole::ADMIN,
    ]);

    Auth::login($admin);

    $request->session()->regenerate();

    return redirect('/dashboard');
});
Route::prefix('counselor')->middleware(['auth', 'verified', 'role:counselor'])->group(function () {

    Route::get('/', fn() => redirect()->route('counselorDashboard'));

    Route::get('/conversations', [CounselorController::class, 'index'])->name('counselorDashboard');
    Route::get('/conversations/{uuid}', [CounselorController::class, 'show'])->name('counselorConversation');
    Route::post('/updateProfile', [CounselorController::class, 'update'])->name('counselorUpdate');
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
Route::get('/php-limits-check', function () {
    return [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'max_file_uploads' => ini_get('max_file_uploads'),
        'memory_limit' => ini_get('memory_limit'),
    ];
});
Route::middleware(['auth', 'verified', 'role:student|counselor'])->group(function () {
    Route::get('/conversation/{uuid}', [ConversationController::class, 'index'])->name('conversation');
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


require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';
