import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const GET = async (request, { params }) => {
    try {
        await connectToDB()

        // NEW: Get all of user's private prompts + their non-expired public prompts
        const prompts = await Prompt.find({
            creator: params.id,
            $or: [
                { isPrivate: true }, // All private prompts (never expire)
                {
                    isPrivate: false,
                    $or: [
                        { expiresAt: null }, // Old prompts without expiresAt
                        { expiresAt: { $gt: new Date() } }, // Not yet expired
                    ]
                }
            ]
        })
        .populate("creator")
        .sort({ createdAt: -1 });

        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        return new Response("Failed to fetch prompts created by user", { status: 500 })
    }
}
