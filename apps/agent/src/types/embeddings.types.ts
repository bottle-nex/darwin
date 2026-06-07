import type { Chunk } from "@trymatcha/types";

export interface CodeChunk {
    filePath: string;
    chunkText: string;
    chunkType: Chunk;
    startLine: number;
    endLine: number;
}

export interface EmbeddedChunk extends CodeChunk {
    embedding: number[];
}

export interface EmbeddingsJobData {
    projectId: string;
    repoUrl: string;
    branch: string;
    changedFiles?: string[];
}

export interface SearchResult {
    filePath: string;
    chunkText: string;
    chunkType: string;
    startLine: number;
    endLine: number;
    similarity: number;
}
