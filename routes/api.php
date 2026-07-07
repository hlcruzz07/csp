<?php

use App\Http\Controllers\Api\ConversationApiController;
use App\Http\Controllers\Api\StudentApiController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/student')->middleware(['auth', 'verified', 'role:student'])->group(function () {
    Route::get('/check-conversation', [StudentApiController::class, 'checkConversation'])->name('checkConversation');
    Route::get('/messages', [ConversationApiController::class, 'messages'])->name('fetchMessages');
    Route::post('/message/suggest', [MessageController::class, 'suggest'])->name('suggestMessage');
});
