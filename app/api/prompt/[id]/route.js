import Prompt from "@models/prompt";
import User from "@models/user";
import { connectToDB } from "@utils/database";
import redis from "@utils/redis";

export const dynamic = "force-dynamic";

export const GET = async (request, { params }) => {
    try {
        await connectToDB()

        const prompt = await Prompt.findById(params.id).populate("creator")
        if (!prompt) return new Response("Prompt Not Found", { status: 404 });

        // NEW: Check if public prompt is expired
        if (!prompt.isPrivate && prompt.expiresAt && new Date() > prompt.expiresAt) {
            return new Response("Prompt has expired", { status: 410 }); // 410 Gone
        }

        return new Response(JSON.stringify(prompt), { status: 200 })

    } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
    }
}

export const PATCH = async (request, { params }) => {
    const { prompt, tag, isPrivate, isPermanent } = await request.json();

    try {
        await connectToDB();

        const existingPrompt = await Prompt.findById(params.id);

        if (!existingPrompt) {
            return new Response("Prompt not found", { status: 404 });
        }

        existingPrompt.prompt = prompt;
        existingPrompt.tag = tag;
        existingPrompt.isPrivate = isPrivate;

        // NEW: Handle expiry logically
        if (!isPrivate && !isPermanent) {
            // Set for 24 hours if it's a public vanishing prompt
            // Always refresh expiry on update if it's vanishing
            existingPrompt.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else {
            // No expiry for private or permanent public prompts
            existingPrompt.expiresAt = null;
        }

        await existingPrompt.save();

        // CACHE INVALIDATION
        try {
            await redis.del('feed:homepage');
            await redis.del(`user:${existingPrompt.creator}:prompts`);
            console.log(`[Cache Invalidation] Cleared feed and user cache after update`);
        } catch (redisError) {
            console.error("Redis invalidation error:", redisError);
        }

        return new Response(JSON.stringify(existingPrompt), { status: 200 });
    } catch (error) {
        return new Response("Error Updating Prompt", { status: 500 });
    }
};

export const DELETE = async (request, { params }) => {
    try {
        await connectToDB();

        // Find the prompt by ID and remove it
        const deletedPrompt = await Prompt.findByIdAndDelete(params.id);

        if (deletedPrompt) {
            // CACHE INVALIDATION
            try {
                await redis.del('feed:homepage');
                await redis.del(`user:${deletedPrompt.creator}:prompts`);
                console.log(`[Cache Invalidation] Cleared feed and user cache after deletion`);
            } catch (redisError) {
                console.error("Redis invalidation error:", redisError);
            }
        }

        return new Response("Prompt deleted successfully", { status: 200 });
    } catch (error) {
        return new Response("Error deleting prompt", { status: 500 });
    }
};
