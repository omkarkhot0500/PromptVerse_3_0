import Prompt from "@models/prompt";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import redis from "@utils/redis";

export const dynamic = "force-dynamic";

export const GET = async (request) => {
    const { searchParams } = new URL(request.url);
    const searchText = searchParams.get("search");

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
        let pipeline = [];

        // 1. If we have a search query, use Atlas Search (MUST be first stage)
        if (searchText) {
            pipeline.push({
                $search: {
                    index: "promptsearch", // Matches correctly!
                    compound: {
                        should: [
                            {
                                text: {
                                    query: searchText,
                                    path: ["prompt", "tag"],
                                    fuzzy: { maxEdits: 1 }
                                }
                            }
                        ]
                    }
                }
            });
        }

        // 2. Filter for active public prompts
        pipeline.push({
            $match: {
                isPrivate: false,
                $or: [
                    { expiresAt: { $eq: null } },
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: now } },
                ]
            }
        });

        // 3. Populate creator info (Lookup users since we are in aggregation)
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator"
            }
        });
        pipeline.push({ $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } });
        console.log(`[Feed] Cache miss. Fetching public prompts from DB. Current time: ${now.toISOString()}`);

        // 4. Sort results
        if (searchText) {
            // Sort by relevance score if searching
            pipeline.push({ $addFields: { searchScore: { $meta: "searchScore" } } });
            pipeline.push({ $sort: { searchScore: -1 } });
        } else {
            // Newest first if listing everything
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        const prompts = await Prompt.aggregate(pipeline);
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
