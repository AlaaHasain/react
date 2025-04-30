<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;

class LikeController extends Controller implements HasMiddleware
{
    public static function middleware()
    {
        return [
            new Middleware('auth:sanctum')
        ];
    }

    // Get all likes for a post
    public function index(Post $post)
    {
        return $post->likes()->with('user')->get();
    }

    // Like a post
    public function store(Request $request, Post $post)
    {
        // Check if user already liked this post
        $existing = $post->likes()->where('user_id', $request->user()->id)->first();

        if ($existing) {
            return response()->json(['message' => 'You already liked this post'], 409);
        }

        // Create the like with explicit user_id association
        $like = new Like([
            'user_id' => $request->user()->id,
            'post_id' => $post->id
        ]);

        $like->save();

        return response()->json(['message' => 'Post liked successfully']);
    }

    // Unlike a post
    public function destroy(Request $request, Post $post)
    {
        // Find the specific like by this user
        $like = $post->likes()->where('user_id', $request->user()->id)->first();

        if (!$like) {
            return response()->json(['message' => 'You have not liked this post'], 404);
        }

        // Use Gate to authorize the action
        Gate::authorize('delete', $like);

        // Delete the specific like
        $like->delete();

        return response()->json(['message' => 'Post unliked successfully']);
    }
}
