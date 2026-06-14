<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->date('event_date');
            $table->string('name');
            $table->string('impact', 10)->default('medium');
            $table->string('district')->nullable()->comment('Null = national scope');
            $table->timestamps();

            $table->index('event_date');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_impact_check
                CHECK (impact IN ('low','medium','high'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};
