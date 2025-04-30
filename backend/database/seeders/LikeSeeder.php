<?php

namespace Database\Seeders;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class LikeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all user IDs
        $userIds = User::pluck('id')->toArray();

        // Get all post IDs
        $postIds = Post::pluck('id')->toArray();

        // Create between 5-20 likes for each post
        foreach ($postIds as $postId) {
            // Shuffle users to pick random unique users to like each post
            $shuffledUsers = $userIds;
            shuffle($shuffledUsers);

            // Select a random number of unique users to like this post
            $likeCount = rand(5, min(20, count($userIds)));
            $usersWhoLike = array_slice($shuffledUsers, 0, $likeCount);

            foreach ($usersWhoLike as $userId) {
                Like::create([
                    'user_id' => $userId,
                    'post_id' => $postId,
                    'created_at' => fake()->dateTimeBetween('-2 months', 'now'),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
