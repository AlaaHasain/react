<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 10 male users
        for ($i = 1; $i <= 10; $i++) {
            User::create([
                'name' => fake()->name('male'),
                'username' => 'male_user_' . $i,
                'email' => 'male' . $i . '@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'phone' => fake()->phoneNumber(),
                'image' => 'images/male_' . $i . '.jpg',
                'remember_token' => \Str::random(10),
            ]);
        }

        // Create 10 female users
        for ($i = 1; $i <= 10; $i++) {
            User::create([
                'name' => fake()->name('female'),
                'username' => 'female_user_' . $i,
                'email' => 'female' . $i . '@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'phone' => fake()->phoneNumber(),
                'image' => 'images/female_' . $i . '.jpg',
                'remember_token' => \Str::random(10),
            ]);
        }
    }
}
