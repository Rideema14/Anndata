const prisma = require('../../config/prisma');
const ApiError = require('../../common/utils/ApiError');

async function listAddresses(userId) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

async function getAddress(userId, addressId) {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw ApiError.notFound('Address not found.');
  return address;
}

async function createAddress(userId, data) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    } else {
      // First address for a user is automatically the default.
      const count = await tx.address.count({ where: { userId } });
      if (count === 0) data.isDefault = true;
    }
    return tx.address.create({ data: { ...data, userId } });
  });
}

async function updateAddress(userId, addressId, data) {
  await getAddress(userId, addressId); // ensures ownership, throws 404 otherwise

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id: addressId }, data });
  });
}

async function deleteAddress(userId, addressId) {
  const address = await getAddress(userId, addressId);

  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}

module.exports = { listAddresses, getAddress, createAddress, updateAddress, deleteAddress };
