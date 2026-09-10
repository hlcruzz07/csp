<?php

namespace App\Http\Controllers;

use App\Models\GuidedPrompt;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GuidedPromptController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('admin/prompts/index');
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:guided_prompts,name'],
        ]);

        GuidedPrompt::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Guided Prompt created successfully.',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, int $id)
    {
        $guidedPrompt = GuidedPrompt::findOrFail($id);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('guided_prompts', 'name')->ignore($guidedPrompt)],
        ]);

        $guidedPrompt->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Guided Prompt updated successfully.',
        ]);

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $guidedPrompt = GuidedPrompt::findOrFail($id);
        $guidedPrompt->delete();
    }
}
