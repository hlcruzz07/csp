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
        $googleUser = Socialite::driver('google')->user();

        try {
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {

                return back()->with('error', 'Unauthorize user.');
            }

            $user->update([
                'name' => $googleUser->getName(),
                'avatar' => $googleUser->getAvatar(),
            ]);


            Auth::login($user);

            return redirect('/dashboard');

        } catch (\Throwable $th) {
            Log::error($th->getMessage());

            return back()->with('error', 'Something went wrong, please try again.');
        }
    }
}