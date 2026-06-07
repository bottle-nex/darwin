import chalk from "chalk";
import { InputType } from "./embeddings.voyage";
import { chunker, store, voyage } from "../services/init";
import type { CodeChunk, EmbeddingsJobData } from "../types/embeddings.types";

export default class EmbeddingsMaker {
    private TEMP_DIR = "/tmp/matcha-embeddings";
    private BATCH_SIZE = 64;

    public async make_embeddings(job: EmbeddingsJobData) {
        const clone_dir = `${this.TEMP_DIR}/${job.projectId}`;

        try {
            await Bun.$`mkdir -p ${this.TEMP_DIR}`.quiet();
            await Bun.$`rm -rf ${clone_dir}`.quiet();
            await Bun.$`git clone --depth 1 --branch ${job.branch} ${job.repoUrl} ${clone_dir}`.quiet();

            // changedFiles set = incremental re-index; otherwise index the whole repo.
            const files = (job.changedFiles ?? (await this.walk_files(clone_dir))).filter((f) =>
                chunker.is_indexable(f),
            );

            // 1. Chunk every file into one flat list.
            const all_chunks: CodeChunk[] = [];
            for (const relative_path of files) {
                const content = await Bun.file(`${clone_dir}/${relative_path}`)
                    .text()
                    .catch(() => null);
                if (!content) continue;
                all_chunks.push(...chunker.chunk_file(content, relative_path));
            }

            // 2. Replace: wipe old chunks for every touched file (handles edits + deletes).
            for (const relative_path of files) {
                await store.delete_file_chunks(job.projectId, relative_path);
            }

            // 3. Embed in full batches across files, then store.
            for (let i = 0; i < all_chunks.length; i += this.BATCH_SIZE) {
                const batch = all_chunks.slice(i, i + this.BATCH_SIZE);
                const vectors = await voyage.embed_batch(
                    batch.map((c) => c.chunkText),
                    InputType.Document,
                );

                if (vectors.length !== batch.length) {
                    console.log(chalk.red(`Embedding count mismatch, skipping batch at ${i}`));
                    continue;
                }

                for (let j = 0; j < batch.length; j++) {
                    await store.upsert_chunk(job.projectId, {
                        ...batch[j]!,
                        embedding: vectors[j]!,
                    });
                }
            }

            console.log(
                chalk.green(
                    `[embeddings] project ${job.projectId}: ${files.length} files -> ${all_chunks.length} chunks`,
                ),
            );
        } catch (err) {
            console.log(chalk.red("Make embeddings error: "), err);
        } finally {
            await Bun.$`rm -rf ${clone_dir}`.quiet();
        }
    }

    private async walk_files(dir: string): Promise<string[]> {
        const paths: string[] = [];
        const glob = new Bun.Glob("**/*");
        for await (const f of glob.scan({ cwd: dir, onlyFiles: true })) {
            paths.push(f);
        }
        return paths;
    }
}
