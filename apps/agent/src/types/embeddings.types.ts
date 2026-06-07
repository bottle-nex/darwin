
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
