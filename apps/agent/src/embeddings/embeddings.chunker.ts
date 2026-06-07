import { Chunk } from "@trymatcha/types";
import type { CodeChunk } from "../types/embeddings.types";

export default class Chunker {
    private SKIP_DIRS = new Set([
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        "coverage",
        "generated",
        ".turbo",
        "out",
        ".cache",
    ]);

    private SKIP_EXTENSIONS = new Set([
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".svg",
        ".ico",
        ".webp",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
        ".mp4",
        ".mp3",
        ".pdf",
        ".zip",
        ".tar",
        ".gz",
        ".lock",
        ".bin",
        ".node",
    ]);

    private TS_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

    private MAX_CHUNK_LINES = 120;
    private OVERLAP_LINES = 15;

    private TOP_LEVEL: Array<{ pattern: RegExp; type: Chunk }> = [
        { pattern: /^import\s/, type: Chunk.Imports },
        { pattern: /^export\s+(default\s+)?(async\s+)?function\s/, type: Chunk.Function },
        { pattern: /^(async\s+)?function\s+\w+/, type: Chunk.Function },
        { pattern: /^export\s+(default\s+)?class\s/, type: Chunk.Class },
        { pattern: /^class\s+\w+/, type: Chunk.Class },
        { pattern: /^export\s+(default\s+)?interface\s/, type: Chunk.Interface },
        { pattern: /^interface\s+\w+/, type: Chunk.Interface },
        { pattern: /^export\s+(default\s+)?type\s+\w+/, type: Chunk.Type },
        { pattern: /^type\s+\w+\s*=/, type: Chunk.Type },
        { pattern: /^export\s+(const|let|var)\s/, type: Chunk.Variable },
        { pattern: /^(const|let|var)\s+\w+/, type: Chunk.Variable },
    ];

    public is_indexable(file_path: string): boolean {
        const parts = file_path.split("/");
        if (parts.some((p) => this.SKIP_DIRS.has(p))) return false;
        const ext = "." + file_path.split(".").pop();
        return !this.SKIP_EXTENSIONS.has(ext);
    }

    public chunk_file(content: string, file_path: string): CodeChunk[] {
        const ext = "." + file_path.split(".").pop();
        const lines = content.split("\n");
        return this.TS_EXTENSIONS.has(ext)
            ? this.chunk_ts(lines, file_path)
            : this.chunk_generic(lines, file_path);
    }

    private chunk_ts(lines: string[], file_path: string): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const split_points: Array<{ line: number; type: Chunk }> = [
            { line: 0, type: Chunk.Block },
        ];

        let in_imports = false;
        let last_import_line = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? "";
            const match = this.TOP_LEVEL.find((t) => t.pattern.test(line));
            if (!match) continue;

            if (match.type === Chunk.Imports) {
                if (!in_imports) {
                    in_imports = true;
                    split_points.push({ line: i, type: Chunk.Imports });
                }
                last_import_line = i;
            } else {
                if (in_imports) {
                    in_imports = false;
                    split_points.push({ line: last_import_line + 1, type: match.type });
                } else {
                    split_points.push({ line: i, type: match.type });
                }
            }
        }

        split_points.push({ line: lines.length, type: Chunk.Block });

        const seen = new Set<number>();
        const deduped: Array<{ line: number; type: Chunk }> = [];
        for (const point of split_points) {
            if (seen.has(point.line)) continue;
            seen.add(point.line);
            deduped.push(point);
        }
        deduped.sort((a, b) => a.line - b.line);

        for (let i = 0; i < deduped.length - 1; i++) {
            const start = deduped[i]!.line;
            const end = deduped[i + 1]!.line;
            if (end - start < 3) continue;

            const text = lines.slice(start, end).join("\n").trim();
            if (!text) continue;

            chunks.push({
                filePath: file_path,
                chunkText: `// File: ${file_path}\n${text}`,
                chunkType: deduped[i]!.type,
                startLine: start + 1,
                endLine: end,
            });
        }

        return chunks;
    }

    private chunk_generic(lines: string[], file_path: string): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        let i = 0;

        while (i < lines.length) {
            const start = chunks.length > 0 ? Math.max(0, i - this.OVERLAP_LINES) : i;
            const end = Math.min(lines.length, i + this.MAX_CHUNK_LINES);
            const text = lines.slice(start, end).join("\n").trim();

            if (text) {
                chunks.push({
                    filePath: file_path,
                    chunkText: `// File: ${file_path}\n${text}`,
                    chunkType: Chunk.Block,
                    startLine: start + 1,
                    endLine: end,
                });
            }
            i = end;
        }

        return chunks;
    }
}
