<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            // Get Google user
            $googleUser = Socialite::driver('google')->user();

            // Find existing user
            $user = User::where('email', $googleUser->getEmail())->first();

            // User does not exist
            if (!$user) {
                return redirect()
                    ->route('login')
                    ->with('error', 'Unauthorized Google Account');
            }

            // Update user information
            $user->update([
                'name' => $googleUser->getName(),
                'avatar' => $googleUser->getAvatar(),
            ]);

            // Login user
            Auth::login($user);

            // Regenerate session
            request()->session()->regenerate();

            return redirect('/dashboard');

        } catch (\Throwable $th) {

            Log::error('Google Login Error', [
                'message' => $th->getMessage(),
                'file' => $th->getFile(),
                'line' => $th->getLine(),
                'trace' => $th->getTraceAsString(),
            ]);

            return redirect()
                ->route('login')
                ->with('error', 'Something went wrong, please try again.');
        }
    }
}