import prisma from '../../config/prisma';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import { sanitizeUser } from './auth.service';
import type { UpdateProfileInput } from './auth.validation';

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return sanitizeUser(user);
}

export async function updateProfileImage(userId: string, fileBuffer: Buffer) {
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

export async function getLoginHistory(userId: string, { skip, take }: { skip: number; take: number }) {
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
