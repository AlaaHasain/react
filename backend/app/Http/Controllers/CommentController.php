<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller implements HasMiddleware
{
    public static function middleware()
    {
        return [
            new Middleware('auth:sanctum')
        ];
    }

    // Get all comments for a post
    public function index(Post $post)
    {
        $comments = $post->comments()->with('user')->get();

        // Add image URL for each user
        foreach ($comments as $comment) {
            $comment->user->image_url = $comment->user->image ? asset('storage/' . $comment->user->image) : null;
        }

        return $comments;
    }

    // Create a new comment
    public function store(Request $request, Post $post)
    {
        $fields = $request->validate([
            'body' => 'required|string'
        ]);

        // Create the comment with explicit user_id association
        $comment = $post->comments()->create([
            'body' => $fields['body'],
            'user_id' => $request->user()->id  // Explicitly set the user_id
        ]);

        // Load the user and add image URL
        $comment->load('user');
        $comment->user->image_url = $request->user()->image ? asset('storage/' . $request->user()->image) : null;

        return $comment;
    }

    // Update a comment
    public function update(Request $request, Comment $comment)
    {
        // Only the comment author can update it
        Gate::authorize('modify', $comment);

        $fields = $request->validate([
            'body' => 'required|string'
        ]);

        $comment->update($fields);

        // Load the user and add image URL
        $comment->load('user');
        $comment->user->image_url = $comment->user->image ? asset('storage/' . $comment->user->image) : null;

        return $comment;
    }

    // Delete a comment
    public function destroy(Comment $comment)
    {
        // Only the comment author can delete it
        Gate::authorize('modify', $comment);

        $comment->delete();
        return ['message' => 'Comment deleted'];
    }
}
