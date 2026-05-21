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
        Schema::create('animation_stats', function (Blueprint $table) {
            $table->id();
            $table->enum('animation', ['pendulum', 'ballbeam']);
            $table->string('user_token', 36)->nullable();
            $table->string('ip', 64)->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->timestamp('used_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animation_stats');
    }
};
