<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clear any existing data by refreshing the database
        // Truncating tables is handled by migrations:fresh

        // Call our seeders in the right order
        $this->call([
            UserSeeder::class,    // First create users
            PostSeeder::class,    // Then create posts
            CommentSeeder::class, // Then create comments on posts
            LikeSeeder::class,    // Then create likes on posts
        ]);
    }
}
