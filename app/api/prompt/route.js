import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const GET = async (request) => {
    try {
        await connectToDB();
        
        // NEW: Filter for public prompts that haven't expired
        const prompts = await Prompt.find({
            isPrivate: false,
            $or: [
                { expiresAt: null }, // Backward compatibility: old prompts without expiresAt
                { expiresAt: { $gt: new Date() } }, // Not yet expired
            ]
        })
        .populate("creator")
        .sort({ createdAt: -1 }); // Newest first
        
        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        return new Response("Failed to fetch prompts", { status: 500 });
    }
}
