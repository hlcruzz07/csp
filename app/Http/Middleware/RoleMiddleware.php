<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401);
        }

        // Allow multiple roles (comma or pipe separated)
        $allowed = preg_split('/\s*[,|]\s*/', $role) ?: [];

        // Normalize allowed roles to lowercase strings
        $allowed = array_map(fn($r) => strtolower(trim($r)), $allowed);

        // Determine user's role as a string (handles enum or plain string)
        $userRole = $user->role;
        if (is_object($userRole) && property_exists($userRole, 'value')) {
            $userRole = $userRole->value;
        }
        $userRole = strtolower((string) $userRole);

        if (!in_array($userRole, $allowed, true)) {
            abort(403, 'Unauthorized.');
        }

        return $next($request);
    }
}
