import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const dynamic = "force-dynamic";

export const GET = async (request) => {
    try {
        await connectToDB();

        // Filter for public prompts that haven't expired
        // Three scenarios:
        // 1. Old prompts with expiresAt = null (backward compatibility)
        // 2. Old prompts without expiresAt field (backward compatibility)
        // 3. New prompts with expiresAt in the future
        const now = new Date();

        console.log(`[Feed] Fetching public prompts. Current time: ${now.toISOString()}`);

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

        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        console.error("Error fetching prompts:", error);
        return new Response("Failed to fetch prompts", { status: 500 });
    }
}
