import { prisma } from "@trymatcha/database";
import type { EmbeddedChunk, SearchResult } from "../types/embeddings.types";

export default class Store {
    public to_vector(embedding: number[]): string {
        return `[${embedding.join(",")}]`;
    }

    public async delete_file_chunks(project_id: string, file_path: string) {
        await prisma.$executeRaw`
            DELETE FROM code_embeddings
            WHERE "projectId" = ${project_id} AND "filePath" = ${file_path}
        `;
    }

    public async upsert_chunk(project_id: string, chunk: EmbeddedChunk) {
        const id = `${project_id}:${chunk.filePath}:${chunk.startLine}`;
        const vec = this.to_vector(chunk.embedding);

        await prisma.$executeRaw`
            INSERT INTO code_embeddings
                (id, "projectId", "filePath", "chunkText", "chunkType",
                "startLine", "endLine", embedding, "updatedAt")
            VALUES
                (${id}, ${project_id}, ${chunk.filePath}, ${chunk.chunkText}, ${chunk.chunkType}::"Chunk",
                ${chunk.startLine}, ${chunk.endLine}, ${vec}::vector, NOW())
            ON CONFLICT (id) DO UPDATE SET
                "chunkText" = EXCLUDED."chunkText",
                "chunkType" = EXCLUDED."chunkType",
                "endLine"   = EXCLUDED."endLine",
                embedding   = EXCLUDED.embedding,
                "updatedAt" = NOW()
        `;
    }

    public async search_chunks(project_id: string, query_embedding: number[], top_k = 10) {
        const vec = this.to_vector(query_embedding);

        return prisma.$queryRaw<SearchResult[]>`
            SELECT "filePath", "chunkText", "chunkType", "startLine", "endLine",
                1 - (embedding <=> ${vec}::vector) AS similarity
            FROM code_embeddings
            WHERE "projectId" = ${project_id}
            ORDER BY embedding <=> ${vec}::vector
            LIMIT ${top_k}
        `;
    }
}
