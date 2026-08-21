import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { Client as MinioClient } from "minio";
import { ENV } from "../configs/env";

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;
const ARTIFACT_URL_TTL_MS = 15 * 60 * 1000;

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

    static is_product_diff_configured(): boolean {
        return Boolean(
            ENV.SERVER_MINIO_URL &&
            ENV.SERVER_MINIO_ACCESS_KEY &&
            ENV.SERVER_MINIO_SECRET_KEY &&
            ENV.SERVER_PRODUCT_DIFF_BUCKET,
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
        if (
            !ENV.SERVER_MINIO_URL ||
            !ENV.SERVER_MINIO_ACCESS_KEY ||
            !ENV.SERVER_MINIO_SECRET_KEY ||
            !ENV.SERVER_PRODUCT_DIFF_BUCKET
        ) {
            throw new Error("MinIO Product Diff storage is not configured");
        }
        if (!this.minioClient) {
            const endpoint = new URL(ENV.SERVER_MINIO_URL);
            this.minioClient = new MinioClient({
                endPoint: endpoint.hostname,
                port: Number(endpoint.port || (endpoint.protocol === "https:" ? 443 : 80)),
                useSSL: endpoint.protocol === "https:",
                accessKey: ENV.SERVER_MINIO_ACCESS_KEY,
                secretKey: ENV.SERVER_MINIO_SECRET_KEY,
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

    static async signed_product_diff_url(key: string): Promise<string> {
        return this.minio().presignedGetObject(
            ENV.SERVER_PRODUCT_DIFF_BUCKET!,
            key,
            SIGNED_URL_TTL_MS / 1000,
        );
    }

    /**
     * Signs several Product Diff screenshots in one request.
     *
     * A screenshot preview shows many images and the reader clicks between targets and screen sizes
     * for minutes at a time, so signing them one at a time would mean a round trip per image. The
     * longer window exists for the same reason: a link that expires while someone is still reading
     * the page is just a broken image.
     *
     * @example
     * await StorageService.signed_product_diff_urls(["product-diffs/p1/42/a-b/pd1/shots/nav/default/desktop/head.png"]);
     * // { "product-diffs/.../head.png": "https://minio.local/...?X-Amz-Signature=..." }
     */
    static async signed_product_diff_urls(keys: string[]): Promise<Record<string, string>> {
        const client = this.minio();
        const signed = await Promise.all(
            keys.map(async (key) => [
                key,
                await client.presignedGetObject(
                    ENV.SERVER_PRODUCT_DIFF_BUCKET!,
                    key,
                    ARTIFACT_URL_TTL_MS / 1000,
                ),
            ]),
        );
        return Object.fromEntries(signed);
    }
}
