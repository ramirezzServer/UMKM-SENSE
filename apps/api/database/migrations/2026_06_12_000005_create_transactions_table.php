<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade')->index();
            $table->string('customer_name', 100)->nullable();
            $table->date('transaction_date');
            $table->string('payment_method', 20)->default('Cash');
            $table->decimal('total_amount', 14, 2);
            $table->string('status', 10)->default('success');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'transaction_date']);
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE transactions ADD CONSTRAINT chk_transactions_payment_method
                CHECK (payment_method IN ('Transfer', 'Cash', 'QRIS'))");

            DB::statement("ALTER TABLE transactions ADD CONSTRAINT chk_transactions_status
                CHECK (status IN ('success', 'pending', 'failed'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
