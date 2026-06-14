<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prediction_warnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prediction_log_id')
                ->constrained('prediction_logs')
                ->cascadeOnDelete();
            $table->string('level', 10);
            $table->text('message');
            $table->timestamp('created_at')->useCurrent();

            $table->index('prediction_log_id');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE prediction_warnings ADD CONSTRAINT prediction_warnings_level_check
                CHECK (level IN ('high','medium','low'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('prediction_warnings');
    }
};
