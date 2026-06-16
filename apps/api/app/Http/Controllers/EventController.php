<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * GET /events — list events owned by the authenticated user.
     * Optional: ?from=YYYY-MM-DD&to=YYYY-MM-DD to narrow by start_date range.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::where('user_id', $request->user()->id)
            ->orderBy('start_date');

        if ($request->filled('from')) {
            $query->where('start_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('start_date', '<=', $request->input('to'));
        }

        return response()->json(EventResource::collection($query->get()));
    }

    /**
     * POST /events — create a new event for the authenticated user.
     */
    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = Event::create(
            ['user_id' => $request->user()->id] + $request->validated()
        );

        return (new EventResource($event))->response()->setStatusCode(201);
    }

    /**
     * PUT /events/{event} — update an existing event (ownership enforced via policy).
     */
    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);
        $event->update($request->validated());

        return response()->json(new EventResource($event));
    }

    /**
     * DELETE /events/{event} — delete an event (ownership enforced via policy).
     */
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $this->authorize('delete', $event);
        $event->delete();

        return response()->json(null, 204);
    }
}
