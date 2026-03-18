const redis = {
  del: jest.fn().mockResolvedValue(1),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
};

export default redis;
