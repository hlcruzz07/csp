<?php

namespace App\Http\Controllers;

use App\Enums\MessageStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CounselorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $conversations = auth()->user()->counselorConversations()
            ->with([
                'student',
                'latestMessage.attachments',
            ])
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->where('sender_id', '!=', auth()->id())
                        ->where('status', MessageStatus::SENT->value);
                }
            ])
            ->get();

        return Inertia::render('counselor/dashboard', [
            'conversations' => $conversations,
        ]);
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
    public function show(string $uuid)
    {
        $conversation = auth()->user()
            ->counselorConversations()
            ->where('uuid', $uuid)
            ->firstOrFail();

        // Mark messages as seen
        $conversation->messages()
            ->where('status', MessageStatus::SENT->value)
            ->update([
                'status' => MessageStatus::SEEN->value,
            ]);

        // Reload updated data
        $conversation->load([
            'student.assignedCollege',
            'messages' => fn($q) => $q->latest(),
        ]);

        // Sidebar
        $conversations = auth()->user()
            ->counselorConversations()
            ->with([
                'student',
                'latestMessage.attachments',
            ])
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->where('sender_id', '!=', auth()->id())
                        ->where('status', MessageStatus::SENT->value);
                }
            ])
            ->get();
        // dd($conversations->toArray());

        return Inertia::render('counselor/show', [
            'conversation' => $conversation,
            'conversations' => $conversations,
            'categories' => Category::all(),
        ]);
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
