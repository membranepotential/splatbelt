import { runJob } from "$lib/server/worker";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = (async ({ request, params }) => {
    const config = await request.text();
    runJob("analyse", params.id as string, config);
    return new Response("Ok")
})