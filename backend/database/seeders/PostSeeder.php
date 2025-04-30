<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all user IDs
        $userIds = User::pluck('id')->toArray();

        // Create 100 posts distributed among users
        for ($i = 1; $i <= 100; $i++) {
            Post::create([
                'title' => fake()->sentence(rand(3, 8)),
                'body' => fake()->paragraphs(rand(1, 3), true),
                'user_id' => $userIds[array_rand($userIds)], // Random user
                'created_at' => fake()->dateTimeBetween('-3 months', 'now'),
                'updated_at' => now(),
            ]);
        }
    }
}
