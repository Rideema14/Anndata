import * as addressService from './address.service';
import ApiResponse from '../../common/utils/ApiResponse';
import ApiError from '../../common/utils/ApiError';
import asyncHandler from '../../common/middlewares/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const addresses = await addressService.listAddresses(req.user.id);
  ApiResponse.ok(res, addresses);
});

export const getOne = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const address = await addressService.getAddress(req.user.id, req.params.id);
  ApiResponse.ok(res, address);
});

export const create = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const address = await addressService.createAddress(req.user.id, req.body);
  ApiResponse.created(res, address, 'Address added.');
});

export const update = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
  ApiResponse.ok(res, address, 'Address updated.');
});

export const remove = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized('Authentication required.');
  await addressService.deleteAddress(req.user.id, req.params.id);
  ApiResponse.noContent(res);
});
