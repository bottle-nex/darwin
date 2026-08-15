import { prisma, type PostKind } from "@trymatcha/database";
import PostContentService from "./service.post-content";

export default class PostService {
    static async unique_slug(
        kind: PostKind,
        desired: string,
        fallback: string,
        excludeId?: string,
    ): Promise<string> {
        const base =
            PostContentService.slugify(desired) || PostContentService.slugify(fallback) || "post";

        const taken = await prisma.post.findMany({
            where: { kind, slug: { startsWith: base } },
            select: { id: true, slug: true },
        });

        const clashes = new Set(taken.filter((row) => row.id !== excludeId).map((row) => row.slug));

        if (!clashes.has(base)) return base;

        for (let suffix = 2; suffix <= clashes.size + 2; suffix++) {
            const candidate = `${base}-${suffix}`;
            if (!clashes.has(candidate)) return candidate;
        }

        return `${base}-${Date.now()}`;
    }
}
