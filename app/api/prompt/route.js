import Prompt from "@models/prompt";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import redis from "@utils/redis";

export const dynamic = "force-dynamic";

export const GET = async (request) => {
    try {
        await connectToDB();

        // CACHE INTERCEPT: Check redis for 'feed:homepage'
        try {
            const cachedPrompts = await redis.get('feed:homepage');
            if (cachedPrompts) {
                console.log(`[Feed] Cache hit! Returning public prompts from Redis.`);
                return new Response(JSON.stringify(cachedPrompts), { status: 200 });
            }
        } catch (redisError) {
            console.error("Redis fetch error:", redisError);
            // Non-fatal error, continue to DB fallback
        }

        // Filter for public prompts that haven't expired
        // Three scenarios:
        // 1. Old prompts with expiresAt = null (backward compatibility)
        // 2. Old prompts without expiresAt field (backward compatibility)
        // 3. New prompts with expiresAt in the future
        const now = new Date();

        console.log(`[Feed] Cache miss. Fetching public prompts from DB. Current time: ${now.toISOString()}`);

        const prompts = await Prompt.find({
            isPrivate: false,
            $or: [
                { expiresAt: { $eq: null } }, // Explicit null values
                { expiresAt: { $exists: false } }, // Field doesn't exist
                { expiresAt: { $gt: now } }, // Not yet expired
            ]
        })
        .populate("creator")
        .sort({ createdAt: -1 }); // Newest first

        console.log(`[Feed] Found ${prompts.length} active public prompts`);
        
        // CACHE STORE: Save to Redis with 10-minute TTL (600 seconds)
        try {
            await redis.set('feed:homepage', prompts, { ex: 600 });
        } catch (redisSetError) {
            console.error("Redis set error:", redisSetError);
        }

        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        console.error("Error fetching prompts:", error);
        return new Response("Failed to fetch prompts", { status: 500 });
    }
}
