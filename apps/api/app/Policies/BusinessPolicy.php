<?php

namespace App\Policies;

use App\Concerns\EnforcesOwnership;
use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    use EnforcesOwnership;

    public function view(User $user, Business $business): bool
    {
        return $user->id === $business->user_id;
    }

    public function update(User $user, Business $business): bool
    {
        return $user->id === $business->user_id;
    }
}
