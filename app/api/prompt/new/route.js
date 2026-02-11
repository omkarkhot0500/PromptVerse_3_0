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

    // NEW: Set expiresAt for public prompts (24 hours from now)
    if (!isPrivate) {
      newPrompt.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await newPrompt.save();
    return new Response(JSON.stringify(newPrompt), { status: 201 });
  } catch (error) {
    return new Response("Failed to create a new prompt", { status: 500 });
  }
};
