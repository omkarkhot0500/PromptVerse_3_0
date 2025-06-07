import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const GET = async (request) => {
  try {
    console.log("Starting to fetch prompts...");

    await connectToDB();
    console.log("Database connected successfully");

    // Multiple approaches - try them one by one

    // Approach 1: Simple query without population first
    const prompts = await Prompt.find({
      $or: [
        { isPrivate: { $exists: false } }, // Handle docs without isPrivate field
        { isPrivate: false }, // Explicitly public prompts
      ],
    })
      .populate({
        path: "creator",
        select: "username email image", // Only select needed fields
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Use lean() for better performance

    console.log(`Found ${prompts.length} prompts`);

    // Ensure all prompts have creator data
    const validPrompts = prompts.filter((prompt) => prompt.creator);
    console.log(`Valid prompts with creator: ${validPrompts.length}`);

    return new Response(JSON.stringify(validPrompts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // Prevent caching issues
      },
    });
  } catch (error) {
    console.error("Detailed error in /api/prompt:", error);

    // Fallback: Try without population
    try {
      await connectToDB();
      const simplePrompts = await Prompt.find({
        $or: [{ isPrivate: { $exists: false } }, { isPrivate: false }],
      }).lean();

      console.log(
        `Fallback: Found ${simplePrompts.length} prompts without population`
      );

      return new Response(JSON.stringify(simplePrompts), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch prompts",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }
};
