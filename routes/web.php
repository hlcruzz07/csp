<?php

use App\Enums\UserRole;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CounselorController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\StudentController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

// test
Route::get('/', function () {
    if (Auth::check()) {
        return redirect('/dashboard');
    }

    return Inertia::render('welcome', [
        'counselors' => User::where('role', UserRole::COUNSELOR)->with('assignedCollege')->get()
    ]);
})->name('home');

Route::get('/auth/google', [GoogleController::class, 'redirect'])
    ->name('googleLogin');

Route::get('/auth/google/callback', [GoogleController::class, 'callback']);

Route::prefix('admin')->middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/', fn() => redirect()->route('adminDashboard'));

    Route::get('/dashboard', [AdminController::class, 'index'])->name('adminDashboard');
    Route::get('/counselors', [AdminController::class, 'counselors'])->name('counselors');
    Route::patch('/counselor/{id}/update', [AdminController::class, 'updateCounselor'])->name('updateCounselor');
    Route::post('/counselor/create', [AdminController::class, 'createCounselor'])->name('createCounselor');
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
            return redirect()->route('login')->with('Something went wrong. Please try again');
    }
});


require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';
