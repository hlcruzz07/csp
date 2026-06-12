<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectToDashboard
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        return match ($user->role) {
            'admin' => redirect('/admin/dashboard'),
            'faculty' => redirect('/faculty/dashboard'),
            'student' => redirect('/student/dashboard'),
            default => $next($request),
        };
    }
}