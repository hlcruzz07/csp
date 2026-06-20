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

        $role = $user->role;
        if (is_object($role) && property_exists($role, 'value')) {
            $role = $role->value;
        }

        return match (strtolower((string) $role)) {
            'admin' => redirect('/admin/dashboard'),
            'counselor' => redirect('/counselor/dashboard'),
            'student' => redirect('/student/dashboard'),
            default => $next($request),
        };
    }
}