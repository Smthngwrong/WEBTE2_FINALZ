<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('request_logs', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 36)->nullable();
            $table->enum('type', ['execute', 'simulate_pendulum', 'simulate_ballbeam']);
            $table->text('command')->nullable();
            $table->json('params')->nullable();
            $table->enum('status', ['success', 'error']);
            $table->text('error')->nullable();
            $table->string('ip', 64)->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_logs');
    }
};
