import { randomUUID } from "node:crypto";

import { Storage } from "@google-cloud/storage";
import { Client as MinioClient } from "minio";

import { ENV } from "../configs/env";

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;
const ARTIFACT_URL_TTL_MS = 15 * 60 * 1000;
const RUN_LOG_ARCHIVE_MAX_BYTES = 64 * 1024 * 1024;
const SAFE_PRODUCT_DIFF_CONTENT_TYPE =
    /^(application\/(javascript|json|manifest\+json|octet-stream|wasm)|font\/(otf|ttf|woff|woff2)|image\/(avif|gif|jpeg|png|svg\+xml|webp|x-icon)|text\/(css|html|plain))$/;

const EXTENSIONS: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};

export default class StorageService {
    static client: Storage | null = null;
    static minioClient: MinioClient | null = null;

    static is_configured(): boolean {
        return Boolean(
            ENV.SERVER_GCS_PROJECT_ID &&
            ENV.SERVER_GCS_BUCKET &&
            ENV.SERVER_GCS_CLIENT_EMAIL &&
            ENV.SERVER_GCS_PRIVATE_KEY &&
            ENV.SERVER_GCS_PUBLIC_URL,
        );
    }

    static is_run_logs_configured(): boolean {
        return Boolean(
            ENV.MINIO_URL && ENV.MINIO_ACCESS_KEY && ENV.MINIO_SECRET_KEY && ENV.RUN_LOGS_BUCKET,
        );
    }

    static is_product_diff_configured(): boolean {
        return Boolean(
            ENV.MINIO_URL &&
            ENV.MINIO_ACCESS_KEY &&
            ENV.MINIO_SECRET_KEY &&
            ENV.PRODUCT_DIFF_BUCKET,
        );
    }

    static is_allowed_type(contentType: string): boolean {
        return contentType in EXTENSIONS;
    }

    static storage(): Storage {
        if (!this.client) {
            this.client = new Storage({
                projectId: ENV.SERVER_GCS_PROJECT_ID,
                credentials: {
                    client_email: ENV.SERVER_GCS_CLIENT_EMAIL,
                    private_key: Buffer.from(ENV.SERVER_GCS_PRIVATE_KEY ?? "", "base64").toString(
                        "utf-8",
                    ),
                },
            });
        }
        return this.client;
    }

    static minio(): MinioClient {
        if (!ENV.MINIO_URL || !ENV.MINIO_ACCESS_KEY || !ENV.MINIO_SECRET_KEY) {
            throw new Error("MinIO storage is not configured");
        }
        if (!this.minioClient) {
            const endpoint = new URL(ENV.MINIO_URL);
            this.minioClient = new MinioClient({
                endPoint: endpoint.hostname,
                port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
                useSSL: endpoint.protocol === "https:",
                accessKey: ENV.MINIO_ACCESS_KEY,
                secretKey: ENV.MINIO_SECRET_KEY,
            });
        }
        return this.minioClient;
    }

    static async signed_upload_url(contentType: string) {
        const extension = EXTENSIONS[contentType];
        if (!extension) {
            throw new Error(`unsupported content type: ${contentType}`);
        }

        const key = `posts/${randomUUID()}.${extension}`;
        const [uploadUrl] = await this.storage()
            .bucket(ENV.SERVER_GCS_BUCKET!)
            .file(key)
            .getSignedUrl({
                version: "v4",
                action: "write",
                expires: Date.now() + SIGNED_URL_TTL_MS,
                contentType,
            });

        return {
            uploadUrl,
            publicUrl: `${ENV.SERVER_GCS_PUBLIC_URL!.replace(/\/+$/, "")}/${key}`,
        };
    }

    static async list_run_log_segments(prefix: string): Promise<string[]> {
        const keys: string[] = [];
        const stream = this.minio().listObjectsV2(ENV.RUN_LOGS_BUCKET!, prefix, true);
        for await (const item of stream) {
            if (item.name) keys.push(item.name);
        }
        return keys.sort();
    }

