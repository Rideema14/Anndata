const prisma = require('../../config/prisma');
const { uploadBuffer, deleteAsset } = require('../../config/cloudinary');
const { sanitizeUser } = require('./auth.service');

async function updateProfile(userId, data) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return sanitizeUser(user);
}

async function updateProfileImage(userId, fileBuffer) {
  const current = await prisma.user.findUnique({ where: { id: userId } });

  const { url, publicId } = await uploadBuffer(fileBuffer, { folder: 'agri-marketplace/profiles' });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileImage: url, profileImagePublicId: publicId },
  });

  if (current?.profileImagePublicId) {
    await deleteAsset(current.profileImagePublicId).catch(() => {}); // best-effort cleanup
  }

  return sanitizeUser(user);
}

async function getLoginHistory(userId, { skip, take }) {
  const [items, totalItems] = await Promise.all([
    prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      skip,
      take,
    }),
    prisma.loginHistory.count({ where: { userId } }),
  ]);
  return { items, totalItems };
}

module.exports = { updateProfile, updateProfileImage, getLoginHistory };
