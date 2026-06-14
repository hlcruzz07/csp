<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteStudentRequest;
use App\Jobs\FindStudentCounselorJob;
use App\Models\College;
use App\Repositories\StudentRepo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(protected StudentRepo $studentRepo) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $colleges = College::all();
        $isCompleted = $this->studentRepo->isCompleted();

        return Inertia::render('student/dashboard', [
            'colleges' => $colleges,
            'isCompleted' => $isCompleted,
        ]);
    }

    public function complete(CompleteStudentRequest $request)
    {
        $data = $request->all();

        try {
            DB::transaction(function () use ($data) {
                $this->studentRepo->setConsent();
                $this->studentRepo->setCollege($data['college_id']);
                $this->studentRepo->setIsAnonymous($data['is_anonymous']);

                FindStudentCounselorJob::dispatch(auth()->id())->afterCommit();
            });


            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Student Profile Completed',
            ]);

            return redirect()->back();
        } catch (\Throwable $th) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Something went wrong: yudipota',
            ]);

            return redirect()->back();
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
