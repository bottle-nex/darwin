import { prisma } from "@trymatcha/database";

import PostContentService from "./service.post-content";

export default class PostSlugService {
    static async unique(desired: string, fallback: string, excludeId?: string): Promise<string> {
        const base =
            PostContentService.slugify(desired) || PostContentService.slugify(fallback) || "post";

        const existing = await prisma.post.findMany({
            where: { slug: { startsWith: base } },
            select: { id: true, slug: true },
        });

        const taken = new Set(
            existing.filter((row) => row.id !== excludeId).map((row) => row.slug),
        );

        if (!taken.has(base)) return base;

        for (let suffix = 2; suffix <= taken.size + 2; suffix++) {
            const candidate = `${base}-${suffix}`;
            if (!taken.has(candidate)) return candidate;
        }

        return `${base}-${Date.now()}`;
    }
}
