import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { Prisma, prisma } from "@trymatcha/database";

import { ENV } from "../configs/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY = Buffer.from(ENV.SERVER_SECRET_ENCRYPTION_KEY, "hex");

type EncryptedPayload = {
    ciphertext: string;
    iv: string;
    authTag: string;
};

export default class SecretService {
    public static encrypt(plaintext: string): EncryptedPayload {
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, KEY, iv);

        const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return {
            ciphertext: ciphertext.toString("base64"),
            iv: iv.toString("base64"),
            authTag: authTag.toString("base64"),
        };
    }

    public static decrypt({ ciphertext, iv, authTag }: EncryptedPayload): string {
        const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, "base64"));
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(ciphertext, "base64")),
            decipher.final(),
        ]);

        return plaintext.toString("utf8");
    }

    static async set_secret(projectId: string, key: string, value: string) {
        const { ciphertext, iv, authTag } = this.encrypt(value);

        return prisma.projectSecret.upsert({
            where: { projectId_key: { projectId, key } },
            create: { projectId, key, ciphertext, iv, authTag },
            update: { ciphertext, iv, authTag },
        });
    }

    static async get_secret(projectId: string, key: string): Promise<string | null> {
        const row = await prisma.projectSecret.findUnique({
            where: { projectId_key: { projectId, key } },
        });

        if (!row) return null;
        return this.decrypt(row);
    }

    /**
     * Lists the secret *keys* for a project (with last-updated time) — never the
     * values. Backs the settings UI, which is write-only: members can see which
     * secrets exist and overwrite/delete them, but values are never sent to the
     * browser. Use {@link get_all_secrets} only for server-side runner injection.
     */
    static async list_secret_keys(projectId: string): Promise<{ key: string; updatedAt: Date }[]> {
        return prisma.projectSecret.findMany({
            where: { projectId },
            select: { key: true, updatedAt: true },
            orderBy: { key: "asc" },
        });
    }

    static async get_all_secrets(projectId: string): Promise<Record<string, string>> {
        const rows = await prisma.projectSecret.findMany({ where: { projectId } });

        return Object.fromEntries(rows.map((row) => [row.key, this.decrypt(row)]));
    }

    static async delete_secret(projectId: string, key: string) {
        try {
            await prisma.projectSecret.delete({
                where: { projectId_key: { projectId, key } },
            });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                return;
            }
            throw err;
        }
    }
}
