"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = updateProfile;
exports.updateProfileImage = updateProfileImage;
exports.removeProfileImage = removeProfileImage;
exports.getLoginHistory = getLoginHistory;
const prisma_1 = __importDefault(require("../../config/prisma"));
const cloudinary_1 = require("../../config/cloudinary");
const auth_service_1 = require("./auth.service");
async function updateProfile(userId, data) {
    const user = await prisma_1.default.user.update({ where: { id: userId }, data });
    return (0, auth_service_1.sanitizeUser)(user);
}
async function updateProfileImage(userId, fileBuffer) {
    const current = await prisma_1.default.user.findUnique({ where: { id: userId } });
    const { url, publicId } = await (0, cloudinary_1.uploadBuffer)(fileBuffer, { folder: 'agri-marketplace/profiles' });
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: { profileImage: url, profileImagePublicId: publicId },
    });
    if (current?.profileImagePublicId) {
        await (0, cloudinary_1.deleteAsset)(current.profileImagePublicId).catch(() => { }); // best-effort cleanup
    }
    return (0, auth_service_1.sanitizeUser)(user);
}
/** Removes the profile picture entirely (as opposed to updateProfileImage, which replaces it). */
async function removeProfileImage(userId) {
    const current = await prisma_1.default.user.findUnique({ where: { id: userId } });
    const user = await prisma_1.default.user.update({
        where: { id: userId },
        data: { profileImage: null, profileImagePublicId: null },
    });
    if (current?.profileImagePublicId) {
        await (0, cloudinary_1.deleteAsset)(current.profileImagePublicId).catch(() => { });
    }
    return (0, auth_service_1.sanitizeUser)(user);
}
async function getLoginHistory(userId, { skip, take }) {
    const [items, totalItems] = await Promise.all([
        prisma_1.default.loginHistory.findMany({
            where: { userId },
            orderBy: { loginAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.loginHistory.count({ where: { userId } }),
    ]);
    return { items, totalItems };
}
//# sourceMappingURL=profile.service.js.map