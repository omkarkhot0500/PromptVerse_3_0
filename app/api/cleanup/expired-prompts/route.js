import { connectToDB } from '@utils/database';
import Prompt from '@models/prompt';

export const GET = async (request) => {
  // Security: Verify request is from authorized source
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CLEANUP_SECRET;

  if (!authHeader || !expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectToDB();

    // Find and delete all expired public prompts
    const result = await Prompt.deleteMany({
      isPrivate: false,
      expiresAt: { $lt: new Date() }
    });

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
};
