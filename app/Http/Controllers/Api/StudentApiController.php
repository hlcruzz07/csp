<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\StudentRepo;

class StudentApiController extends Controller
{
    public function __construct(protected StudentRepo $studentRepo) {}
    public function checkConversation()
    {
        return response()->json([
            'hasConversation' => $this->studentRepo->hasConversation(),
        ], 200);
    }
}
