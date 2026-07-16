// Phase 16: Graceful Shutdown and Circuit Breakers
class HealthMonitor {
  constructor() {
    this.isShuttingDown = false;
    this.circuitBreakers = {
      supabase: { tripped: false, failureCount: 0, lastFailure: 0 }
    };
  }

  setupGracefulShutdown(server) {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log(`[HealthMonitor] Received ${signal}. Shutting down gracefully...`);
      
      // Stop HTTP Server
      server.close(() => {
        console.log('[HealthMonitor] HTTP Server closed.');
        process.exit(0);
      });

      // Force shutdown after 10s timeout
      setTimeout(() => {
        console.error('[HealthMonitor] Forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  // Circuit Breaker pattern for Supabase requests
  async executeWithCircuitBreaker(name, operation) {
    const cb = this.circuitBreakers[name];
    if (!cb) return await operation();

    // Check if open / tripped
    if (cb.tripped) {
      const timeSinceLastFailure = Date.now() - cb.lastFailure;
      if (timeSinceLastFailure < 30000) { // 30s cooldown
        throw new Error(`[CircuitBreaker] Service ${name} is currently unavailable.`);
      } else {
        // Half-open state
        cb.tripped = false;
        console.log(`[CircuitBreaker] Cooldown expired. Testing service ${name} (Half-Open)...`);
      }
    }

    try {
      const result = await operation();
      cb.failureCount = 0;
      return result;
    } catch (e) {
      cb.failureCount++;
      cb.lastFailure = Date.now();
      if (cb.failureCount >= 5) {
        cb.tripped = true;
        console.error(`[CircuitBreaker] Service ${name} failure threshold met. Tripping circuit breaker.`);
      }
      throw e;
    }
  }

  getLiveness() {
    return !this.isShuttingDown;
  }

  getReadiness() {
    // Service is ready if it's not shutting down and database is reachable (CB not tripped)
    return !this.isShuttingDown && !this.circuitBreakers.supabase.tripped;
  }
}

module.exports = new HealthMonitor();
