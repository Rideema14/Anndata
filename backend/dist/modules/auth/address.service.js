"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAddresses = listAddresses;
exports.getAddress = getAddress;
exports.createAddress = createAddress;
exports.updateAddress = updateAddress;
exports.deleteAddress = deleteAddress;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
async function listAddresses(userId) {
    return prisma_1.default.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
}
async function getAddress(userId, addressId) {
    const address = await prisma_1.default.address.findFirst({ where: { id: addressId, userId } });
    if (!address)
        throw ApiError_1.default.notFound('Address not found.');
    return address;
}
async function createAddress(userId, data) {
    return prisma_1.default.$transaction(async (tx) => {
        let isDefault = data.isDefault ?? false;
        if (isDefault) {
            await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        }
        else {
            // First address for a user is automatically the default.
            const count = await tx.address.count({ where: { userId } });
            if (count === 0)
                isDefault = true;
        }
        return tx.address.create({ data: { ...data, isDefault, userId } });
    });
}
async function updateAddress(userId, addressId, data) {
    await getAddress(userId, addressId); // ensures ownership, throws 404 otherwise
    return prisma_1.default.$transaction(async (tx) => {
        if (data.isDefault) {
            await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        }
        return tx.address.update({ where: { id: addressId }, data });
    });
}
async function deleteAddress(userId, addressId) {
    const address = await getAddress(userId, addressId);
    await prisma_1.default.address.delete({ where: { id: addressId } });
    if (address.isDefault) {
        const next = await prisma_1.default.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
        if (next)
            await prisma_1.default.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
}
//# sourceMappingURL=address.service.js.map