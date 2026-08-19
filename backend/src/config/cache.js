// Lightweight in-process cache, mirroring the original spec's CacheConfig
// (used later for Weather and Mandi Price lookups to cut down on external
// API calls). For a multi-instance deployment, swap this for a Redis client
// behind the same get/set/del interface.
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120,
  useClones: false,
});

module.exports = cache;
