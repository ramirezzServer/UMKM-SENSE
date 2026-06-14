<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prediction_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('pending');
            $table->date('prediction_start');
            $table->date('prediction_end');
            $table->string('forecast_method', 20)->nullable();
            $table->float('mae')->nullable();
            $table->float('mape')->nullable();
            $table->text('ai_summary')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('product_id');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE prediction_logs ADD CONSTRAINT prediction_logs_status_check
                CHECK (status IN ('pending','processing','done','failed'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('prediction_logs');
    }
};
