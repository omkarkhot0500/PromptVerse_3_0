import Prompt from "@models/prompt";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import redis from "@utils/redis";

export const dynamic = "force-dynamic";

export const GET = async (request, { params }) => {
    try {
        await connectToDB();

        const cacheKey = `user:${params.id}:prompts`;

        // CACHE INTERCEPT
        try {
            const cachedUserPrompts = await redis.get(cacheKey);
            if (cachedUserPrompts) {
                console.log(`[User Feed] Cache hit for ${cacheKey}`);
                return new Response(JSON.stringify(cachedUserPrompts), { status: 200 });
            }
        } catch (redisError) {
            console.error("Redis fetch error:", redisError);
        }

        const now = new Date();

        console.log(`[User Feed] Cache miss for ${cacheKey}. Fetching from DB.`);

        // Get all of user's private prompts + their non-expired public prompts
        const prompts = await Prompt.find({
            creator: params.id,
            $or: [
                { isPrivate: true }, // All private prompts (never expire)
                {
                    isPrivate: false,
                    $or: [
                        { expiresAt: { $eq: null } }, // Old prompts with explicit null
                        { expiresAt: { $exists: false } }, // Old prompts without field
                        { expiresAt: { $gt: now } }, // Not yet expired
                    ]
                }
            ]
        })
        .populate("creator")
        .sort({ createdAt: -1 });

        // CACHE STORE: Save to Redis with 10-minute TTL (600 seconds)
        try {
            await redis.set(cacheKey, prompts, { ex: 600 });
        } catch (redisSetError) {
            console.error("Redis set error:", redisSetError);
        }

        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        console.error("Error fetching user posts:", error);
        return new Response("Failed to fetch prompts created by user", { status: 500 })
    }
}
