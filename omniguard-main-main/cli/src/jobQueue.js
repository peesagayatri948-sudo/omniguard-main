const eventBus = require('./eventBus');

class JobQueue {
  constructor(concurrency = 4) {
    this.queue = [];
    this.activeCount = 0;
    this.concurrency = concurrency;
    this.processors = new Map();
  }

  /**
   * Register a processor for a specific job type
   */
  process(jobType, handler) {
    this.processors.set(jobType, handler);
  }

  /**
   * Add a job to the queue
   */
  add(jobType, payload, priority = 0) {
    return new Promise((resolve, reject) => {
      const job = {
        id: Math.random().toString(36).substring(2, 15),
        type: jobType,
        payload,
        priority,
        resolve,
        reject,
        status: 'pending',
        attempts: 0,
        addedAt: Date.now()
      };

      // Insert sorted by priority (higher number = higher priority)
      const index = this.queue.findIndex(j => j.priority < priority);
      if (index === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(index, 0, job);
      }

      eventBus.emit(`Job:Added:${jobType}`, { id: job.id, payload });
      this._pump();
    });
  }

  /**
   * Internal mechanism to process the next job in the queue
   */
  async _pump() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.activeCount++;
    const job = this.queue.shift();
    job.status = 'active';
    job.attempts++;

    const handler = this.processors.get(job.type);
    
    if (!handler) {
      job.reject(new Error(`No processor found for job type: ${job.type}`));
      this.activeCount--;
      this._pump();
      return;
    }

    try {
      eventBus.emit(`Job:Started:${job.type}`, { id: job.id });
      const result = await handler(job.payload, job);
      job.status = 'completed';
      eventBus.emit(`Job:Completed:${job.type}`, { id: job.id, result });
      job.resolve(result);
    } catch (error) {
      job.status = 'failed';
      eventBus.emit(`Job:Failed:${job.type}`, { id: job.id, error: error.message });
      // In a robust implementation, we might retry here based on options
      job.reject(error);
    } finally {
      this.activeCount--;
      this._pump();
    }
  }

  getStats() {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      concurrency: this.concurrency
    };
  }
}

// Export a singleton instance for global use across the daemon
const globalQueue = new JobQueue();
module.exports = globalQueue;
