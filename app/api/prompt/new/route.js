import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const POST = async (request) => {
  const { userId, prompt, tag, isPrivate } = await request.json();

  try {
    await connectToDB();
    const newPrompt = new Prompt({
      creator: userId,
      prompt,
      tag,
      isPrivate: isPrivate || false,
    });

    // Set expiresAt for public prompts (48 hours from now)
    if (!isPrivate) {
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      newPrompt.expiresAt = expiresAt;
      console.log(`Public prompt created - Expires at: ${expiresAt.toISOString()}`);
    } else {
      console.log("Private prompt created - No expiry");
    }

    const savedPrompt = await newPrompt.save();
    console.log(`Prompt saved successfully with ID: ${savedPrompt._id}`);

    return new Response(JSON.stringify(savedPrompt), { status: 201 });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return new Response("Failed to create a new prompt", { status: 500 });
  }
};
