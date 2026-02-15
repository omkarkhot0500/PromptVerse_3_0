import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";
import { getServerSession } from "next-auth/next";
import { handler as nextAuthHandler } from "../auth/[...nextauth]/route";

export const GET = async (request, { params }) => {
    try {
        await connectToDB()

        // Get the current user's session
        const session = await getServerSession(nextAuthHandler);
        const currentUserId = session?.user?.id;

        // If viewing own profile, show all prompts
        // If viewing another user's profile, show only public prompts
        const query = currentUserId === params.id
            ? { creator: params.id }
            : { creator: params.id, isPrivate: false };

        const prompts = await Prompt.find(query).populate("creator")

        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        return new Response("Failed to fetch prompts created by user", { status: 500 })
    }
}
