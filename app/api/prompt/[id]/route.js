import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

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
    const { prompt, tag, isPrivate } = await request.json();

    try {
        await connectToDB();

        const existingPrompt = await Prompt.findById(params.id);

        if (!existingPrompt) {
            return new Response("Prompt not found", { status: 404 });
        }

        // NEW: Handle visibility change logic
        const wasPrivate = existingPrompt.isPrivate;
        const isNowPublic = !isPrivate && wasPrivate;

        existingPrompt.prompt = prompt;
        existingPrompt.tag = tag;
        existingPrompt.isPrivate = isPrivate;

        // NEW: Set expiresAt only when changing from private to public
        if (isNowPublic) {
            existingPrompt.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        await existingPrompt.save();

        return new Response(JSON.stringify(existingPrompt), { status: 200 });
    } catch (error) {
        return new Response("Error Updating Prompt", { status: 500 });
    }
};

export const DELETE = async (request, { params }) => {
    try {
        await connectToDB();

        // Find the prompt by ID and remove it
        await Prompt.findByIdAndRemove(params.id);

        return new Response("Prompt deleted successfully", { status: 200 });
    } catch (error) {
        return new Response("Error deleting prompt", { status: 500 });
    }
};
