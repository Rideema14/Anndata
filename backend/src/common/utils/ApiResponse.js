/**
 * Wraps every successful response in a consistent envelope:
 * { success, message, data, meta? }
 */
class ApiResponse {
  static send(res, { statusCode = 200, message = 'Success', data = null, meta = undefined }) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, data, message = 'Success') {
    return ApiResponse.send(res, { statusCode: 200, message, data });
  }

  static created(res, data, message = 'Created') {
    return ApiResponse.send(res, { statusCode: 201, message, data });
  }

  static paginated(res, items, pagination, message = 'Success') {
    return ApiResponse.send(res, { statusCode: 200, message, data: items, meta: { pagination } });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
