import Prompt from "@models/prompt";
import { connectToDB } from "@utils/database";

export const GET = async (request) => {
    const { searchParams } = new URL(request.url);
    const searchText = searchParams.get("search");

    try {
        await connectToDB();

        const now = new Date();
        let pipeline = [];

        // 1. If we have a search query, use Atlas Search (MUST be first stage)
        if (searchText) {
            pipeline.push({
                $search: {
                    index: "promptsearch", // Matches correctly!
                    compound: {
                        should: [
                            {
                                text: {
                                    query: searchText,
                                    path: ["prompt", "tag"],
                                    fuzzy: { maxEdits: 1 }
                                }
                            }
                        ]
                    }
                }
            });
        }

        // 2. Filter for active public prompts
        pipeline.push({
            $match: {
                isPrivate: false,
                $or: [
                    { expiresAt: { $eq: null } },
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: now } },
                ]
            }
        });

        // 3. Populate creator info (Lookup users since we are in aggregation)
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "creator",
                foreignField: "_id",
                as: "creator"
            }
        });
        pipeline.push({ $unwind: "$creator" });

        // 4. Sort results
        if (searchText) {
            // Sort by relevance score if searching
            pipeline.push({ $sort: { score: { $meta: "textScore" }, createdAt: -1 } });
        } else {
            // Newest first if listing everything
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        const prompts = await Prompt.aggregate(pipeline);

        return new Response(JSON.stringify(prompts), { status: 200 })
    } catch (error) {
        console.error("Error fetching prompts:", error);
        return new Response("Failed to fetch prompts", { status: 500 });
    }
}
