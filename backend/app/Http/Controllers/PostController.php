<?php

namespace App\Http\Controllers;

use App\Models\Post;

use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;

class PostController extends Controller implements HasMiddleware
{

    public static function middleware()
    {
        return [
            new Middleware('auth:sanctum', except: ['index', 'show'])
        ];
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth('sanctum')->user(); // Retrieve user from Bearer token authentication

        // Get pagination parameters from request
        $limit = $request->input('limit', 10); // Number of posts per page, default 10
        $cursor = $request->input('cursor'); // The ID of the last post from previous page

        $query = Post::with('user')
            ->withCount('comments')
            ->withCount('likes')
            ->orderBy('created_at', 'desc');

        // Apply cursor pagination if cursor is provided
        if ($cursor) {
            $cursorPost = Post::find($cursor);
            if ($cursorPost) {
                $query->where('created_at', '<', $cursorPost->created_at)
                    ->orWhere(function ($query) use ($cursorPost) {
                        $query->where('created_at', '=', $cursorPost->created_at)
                            ->where('id', '<', $cursorPost->id);
                    });
            }
        }

        // Limit the number of results
        $query->limit($limit + 1); // Get one extra item to check if there are more pages

        if ($user) {
            // Create a subquery to check if the post is liked by current user
            $posts = $query->selectRaw('posts.*, EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked', [$user->id])
                ->get();
        } else {
            // For unauthenticated users, no posts are liked
            $posts = $query->selectRaw('posts.*, false as is_liked')
                ->get();
        }

        // Check if there are more posts after this page
        $hasNextPage = $posts->count() > $limit;

        // Remove the extra item
        if ($hasNextPage) {
            $posts = $posts->take($limit);
        }

        // Add user image_url and cast is_liked to boolean
        foreach ($posts as $p) {
            $p->user->image_url = $p->user->image ? asset('storage/' . $p->user->image) : null;
            $p->is_liked = (bool) $p->is_liked;
        }

        // Get the ID of the last post for the next cursor
        $nextCursor = $posts->last() ? $posts->last()->id : null;

        return response()->json([
            'data' => $posts,
            'pagination' => [
                'hasNextPage' => $hasNextPage,
                'nextCursor' => $nextCursor
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'title' => 'required',
            'body' => 'required'
        ]);

        $post = $request->user()->posts()->create($fields);

        return $post;
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Post $post)
    {
        $user = $request->user(); // null if unauthenticated

        $post->loadCount('comments', 'likes');
        $post->load(['user', 'comments.user', 'likes.user']);

        // Add is_liked attribute
        if ($user) {
            $post->is_liked = $post->likes()->where('user_id', $user->id)->exists();
        } else {
            $post->is_liked = false;
        }

        // Add image URL for post author
        $post->user->image_url = $post->user->image ? asset('storage/' . $post->user->image) : null;

        // Add image URL for each comment author
        foreach ($post->comments as $comment) {
            $comment->user->image_url = $comment->user->image ? asset('storage/' . $comment->user->image) : null;
        }

        return $post;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post)
    {
        Gate::authorize('modify', $post);

        $fields = $request->validate([
            'title' => 'required',
            'body' => 'required'
        ]);

        $post->update($fields);

        return $post;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        Gate::authorize('modify', $post);

        $post->delete();
        return ['message' => 'Post deleted'];
    }
    /**
     * Check if the authenticated user has liked a post
     */
    public function checkLike(Request $request, Post $post)
    {
        $liked = $post->likes()->where('user_id', $request->user()->id)->exists();
        return ['liked' => $liked];
    }
}
