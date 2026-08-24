import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CONTENT_TAG } from "@/lib/content";

export async function POST(request: Request) {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
        return NextResponse.json(
            { success: false, message: "REVALIDATE_SECRET is not configured" },
            { status: 503 },
        );
    }

    if (request.headers.get("x-revalidate-secret") !== secret) {
        return NextResponse.json({ success: false, message: "Not authorized" }, { status: 401 });
    }

    revalidateTag(CONTENT_TAG, { expire: 0 });

    return NextResponse.json({ success: true, revalidated: CONTENT_TAG });
}
