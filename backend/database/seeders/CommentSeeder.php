<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommentSeeder extends Seeder
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

        // Create between 3-8 comments for each post
        foreach ($postIds as $postId) {
            $commentCount = rand(3, 8);

            for ($i = 0; $i < $commentCount; $i++) {
                Comment::create([
                    'body' => fake()->paragraph(rand(1, 3)),
                    'user_id' => $userIds[array_rand($userIds)], // Random user
                    'post_id' => $postId,
                    'created_at' => fake()->dateTimeBetween('-2 months', 'now'),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
