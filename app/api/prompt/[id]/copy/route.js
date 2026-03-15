import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const PATCH = async (request, { params }) => {
    try {
        await connectToDB();

        // Ensure id is awaited before use (Next.js requirement in recent versions)
        const id = params?.id;

        if (!id) {
            return new Response("Prompt ID is required", { status: 400 });
        }

        // Find the existing prompt
        const existingPrompt = await Prompt.findById(id);

        if (!existingPrompt) {
            return new Response("Prompt not found", { status: 404 });
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Add the new copy timestamp
        existingPrompt.recentCopyDates.push(now);

        // Clean up old timestamps (older than 7 days)
        existingPrompt.recentCopyDates = existingPrompt.recentCopyDates.filter(
            (date) => date > sevenDaysAgo
        );

        await existingPrompt.save();

        return new Response("Successfully updated the prompt copy count", { status: 200 });
    } catch (error) {
        console.error("Error updating prompt copy count:", error);
        return new Response("Error updating prompt copy count", { status: 500 });
    }
};
