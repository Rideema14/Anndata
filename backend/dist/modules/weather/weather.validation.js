"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weatherQuerySchema = void 0;
const zod_1 = require("zod");
exports.weatherQuerySchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90),
    lng: zod_1.z.coerce.number().min(-180).max(180),
    days: zod_1.z.coerce.number().int().min(1).max(16).default(7),
});
//# sourceMappingURL=weather.validation.js.map