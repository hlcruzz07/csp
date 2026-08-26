<?php

use App\Http\Controllers\Api\ConversationApiController;
use App\Http\Controllers\Api\CounselorApiController;
use App\Http\Controllers\Api\StudentApiController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/conversations')->middleware(['auth', 'verified', 'role:student|counselor'])->group(function () {
    Route::get('/check-conversation', [StudentApiController::class, 'checkConversation'])->name('checkConversation');
    Route::get('/{uuid}/messages', [ConversationApiController::class, 'messages'])->name('fetchMessages');
    Route::post('/message/suggest', [MessageController::class, 'suggest'])->name('suggestMessage');
    Route::post('/message/counselor-response', [MessageController::class, 'counselorResponse'])->name('counselorResponse');
});


Route::prefix('api')->middleware(['auth', 'verified', 'role:admin|counselor'])->group(function () {
    Route::get('/counselors', [CounselorApiController::class, 'paginate'])->name('paginateCounselors');
});
