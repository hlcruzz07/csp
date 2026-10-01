<?php

namespace App\Http\Controllers;

use App\Enums\MessageStatus;
use App\Enums\NotificationType;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\GuidedPrompt;
use App\Models\User;
use App\Notifications\SendNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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
                'latestMessage.category'
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
                'latestMessage.category'
            ])
            ->withCount([
                'messages as unread_count' => function ($query) {
                    $query->where('sender_id', '!=', auth()->id())
                        ->where('status', MessageStatus::SENT->value);
                }
            ])
            ->get();

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
    public function update(Request $request)
    {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            $counselor = User::findOrFail(auth()->id());

            // Delete the old avatar if it exists
            if ($counselor->avatar) {
                Storage::disk('public')->delete($counselor->avatar);
            }

            // Store the new avatar
            $avatarPath = $request->file('avatar')->store('avatars', 'public');

            // Update only the avatar field
            $counselor->update([
                'avatar' => $avatarPath,
            ]);

            $this->notifyAvatarChanged($counselor);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Profile Updated',
            ]);

            return redirect()->back();
        } catch (\Throwable $th) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Something went wrong updating profile.',
            ]);

            Log::error('Error updating profile ' . $th->getMessage());

            return redirect()->back();
        }
    }

    /**
     * One notice per conversation: each notification carries its conversation,
     * so it shows up in that chat's timeline for both sides.
     */
    protected function notifyAvatarChanged(User $counselor): void
    {
        try {
            $counselor->counselorConversations()
                ->with('student')
                ->get()
                ->each(function ($conversation) use ($counselor) {
                    $extra = [
                        'conversation_id' => $conversation->id,
                        'conversation_uuid' => $conversation->uuid,
                    ];

                    // Counselor: stored only. It shows in their own chat
                    // without a toast or push for their own action.
                    $counselor->notify(new SendNotification(
                        NotificationType::CHAT_UPDATED,
                        [],
                        $extra + ['description' => 'You updated your profile picture.'],
                        ['database'],
                    ));

                    // Student: stored and broadcast, so it appears live in the
                    // open chat and triggers their toast.
                    $conversation->student?->notify(new SendNotification(
                        NotificationType::CHAT_UPDATED,
                        [],
                        $extra + ['description' => "{$counselor->name} updated their profile picture."],
                        ['database', 'broadcast'],
                    ));
                });
        } catch (\Throwable $th) {
            // A notification failure must never undo the avatar update.
            Log::error('Error notifying avatar change ' . $th->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
