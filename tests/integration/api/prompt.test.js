/**
 * @jest-environment node
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Redis and Database — prevents real connections
jest.mock('@utils/redis');
jest.mock('@utils/database');

let mongoServer;

beforeAll(async () => {
  // Spin up an in-memory MongoDB and connect directly via Mongoose
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test_db' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('API Integration: Create Prompt', () => {
  test('creates a new prompt and returns status 201', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const redis = (await import('@utils/redis')).default;

    // Use a valid MongoDB ObjectId for creator
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const body = {
      userId: fakeUserId,
      prompt: 'Is this a real life?',
      tag: 'philosophy',
      isPrivate: false,
    };

    const request = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.prompt).toBe('Is this a real life?');
    expect(data.tag).toBe('philosophy');
    expect(data.creator).toBe(fakeUserId);

    // Verify Redis del was called for cache invalidation
    expect(redis.del).toHaveBeenCalled();
  });

  test('creates a private prompt with no expiry', async () => {
    const { POST } = await import('@app/api/prompt/new/route');

    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const body = {
      userId: fakeUserId,
      prompt: 'My secret prompt',
      tag: 'private',
      isPrivate: true,
    };

    const request = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.isPrivate).toBe(true);
    expect(data.expiresAt).toBeNull();
  });

  test('returns 500 if prompt data is missing', async () => {
    const { POST } = await import('@app/api/prompt/new/route');

    const request = new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
