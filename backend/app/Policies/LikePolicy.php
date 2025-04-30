<?php

namespace App\Policies;

use App\Models\Like;
use App\Models\User;

class LikePolicy
{
    /**
     * Determine if the given like can be deleted by the user.
     */
    public function delete(User $user, Like $like): bool
    {
        return $user->id === $like->user_id;
    }
}
