import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const GET = async (request) => {
    try {
        await connectToDB();
        
        // Use the same pattern as your working API
        const prompts = await Prompt.find({ isPrivate: false }).populate("creator");
        
        // Add validation like your working API
        if (!prompts) {
            return new Response("No prompts found", { status: 404 });
        }

        return new Response(JSON.stringify(prompts), { status: 200 });

    } catch (error) {
        console.error("Error fetching prompts:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};