import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";
import redis from "@utils/redis";

export const POST = async (request) => {
  const { userId, prompt, tag, isPrivate, isPermanent } = await request.json();

  try {
    await connectToDB();
    const newPrompt = new Prompt({
      creator: userId,
      prompt,
      tag,
      isPrivate: isPrivate || false,
    });

    // Set expiresAt for public prompts (24 hours from now if NOT permanent)
    if (!isPrivate && !isPermanent) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      newPrompt.expiresAt = expiresAt;
      console.log(`Public vanishing prompt created - Expires at: ${expiresAt.toISOString()}`);
    } else {
      newPrompt.expiresAt = null; // No expiry for private or permanent public prompts
      console.log(`${isPrivate ? "Private" : "Permanent Public"} prompt created - No expiry`);
    }

    const savedPrompt = await newPrompt.save();
    console.log(`Prompt saved successfully with ID: ${savedPrompt._id}`);

    // CACHE INVALIDATION
    try {
      await redis.del('feed:homepage');
      await redis.del(`user:${userId}:prompts`);
      console.log(`[Cache Invalidation] Cleared feed and user cache`);
    } catch (redisError) {
      console.error("Redis invalidation error:", redisError);
    }

    return new Response(JSON.stringify(savedPrompt), { status: 201 });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return new Response("Failed to create a new prompt", { status: 500 });
  }
};
