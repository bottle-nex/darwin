import { createDecipheriv } from "node:crypto";
import { prisma } from "@trymatcha/database";
import { ENV } from "../conf/config.env";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(ENV.SERVER_SECRET_ENCRYPTION_KEY, "hex");

type EncryptedPayload = {
    ciphertext: string;
    iv: string;
    authTag: string;
};

/**
 * Read side of project secrets. The worker only ever decrypts them to write the
 * sandbox `.env`; writing/listing/deleting stays in the server.
 */
export default class SecretService {
    public static decrypt({ ciphertext, iv, authTag }: EncryptedPayload): string {
        const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, "base64"));
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(ciphertext, "base64")),
            decipher.final(),
        ]);

        return plaintext.toString("utf8");
    }

    static async get_all_secrets(projectId: string): Promise<Record<string, string>> {
        const rows = await prisma.projectSecret.findMany({ where: { projectId } });

        return Object.fromEntries(rows.map((row) => [row.key, this.decrypt(row)]));
    }
}
