import Prompt from "@models/prompt";
import { connectToDB, forceReconnect } from "@utils/database";

export const GET = async (request) => {
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
        try {
            console.log(`Attempt ${retryCount + 1} to fetch prompts`);
            
            // Connect to database
            await connectToDB();
            
            // Fetch prompts with a timeout
            const prompts = await Promise.race([
                Prompt.find({ isPrivate: false }).populate("creator"),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Query timeout')), 10000)
                )
            ]);
            
            console.log(`Successfully fetched ${prompts.length} prompts`);
            
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
                }
            });

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error.message);
            retryCount++;
            
            if (retryCount <= maxRetries) {
                console.log("Attempting to force reconnect...");
                try {
                    await forceReconnect();
                } catch (reconnectError) {
                    console.error("Force reconnect failed:", reconnectError);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } else {
                console.error("All retry attempts failed");
                return new Response(JSON.stringify({ 
                    error: "Failed to fetch prompts after multiple attempts", 
                    details: error.message 
                }), { 
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            }
        }
    }
};

// Force dynamic rendering - prevents static caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;