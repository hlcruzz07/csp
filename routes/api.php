<?php

use App\Http\Controllers\Api\StudentApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/student')->middleware(['auth', 'verified', 'role:student'])->group(function () {
    Route::get('/check-conversation', [StudentApiController::class, 'checkConversation'])->name('checkConversation');
});
