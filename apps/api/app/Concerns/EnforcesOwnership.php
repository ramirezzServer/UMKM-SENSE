<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Model;

/**
 * Reusable ownership check for any Eloquent model that has a user_id column.
 * Use in controllers or policies to verify the authenticated user owns the resource.
 */
trait EnforcesOwnership
{
    protected function ensureOwns(Model $resource): void
    {
        if ((int) $resource->user_id !== (int) auth()->id()) {
            abort(403, 'Akses ditolak. Resource ini bukan milik Anda.');
        }
    }
}
