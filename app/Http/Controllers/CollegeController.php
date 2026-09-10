<?php

namespace App\Http\Controllers;

use App\Models\College;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CollegeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('admin/colleges/index');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:colleges,name'],
            'code' => ['required', 'string', 'max:50', 'unique:colleges,code'],
        ]);

        College::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'College created successfully.',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, int $id)
    {
        $college = College::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('colleges', 'name')->ignore($college)],
            'code' => ['required', 'string', 'max:50', Rule::unique('colleges', 'code')->ignore($college)],
        ]);

        $college->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'College updated successfully.',
        ]);

        return redirect()->back();
    }
}
