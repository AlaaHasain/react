<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CommentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the given comment can be modified by the user.
     */
    public function modify(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id;
    }
}
