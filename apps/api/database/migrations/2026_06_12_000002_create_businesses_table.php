<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->index('user_id');
            $table->string('name', 100);
            $table->string('category', 20);
            $table->string('district', 100);
            $table->decimal('district_lat', 10, 7)->nullable();
            $table->decimal('district_lng', 10, 7)->nullable();
            $table->timestamps();
        });

        // CHECK constraint on PostgreSQL; SQLite skips (enum cast enforces it at app layer)
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE businesses ADD CONSTRAINT chk_businesses_category
                CHECK (category IN ('Kuliner', 'Ritel', 'Jasa', 'Lainnya'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
