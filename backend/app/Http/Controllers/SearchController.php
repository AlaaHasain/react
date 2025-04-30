<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SearchController extends Controller
{
    /**
     * Search for posts and users based on query
     * When a user is found, their posts are also included in both the users and posts arrays
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        // More lenient validation with fallback to empty string
        $query = $request->input('query', '');

        // Return all if query is empty
        if (empty($query)) {
            return response()->json([
                'message' => 'Please provide a search query',
                'posts' => [],
                'users' => []
            ]);
        }

        // Search in posts (title and body)
        $posts = Post::where('title', 'like', "%{$query}%")
            ->orWhere('body', 'like', "%{$query}%")
            ->with('user')
            ->get();

        // Search in users (name and email) and include their posts
        $users = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->with(['posts' => function ($query) {
                $query->with('user');
            }])
            ->get();

        // Create a collection to hold all posts
        $allPosts = new Collection($posts);

        // Add users' posts to the main posts array
        foreach ($users as $user) {
            // Add image URL for user
            $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

            // Add each post from this user to the main posts array if not already there
            foreach ($user->posts as $userPost) {
                if (!$allPosts->contains('id', $userPost->id)) {
                    $allPosts->push($userPost);
                }
            }
        }

        // Add image URL for post authors in all posts
        foreach ($allPosts as $post) {
            if (isset($post->user)) {
                $post->user->image_url = $post->user->image ? asset('storage/' . $post->user->image) : null;
            }
        }

        // Format the response with users and their posts
        return response()->json([
            'query' => $query,
            'posts' => $allPosts,
            'users' => $users
        ]);
    }
}
