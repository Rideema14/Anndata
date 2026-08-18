const addressService = require('./address.service');
const ApiResponse = require('../../common/utils/ApiResponse');
const asyncHandler = require('../../common/middlewares/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user.id);
  ApiResponse.ok(res, addresses);
});

const getOne = asyncHandler(async (req, res) => {
  const address = await addressService.getAddress(req.user.id, req.params.id);
  ApiResponse.ok(res, address);
});

const create = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  ApiResponse.created(res, address, 'Address added.');
});

const update = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
  ApiResponse.ok(res, address, 'Address updated.');
});

const remove = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.user.id, req.params.id);
  ApiResponse.noContent(res);
});

module.exports = { list, getOne, create, update, remove };
