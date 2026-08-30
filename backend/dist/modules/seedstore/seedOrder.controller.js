"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancel = exports.updateStatus = exports.getOne = exports.list = exports.checkout = void 0;
const seedOrderService = __importStar(require("./seedOrder.service"));
const seedPaymentService = __importStar(require("./seedPayment.service"));
const ApiResponse_1 = __importDefault(require("../../common/utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const asyncHandler_1 = __importDefault(require("../../common/middlewares/asyncHandler"));
/**
 * One call for the frontend, matching the main store's checkout: places the
 * seed order, decrements stock, clears the seed cart, AND creates the
 * matching Razorpay order in one response.
 */
exports.checkout = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await seedOrderService.checkoutSeeds(req.user.id, req.body);
    const payment = await seedPaymentService.createSeedPaymentForOrder(order.id, req.user);
    ApiResponse_1.default.created(res, { order, payment }, 'Order placed. Proceed to payment.');
});
exports.list = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const { items, meta } = await seedOrderService.listSeedOrders(req.user, req.query);
    ApiResponse_1.default.paginated(res, items, meta);
});
exports.getOne = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await seedOrderService.getSeedOrderById(req.params.id, req.user);
    ApiResponse_1.default.ok(res, order);
});
exports.updateStatus = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await seedOrderService.updateSeedOrderStatus(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, order, 'Order status updated.');
});
exports.cancel = (0, asyncHandler_1.default)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.default.unauthorized('Authentication required.');
    const order = await seedOrderService.cancelSeedOrder(req.params.id, req.user, req.body);
    ApiResponse_1.default.ok(res, order, 'Order cancelled.');
});
//# sourceMappingURL=seedOrder.controller.js.map