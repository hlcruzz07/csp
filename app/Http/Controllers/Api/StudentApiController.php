<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Repositories\StudentRepo;
use Illuminate\Http\Request;

class StudentApiController extends Controller
{
    public function __construct(protected StudentRepo $studentRepo)
    {
    }

    public function checkConversation()
    {
        return response()->json([
            'hasConversation' => $this->studentRepo->hasConversation(),
        ], 200);
    }


}
