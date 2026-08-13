const { LRUCache } = require('lru-cache');
const config = require('../config');

class Cache {
  constructor() {
    this.cache = new LRUCache({
      max: config.cache.maxEntries,
      ttl: config.cache.ttl,
      updateAgeOnGet: true
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl
    };
  }
}

module.exports = new Cache();
