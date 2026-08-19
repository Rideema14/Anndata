import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import type { AddressInput } from './auth.validation';

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getAddress(userId: string, addressId: string) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound('Address not found.');
  return address;
}

export async function createAddress(userId: string, data: AddressInput) {
  return prisma.$transaction(async (tx) => {
    let isDefault = data.isDefault ?? false;
    if (isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    } else {
      // First address for a user is automatically the default.
      const count = await tx.address.count({ where: { userId } });
      if (count === 0) isDefault = true;
    }
    return tx.address.create({ data: { ...data, isDefault, userId } });
  });
}

export async function updateAddress(userId: string, addressId: string, data: Partial<AddressInput>) {
  await getAddress(userId, addressId); // ensures ownership, throws 404 otherwise

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id: addressId }, data });
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await getAddress(userId, addressId);

  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}
