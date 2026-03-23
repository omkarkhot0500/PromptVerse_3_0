import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";
import redis from "@utils/redis";
import { calculateExpiry } from "@utils/prompt";

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

    // Set expiration using dynamic utility
    newPrompt.expiresAt = calculateExpiry(isPrivate, isPermanent);
    
    if (newPrompt.expiresAt) {
      console.log(`Public vanishing prompt created - Expires at: ${newPrompt.expiresAt.toISOString()}`);
    } else {
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