    /**
     * Concatenates a run's segments into one body.
     *
     * Safe to join without re-compressing: gzip is defined over concatenated members, so the
     * joined bytes stay a valid archive that any reader — the browser's download, or gunzip on
     * the read path — decodes as the whole run in sequence order.
     */
    static async read_run_log_archive(prefix: string): Promise<Buffer> {
        const keys = await this.list_run_log_segments(prefix);
        const segments: Buffer[] = [];
        let bytes = 0;

        for (const key of keys) {
            const segment = await this.read_run_log(key);
            bytes += segment.length;
            if (bytes > RUN_LOG_ARCHIVE_MAX_BYTES) {
                throw new Error("Run log archive exceeds the read limit");
            }
            segments.push(segment);
        }

        return Buffer.concat(segments, bytes);
    }

    static async read_run_log(key: string): Promise<Buffer> {
        const bucket = ENV.RUN_LOGS_BUCKET!;
        const stat = await this.minio().statObject(bucket, key);
        if (stat.size > RUN_LOG_ARCHIVE_MAX_BYTES) {
            throw new Error("Run log archive exceeds the read limit");
        }

        const chunks: Buffer[] = [];
        for await (const chunk of await this.minio().getObject(bucket, key)) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }

    static async signed_run_log_url(key: string): Promise<string> {
        return this.minio().presignedGetObject(
            ENV.RUN_LOGS_BUCKET!,
            key,
            ARTIFACT_URL_TTL_MS / 1000,
        );
    }

    static async signed_product_diff_url(key: string): Promise<string> {
        return this.minio().presignedGetObject(
            ENV.PRODUCT_DIFF_BUCKET!,
            key,
            SIGNED_URL_TTL_MS / 1000,
        );
    }

    /**
     * Signs the pages of a Product Diff capsule in one request.
     *
     * A capsule has a before and an after page and the reader moves between components for minutes
     * at a time, so signing one at a time would mean a round trip per pane. The longer window
     * exists for the same reason: a link that expires while someone is still reviewing turns a
     * working preview into a blank frame.
     *
     * @example
     * await StorageService.signed_product_diff_urls(["product-diff/pd1/head/faq-item/index.html"]);
     * // { "product-diff/pd1/head/faq-item/index.html": "https://minio.local/...?X-Amz-Signature=..." }
     */
    static async signed_product_diff_urls(keys: string[]): Promise<Record<string, string>> {
        const client = this.minio();
        const signed = await Promise.all(
            keys.map(async (key) => [
                key,
                await client.presignedGetObject(
                    ENV.PRODUCT_DIFF_BUCKET!,
                    key,
                    ARTIFACT_URL_TTL_MS / 1000,
                ),
            ]),
        );
        return Object.fromEntries(signed);
    }

    static async read_product_diff_object(key: string, maximum_bytes: number): Promise<Buffer> {
        const object = await this.stream_product_diff_object(key);
        if (object.size > maximum_bytes) {
            object.body.destroy();
            throw new Error("Product Diff object exceeds the read limit");
        }

        const chunks: Buffer[] = [];
        let bytes = 0;
        for await (const chunk of object.body) {
            const body = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            bytes += body.length;
            if (bytes > maximum_bytes) {
                object.body.destroy();
                throw new Error("Product Diff object exceeds the read limit");
            }
            chunks.push(body);
        }
        if (bytes !== object.size) {
            throw new Error("Product Diff object size changed during read");
        }
        return Buffer.concat(chunks, bytes);
    }

    static async stream_product_diff_object(key: string) {
        const client = this.minio();
        const bucket = ENV.PRODUCT_DIFF_BUCKET!;
        const stat = await client.statObject(bucket, key);
        const metadata = Object.fromEntries(
            Object.entries(stat.metaData).map(([name, value]) => [
                name.toLowerCase(),
                typeof value === "string" ? value : "",
            ]),
        );
        const stored_content_type = metadata["content-type"]?.toLowerCase().split(";", 1)[0];
        const contentType =
            stored_content_type && SAFE_PRODUCT_DIFF_CONTENT_TYPE.test(stored_content_type)
                ? stored_content_type
                : "application/octet-stream";

        return {
            body: await client.getObject(bucket, key),
            size: stat.size,
            contentType,
        };
    }
}
