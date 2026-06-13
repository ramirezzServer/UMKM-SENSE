<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('national_holidays', function (Blueprint $table) {
            $table->id();
            $table->date('holiday_date')->unique();
            $table->string('holiday_name', 200);
            $table->smallInteger('year')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('national_holidays');
    }
};
