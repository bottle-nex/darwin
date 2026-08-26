import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
};

export function content_type(path: string): string {
    return CONTENT_TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
}

export function resolve_within(root: string, url_path: string): string | null {
    const decoded = decodeURIComponent(url_path.split("?")[0] ?? "/");
    const target = resolve(join(root, normalize(decoded)));
    const boundary = resolve(root) + sep;
    return target === resolve(root) || target.startsWith(boundary) ? target : null;
}

export interface StaticSite {
    origin: string;
    close: () => Promise<void>;
}

export async function serve_directory(root: string): Promise<StaticSite> {
    const server: Server = createServer(async (request, response) => {
        const target = resolve_within(root, request.url ?? "/");
        if (!target) {
            response.writeHead(403).end();
            return;
        }

        try {
            const info = await stat(target);
            const file = info.isDirectory() ? join(target, "index.html") : target;
            const size = info.isDirectory() ? (await stat(file)).size : info.size;
            response.writeHead(200, {
                "content-type": content_type(file),
                "content-length": size,
            });
            createReadStream(file).pipe(response);
        } catch {
            response.writeHead(404).end();
        }
    });

    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    if (typeof address === "string" || address === null) {
        throw new Error("static server did not bind to a port");
    }

    return {
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
    };
}
