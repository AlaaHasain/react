<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\UserController;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'show']);

// Search API
Route::get('/search', [SearchController::class, 'search']);

// Posts
Route::apiResource("posts", PostController::class);

// User profile routes
Route::middleware('auth:sanctum')->get('/profile', [UserController::class, 'profile']);
Route::middleware('auth:sanctum')->put('/profile/update', [AuthController::class, 'update']);
Route::get('/users/{user}', [UserController::class, 'publicProfile']);
Route::get('/random-users', [UserController::class, 'randomUsers']); // New endpoint for random users

// Comments
Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
Route::put('/comments/{comment}', [CommentController::class, 'update']);
Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

// Likes
Route::get('/posts/{post}/likes', [LikeController::class, 'index']);
Route::post('/posts/{post}/likes', [LikeController::class, 'store']);
Route::delete('/posts/{post}/likes', [LikeController::class, 'destroy']);

// Auth routes
Route::post("/register", [AuthController::class, "register"])->name("register");
Route::post("/login", [AuthController::class, "login"])->name("login");
Route::post("/logout", [AuthController::class, "logout"])->name("logout")->middleware('auth:sanctum');
