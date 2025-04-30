<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;

class AuthController extends Controller
{

    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:15',
            'image' => 'nullable|image|max:2048', // Validate image
        ]);

        // Handle image upload if provided
        if ($request->hasFile('image')) {
            $fields['image'] = $request->file('image')->store('images', 'public'); // Save to storage/app/public/images
        }

        // Hash the password before saving
        $fields['password'] = bcrypt($fields['password']);

        $user = User::create($fields);

        // Add image_url to the user data
        $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

        $token = $user->createToken($request->name);

        return [
            'user' => $user,
            'token' => $token->plainTextToken,
        ];
    }
    public function login(Request $request)
    {
        $fields = $request->validate(
            [
                'email' => 'required|email|exists:users',
                'password' => 'required',
            ]
        );
        $user = User::where('email', $request->email)->first();

        if (!$user || ! Hash::check($request->password, $user->password)) {
            return response([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Add image_url to the user data
        $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

        $token = $user->createToken($user->name);

        return [
            'user' => $user,
            'token' => $token->plainTextToken,
        ];
    }
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return [
            'message' => 'Logged out'
        ];
    }

    public function update(Request $request)
    {
        // Get the authenticated user
        $user = $request->user();

        // Validate the request
        $fields = $request->validate([
            'name' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username,' . $user->id,
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:15',
            'image' => 'nullable|image|max:2048', // Ensure image is nullable and valid
        ]);

        // Handle image upload if provided
        if ($request->hasFile('image')) {
            $fields['image'] = $request->file('image')->store('images', 'public'); // Save to storage/app/public/images
        }

        // Only update fields that were actually passed
        $user->update(array_filter($fields));

        // Add the full URL for the image if it exists
        $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
    }

    public function show(Request $request)
    {
        $user = $request->user();

        // Add the full URL for the image if it exists
        $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

        return response()->json(['user' => $user]);
    }

    public function publicProfile($id)
    {
        // Find the user by ID
        $user = User::findOrFail($id);

        // Add the full URL for the image if it exists
        $user->image_url = $user->image ? asset('storage/' . $user->image) : null;

        // Return only public fields
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email, // Optional: Include only if public
                'phone' => $user->phone, // Optional: Include only if public
                'image_url' => $user->image_url,
                'created_at' => $user->created_at,
            ]
        ]);
    }
}
