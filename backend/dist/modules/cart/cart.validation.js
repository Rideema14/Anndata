"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateItemSchema = exports.addItemSchema = void 0;
const zod_1 = require("zod");
exports.addItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid().optional(),
    quantity: zod_1.z.coerce.number().int().positive().default(1),
});
exports.updateItemSchema = zod_1.z.object({
    quantity: zod_1.z.coerce.number().int().positive(),
});
//# sourceMappingURL=cart.validation.js.map