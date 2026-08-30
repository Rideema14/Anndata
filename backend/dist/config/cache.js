"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Lightweight in-process cache, mirroring the original spec's CacheConfig
// (used later for Weather and Mandi Price lookups to cut down on external
// API calls). For a multi-instance deployment, swap this for a Redis client
// behind the same get/set/del interface.
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({
    stdTTL: 600, // 10 minutes default
    checkperiod: 120,
    useClones: false,
});
exports.default = cache;
//# sourceMappingURL=cache.js.map