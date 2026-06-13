<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weather_data', function (Blueprint $table) {
            $table->id();
            $table->string('district', 100)->index();
            $table->date('date')->index();
            $table->string('condition', 20); // clear, cloudy, rainy, stormy
            $table->decimal('temp_min', 5, 2)->nullable();
            $table->decimal('temp_max', 5, 2)->nullable();
            $table->decimal('precipitation', 8, 2)->nullable();
            $table->smallInteger('weather_code')->nullable();
            $table->timestamps();

            $table->unique(['district', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weather_data');
    }
};
