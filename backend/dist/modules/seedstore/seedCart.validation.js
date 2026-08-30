"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSeedItemSchema = exports.addSeedItemSchema = void 0;
const zod_1 = require("zod");
exports.addSeedItemSchema = zod_1.z.object({
    seedId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid().optional(),
    quantity: zod_1.z.coerce.number().int().positive().default(1),
});
exports.updateSeedItemSchema = zod_1.z.object({
    quantity: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=seedCart.validation.js.map