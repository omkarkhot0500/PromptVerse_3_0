import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const GET = async (request) => {
    try {
        await connectToDB();
        
        const prompts = await Prompt.find({ isPrivate: false }).populate("creator");
        
        if (!prompts) {
            return new Response("No prompts found", { status: 404 });
        }

        return new Response(JSON.stringify(prompts), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        });

    } catch (error) {
        console.error("Error fetching prompts:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};

// Force dynamic rendering - prevents static caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;