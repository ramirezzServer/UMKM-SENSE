<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prediction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prediction_log_id')
                ->constrained('prediction_logs')
                ->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('predicted_qty');
            $table->decimal('predicted_revenue', 15, 2);
            $table->float('confidence');
            $table->string('level', 10);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['prediction_log_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prediction_items');
    }
};
