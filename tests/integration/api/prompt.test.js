/**
 * @jest-environment node
 */

// ============================================================
// PURPOSE: Integration tests for all API routes
// These tests use a REAL in-memory MongoDB (not the production DB)
// to verify that the API handlers work correctly end-to-end:
// - Creating prompts (POST)
// - Fetching prompts (GET) with caching
// - Getting a single prompt by ID (GET)
// - Updating prompts (PATCH)
// - Deleting prompts (DELETE)
// ============================================================

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Mock Redis — so we don't need a real Redis server during tests
// Mock Database — so connectToDB() becomes a no-op (we connect manually below)
jest.mock('@utils/redis');
jest.mock('@utils/database');

let mongoServer;

// Before ALL tests: spin up an in-memory MongoDB and connect to it
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test_db' });
});

// After ALL tests: disconnect and shut down the in-memory MongoDB
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// After EACH test: wipe all data so tests don't affect each other
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════
// CREATE PROMPT (POST /api/prompt/new)
// ═══════════════════════════════════════════════════════════
describe('POST /api/prompt/new', () => {
  // Helper: creates a fake HTTP request with the given body
  const makeRequest = (body) =>
    new Request('http://localhost:3000/api/prompt/new', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  // Check: Can we create a normal public prompt? Should return 201 (created)
  test('creates a new public prompt and returns 201', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const redis = (await import('@utils/redis')).default;
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const response = await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'What is the meaning of life?',
      tag: 'philosophy',
      isPrivate: false,
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.prompt).toBe('What is the meaning of life?');
    expect(data.tag).toBe('philosophy');
    expect(data.creator).toBe(fakeUserId);
    expect(data.isPrivate).toBe(false);
    // A public non-permanent prompt should have an expiry date set
    expect(data.expiresAt).toBeTruthy();
  });

  // Check: Private prompts should be saved with NO expiry date
  test('creates a private prompt with no expiry', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const response = await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'My secret prompt',
      tag: 'private',
      isPrivate: true,
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.isPrivate).toBe(true);
    expect(data.expiresAt).toBeNull();
  });

  // Check: Permanent public prompts should also have NO expiry date
  test('creates a permanent public prompt with no expiry', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const response = await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'A permanent public prompt',
      tag: 'permanent',
      isPrivate: false,
      isPermanent: true,
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.isPrivate).toBe(false);
    expect(data.expiresAt).toBeNull();
  });

  // Check: For a vanishing public prompt, expiresAt should be ~24 hours from now
  test('sets expiresAt approximately 24 hours in the future for vanishing prompt', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const beforeCreate = Date.now();

    const response = await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'A vanishing prompt',
      tag: 'vanish',
      isPrivate: false,
      isPermanent: false,
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    const expiresAt = new Date(data.expiresAt).getTime();
    const expected24h = beforeCreate + 24 * 60 * 60 * 1000;
    // Allow 5 seconds tolerance (test execution takes time)
    expect(expiresAt).toBeGreaterThanOrEqual(expected24h - 5000);
    expect(expiresAt).toBeLessThanOrEqual(expected24h + 5000);
  });

  // Check: After creating a prompt, the Redis cache should be cleared
  // (so the homepage feed shows the new prompt)
  test('invalidates Redis cache after creating a prompt', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const redis = (await import('@utils/redis')).default;
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'Cache test prompt',
      tag: 'cache',
      isPrivate: false,
    }));

    // Redis del should be called for both the homepage feed and user's personal cache
    expect(redis.del).toHaveBeenCalledWith('feed:homepage');
    expect(redis.del).toHaveBeenCalledWith(`user:${fakeUserId}:prompts`);
  });

  // ─── VALIDATION TESTS ──────────────────────────────────

  // Check: If the prompt text is missing, the API should return 500 (server error)
  test('returns 500 when prompt text is missing', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const response = await POST(makeRequest({
      userId: fakeUserId,
      tag: 'test',
      // prompt is missing!
    }));

    expect(response.status).toBe(500);
  });

  // Check: If the tag is missing, the API should return 500
  test('returns 500 when tag is missing', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    const response = await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'Hello world',
      // tag is missing!
    }));

    expect(response.status).toBe(500);
  });

  // Check: If ALL fields are missing (empty body), the API should return 500
  test('returns 500 when all fields are missing', async () => {
    const { POST } = await import('@app/api/prompt/new/route');

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(500);
  });

  // ─── DATABASE FAILURE TEST ──────────────────────────────

  // Check: If the database crashes while saving, the API should return 500
  // (simulated by making the save function throw an error)
  test('returns 500 when database save fails', async () => {
    const { POST } = await import('@app/api/prompt/new/route');
    const Prompt = (await import('@models/prompt')).default;
    const fakeUserId = new mongoose.Types.ObjectId().toString();

    // Temporarily break the save function to simulate DB crash
    const originalSave = Prompt.prototype.save;
    Prompt.prototype.save = jest.fn().mockRejectedValue(new Error('DB write failed'));

    const response = await POST(makeRequest({
      userId: fakeUserId,
      prompt: 'This should fail',
      tag: 'dbfail',
      isPrivate: false,
    }));

    expect(response.status).toBe(500);

    // Restore original save so other tests work normally
    Prompt.prototype.save = originalSave;
  });
});

