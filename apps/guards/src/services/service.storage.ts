import { Client as MinioClient } from "minio";

import { ENV } from "../config/config.env";

let client: MinioClient | null = null;

export default class StorageService {
    static is_run_logs_configured(): boolean {
        return Boolean(
            ENV.MINIO_URL && ENV.MINIO_ACCESS_KEY && ENV.MINIO_SECRET_KEY && ENV.RUN_LOGS_BUCKET,
        );
    }

    static minio(): MinioClient {
        if (!ENV.MINIO_URL || !ENV.MINIO_ACCESS_KEY || !ENV.MINIO_SECRET_KEY) {
            throw new Error("MinIO storage is not configured");
        }
        if (!client) {
            const endpoint = new URL(ENV.MINIO_URL);
            client = new MinioClient({
                endPoint: endpoint.hostname,
                port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
                useSSL: endpoint.protocol === "https:",
                accessKey: ENV.MINIO_ACCESS_KEY,
                secretKey: ENV.MINIO_SECRET_KEY,
            });
        }
        return client;
    }

    static async put_run_log_segment(key: string, body: Buffer): Promise<void> {
        await this.minio().putObject(ENV.RUN_LOGS_BUCKET!, key, body, body.length, {
            "Content-Type": "application/x-ndjson",
            "Content-Encoding": "gzip",
        });
    }

    static async list_run_log_segments(prefix: string): Promise<string[]> {
        const keys: string[] = [];
        const stream = this.minio().listObjectsV2(ENV.RUN_LOGS_BUCKET!, prefix, true);
        for await (const item of stream) {
            if (item.name) keys.push(item.name);
        }
        return keys.sort();
    }

    static async read_run_log_segment(key: string): Promise<Buffer> {
        const chunks: Buffer[] = [];
        for await (const chunk of await this.minio().getObject(ENV.RUN_LOGS_BUCKET!, key)) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }

    static async remove_run_log_segments(keys: string[]): Promise<void> {
        if (!keys.length) return;
        await this.minio().removeObjects(ENV.RUN_LOGS_BUCKET!, keys);
    }
}
