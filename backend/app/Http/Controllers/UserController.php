<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        // Add image URL if image exists
        $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

        return response()->json(['user' => $user]);
    }

    /**
     * Get a user's public profile
     */
    public function publicProfile(User $user)
    {
        // Add image URL if image exists
        $imageUrl = $user->image ? asset('storage/' . $user->image) : null;

        // Return only public fields
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'image_url' => $imageUrl,
                'created_at' => $user->created_at,
            ],
            'posts_count' => $user->posts()->count(),
        ]);
    }

    /**
     * Get random users excluding the authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function randomUsers()
    {
        // Get the authenticated user
        $user = auth('sanctum')->user();

        $query = User::query();

        // If there is an authenticated user, exclude them from results
        if ($user) {
            $query->where('id', '!=', $user->id);
        }

        // Get 10 random users
        $randomUsers = $query->inRandomOrder()
            ->limit(5)
            ->get(['id', 'name', 'username', 'image']);

        // Add image_url for each user
        foreach ($randomUsers as $randomUser) {
            $randomUser->image_url = $randomUser->image ? asset('storage/' . $randomUser->image) : null;
            unset($randomUser->image); // Remove the original image field
        }

        return response()->json(['users' => $randomUsers]);
    }
}
