<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Return the authenticated user's own business profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('business');

        $this->authorize('view', $user->business);

        return UserResource::make($user)->response();
    }

    /**
     * Update the authenticated user's own business profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $this->authorize('update', $user->business);

        $user->business->update($request->validated());

        return UserResource::make($user->load('business'))->response();
    }

    /**
     * Update a business by explicit ID (demonstrates IDOR/ownership protection).
     * Any attempt to update another user's business returns 403 via BusinessPolicy.
     */
    public function updateById(UpdateProfileRequest $request, Business $business): JsonResponse
    {
        $this->authorize('update', $business);

        $business->update($request->validated());

        $user = $request->user()->load('business');

        return UserResource::make($user)->response();
    }
}
