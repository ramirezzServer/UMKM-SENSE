<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prediction_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prediction_log_id')
                ->constrained('prediction_logs')
                ->cascadeOnDelete();
            $table->string('priority', 10);
            $table->string('title');
            $table->text('description');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['prediction_log_id', 'sort_order']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE prediction_recommendations ADD CONSTRAINT prediction_recommendations_priority_check
                CHECK (priority IN ('high','medium','low'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('prediction_recommendations');
    }
};
