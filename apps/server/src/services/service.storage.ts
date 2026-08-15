import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { ENV } from "../configs/env";

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

const EXTENSIONS: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};

export default class StorageService {
    static client: Storage | null = null;

    static is_configured(): boolean {
        return Boolean(
            ENV.SERVER_GCS_PROJECT_ID &&
            ENV.SERVER_GCS_BUCKET &&
            ENV.SERVER_GCS_CLIENT_EMAIL &&
            ENV.SERVER_GCS_PRIVATE_KEY &&
            ENV.SERVER_GCS_PUBLIC_URL,
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
}
