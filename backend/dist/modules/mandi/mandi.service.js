"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStates = listStates;
exports.listDistricts = listDistricts;
exports.listMandis = listMandis;
exports.getMandiById = getMandiById;
exports.createMandi = createMandi;
exports.updateMandi = updateMandi;
exports.deleteMandi = deleteMandi;
exports.listCrops = listCrops;
exports.getCropById = getCropById;
exports.createCrop = createCrop;
exports.updateCrop = updateCrop;
exports.deleteCrop = deleteCrop;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
// --- Cascading location filters ---------------------------------------------
async function listStates() {
    const rows = await prisma_1.default.mandi.findMany({
        where: { isActive: true },
        distinct: ['state'],
        select: { state: true },
        orderBy: { state: 'asc' },
    });
    return rows.map((r) => r.state);
}
async function listDistricts(state) {
    const rows = await prisma_1.default.mandi.findMany({
        where: { isActive: true, state },
        distinct: ['district'],
        select: { district: true },
        orderBy: { district: 'asc' },
    });
    return rows.map((r) => r.district);
}
// --- Mandi CRUD --------------------------------------------------------
async function listMandis(query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const where = { isActive: true };
    if (query.state)
        where.state = query.state;
    if (query.district)
        where.district = query.district;
    const [items, totalItems] = await Promise.all([
        prisma_1.default.mandi.findMany({ where, orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }], skip, take }),
        prisma_1.default.mandi.count({ where }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function getMandiById(id) {
    const mandi = await prisma_1.default.mandi.findUnique({ where: { id } });
    if (!mandi)
        throw ApiError_1.default.notFound('Mandi not found.');
    return mandi;
}
async function createMandi(data) {
    const clash = await prisma_1.default.mandi.findUnique({
        where: { name_state_district: { name: data.name, state: data.state, district: data.district } },
    });
    if (clash)
        throw ApiError_1.default.conflict('A mandi with this name already exists in that district.');
    return prisma_1.default.mandi.create({ data });
}
async function updateMandi(id, data) {
    await getMandiById(id);
    return prisma_1.default.mandi.update({ where: { id }, data });
}
async function deleteMandi(id) {
    const mandi = await prisma_1.default.mandi.findUnique({ where: { id }, include: { prices: { take: 1 } } });
    if (!mandi)
        throw ApiError_1.default.notFound('Mandi not found.');
    if (mandi.prices.length > 0) {
        throw ApiError_1.default.conflict('Cannot delete a mandi that has price records. Deactivate it instead.');
    }
    await prisma_1.default.mandi.delete({ where: { id } });
}
// --- Crop CRUD -----------------------------------------------------------
async function listCrops() {
    return prisma_1.default.crop.findMany({ orderBy: { name: 'asc' } });
}
async function getCropById(id) {
    const crop = await prisma_1.default.crop.findUnique({ where: { id } });
    if (!crop)
        throw ApiError_1.default.notFound('Crop not found.');
    return crop;
}
async function createCrop(data) {
    const clash = await prisma_1.default.crop.findUnique({ where: { name: data.name } });
    if (clash)
        throw ApiError_1.default.conflict('A crop with this name already exists.');
    return prisma_1.default.crop.create({ data });
}
async function updateCrop(id, data) {
    await getCropById(id);
    return prisma_1.default.crop.update({ where: { id }, data });
}
async function deleteCrop(id) {
    const crop = await prisma_1.default.crop.findUnique({ where: { id }, include: { prices: { take: 1 } } });
    if (!crop)
        throw ApiError_1.default.notFound('Crop not found.');
    if (crop.prices.length > 0) {
        throw ApiError_1.default.conflict('Cannot delete a crop that has price records.');
    }
    await prisma_1.default.crop.delete({ where: { id } });
}
//# sourceMappingURL=mandi.service.js.map