// ═══════════════════════════════════════════════════════════
// GET PROMPTS (GET /api/prompt) — Homepage Feed
// ═══════════════════════════════════════════════════════════
describe('GET /api/prompt', () => {

  // Check: If Redis cache is EMPTY (cache miss), the API should:
  // 1. Fetch prompts from the database
  // 2. Return them to the user
  // 3. Store them in Redis cache for next time
  test('returns public prompts from DB on cache MISS', async () => {
    const { GET } = await import('@app/api/prompt/route');
    const redis = (await import('@utils/redis')).default;
    const Prompt = (await import('@models/prompt')).default;

    // Tell Redis to return null (= no cached data)
    redis.get.mockResolvedValue(null);

    // Add a test prompt directly to the database
    const fakeUserId = new mongoose.Types.ObjectId();
    await Prompt.create({
      creator: fakeUserId,
      prompt: 'Public test prompt',
      tag: 'public',
      isPrivate: false,
      expiresAt: null, // permanent
    });

    const request = new Request('http://localhost:3000/api/prompt');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].prompt).toBe('Public test prompt');

    // After fetching from DB, it should save to Redis for next time (10 min TTL)
    expect(redis.set).toHaveBeenCalledWith(
      'feed:homepage',
      expect.any(Array),
      { ex: 600 }
    );
  });

  // Check: If Redis cache HAS data (cache hit), the API should:
  // 1. Return the cached data directly (fast!)
  // 2. NOT go to the database at all
  // 3. NOT update the cache (it's already there)
  test('returns cached prompts on cache HIT', async () => {
    const { GET } = await import('@app/api/prompt/route');
    const redis = (await import('@utils/redis')).default;

    const cachedData = [{ _id: 'cached1', prompt: 'From cache', tag: 'cached' }];
    redis.get.mockResolvedValue(cachedData);

    const request = new Request('http://localhost:3000/api/prompt');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(cachedData);

    // Should NOT rebuild the cache (no redis.set call)
    expect(redis.set).not.toHaveBeenCalled();
  });

  // Check: Private prompts should NEVER appear in the public homepage feed
  test('does NOT return private prompts in the public feed', async () => {
    const { GET } = await import('@app/api/prompt/route');
    const redis = (await import('@utils/redis')).default;
    const Prompt = (await import('@models/prompt')).default;

    redis.get.mockResolvedValue(null);

    const fakeUserId = new mongoose.Types.ObjectId();
    await Prompt.create({
      creator: fakeUserId,
      prompt: 'Secret private prompt',
      tag: 'private',
      isPrivate: true,
    });

    const request = new Request('http://localhost:3000/api/prompt');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // The private prompt should NOT be in the results
    const privatePrompts = data.filter(p => p.prompt === 'Secret private prompt');
    expect(privatePrompts.length).toBe(0);
  });

  // Check: Expired public prompts should NOT appear in the homepage feed
  test('does NOT return expired public prompts', async () => {
    const { GET } = await import('@app/api/prompt/route');
    const redis = (await import('@utils/redis')).default;
    const Prompt = (await import('@models/prompt')).default;

    redis.get.mockResolvedValue(null);

    const fakeUserId = new mongoose.Types.ObjectId();
    await Prompt.create({
      creator: fakeUserId,
      prompt: 'Expired prompt',
      tag: 'expired',
      isPrivate: false,
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    });

    const request = new Request('http://localhost:3000/api/prompt');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // The expired prompt should NOT be in the results
    const expiredPrompts = data.filter(p => p.prompt === 'Expired prompt');
    expect(expiredPrompts.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// GET SINGLE PROMPT (GET /api/prompt/[id])
// ═══════════════════════════════════════════════════════════
describe('GET /api/prompt/[id]', () => {

  // Check: Can we fetch a specific prompt by its ID?
  test('returns a prompt by ID', async () => {
    const { GET } = await import('@app/api/prompt/[id]/route');
    const Prompt = (await import('@models/prompt')).default;

    const fakeUserId = new mongoose.Types.ObjectId();
    const created = await Prompt.create({
      creator: fakeUserId,
      prompt: 'Find me',
      tag: 'find',
      isPrivate: false,
      expiresAt: null,
    });

    const request = new Request(`http://localhost:3000/api/prompt/${created._id}`);
    const response = await GET(request, { params: { id: created._id.toString() } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompt).toBe('Find me');
  });

  // Check: If the prompt ID doesn't exist, the API should return 404 (not found)
  test('returns 404 for non-existent prompt', async () => {
    const { GET } = await import('@app/api/prompt/[id]/route');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const request = new Request(`http://localhost:3000/api/prompt/${fakeId}`);
    const response = await GET(request, { params: { id: fakeId } });

    expect(response.status).toBe(404);
  });

  // Check: If a public prompt has expired, the API should return 410 (Gone)
  // This tells the client "this resource existed but is no longer available"
  test('returns 410 Gone for expired public prompt', async () => {
    const { GET } = await import('@app/api/prompt/[id]/route');
    const Prompt = (await import('@models/prompt')).default;

    const fakeUserId = new mongoose.Types.ObjectId();
    const created = await Prompt.create({
      creator: fakeUserId,
      prompt: 'I am expired',
      tag: 'expired',
      isPrivate: false,
      expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
    });

    const request = new Request(`http://localhost:3000/api/prompt/${created._id}`);
    const response = await GET(request, { params: { id: created._id.toString() } });

    expect(response.status).toBe(410);
  });
});

// ═══════════════════════════════════════════════════════════
// UPDATE PROMPT (PATCH /api/prompt/[id])
// ═══════════════════════════════════════════════════════════
describe('PATCH /api/prompt/[id]', () => {

  // Check: Can we update an existing prompt's text and tag?
  test('updates an existing prompt and returns 200', async () => {
    const { PATCH } = await import('@app/api/prompt/[id]/route');
    const Prompt = (await import('@models/prompt')).default;
    const redis = (await import('@utils/redis')).default;

    const fakeUserId = new mongoose.Types.ObjectId();
    const created = await Prompt.create({
      creator: fakeUserId,
      prompt: 'Old content',
      tag: 'old',
      isPrivate: false,
      expiresAt: null,
    });

    const request = new Request(`http://localhost:3000/api/prompt/${created._id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        prompt: 'Updated content',
        tag: 'updated',
        isPrivate: false,
        isPermanent: true,
      }),
    });

    const response = await PATCH(request, { params: { id: created._id.toString() } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompt).toBe('Updated content');
    expect(data.tag).toBe('updated');

    // After updating, the cache should be cleared
    expect(redis.del).toHaveBeenCalledWith('feed:homepage');
  });

  // Check: If we try to update a prompt that doesn't exist, return 404
  test('returns 404 when updating a non-existent prompt', async () => {
    const { PATCH } = await import('@app/api/prompt/[id]/route');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const request = new Request(`http://localhost:3000/api/prompt/${fakeId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        prompt: 'Does not exist',
        tag: 'none',
        isPrivate: false,
      }),
    });

    const response = await PATCH(request, { params: { id: fakeId } });
    expect(response.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════
// DELETE PROMPT (DELETE /api/prompt/[id])
// ═══════════════════════════════════════════════════════════
describe('DELETE /api/prompt/[id]', () => {

  // Check: Can we delete a prompt? It should:
  // 1. Return 200 (success)
  // 2. Actually remove it from the database
  // 3. Clear the Redis cache
  test('deletes a prompt and returns 200', async () => {
    const { DELETE } = await import('@app/api/prompt/[id]/route');
    const Prompt = (await import('@models/prompt')).default;
    const redis = (await import('@utils/redis')).default;

    const fakeUserId = new mongoose.Types.ObjectId();
    const created = await Prompt.create({
      creator: fakeUserId,
      prompt: 'Delete me',
      tag: 'delete',
      isPrivate: false,
    });

    const request = new Request(`http://localhost:3000/api/prompt/${created._id}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: created._id.toString() } });
    expect(response.status).toBe(200);

    // Double-check: the prompt should no longer exist in the database
    const found = await Prompt.findById(created._id);
    expect(found).toBeNull();

    // Cache should be cleared after deletion
    expect(redis.del).toHaveBeenCalledWith('feed:homepage');
  });

  // Check: Deleting a non-existent prompt should still return 200 (idempotent)
  // This means: calling DELETE twice on the same prompt won't cause errors
  test('returns 200 even for non-existent prompt (idempotent delete)', async () => {
    const { DELETE } = await import('@app/api/prompt/[id]/route');
    const fakeId = new mongoose.Types.ObjectId().toString();

    const request = new Request(`http://localhost:3000/api/prompt/${fakeId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: fakeId } });
    expect(response.status).toBe(200);
  });
});
