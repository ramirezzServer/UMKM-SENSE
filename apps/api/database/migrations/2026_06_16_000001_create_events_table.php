<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('type', 20)->default('lainnya');
            $table->timestamps();

            $table->index(['user_id', 'start_date']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_type_check
                CHECK (type IN ('promo','libur','lainnya'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
