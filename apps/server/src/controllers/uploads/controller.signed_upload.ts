import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";
import StorageService from "../../services/service.storage";

const body_schema = z.object({
    contentType: z.string().min(1),
});

export default class SignedUploadController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "contentType required");
        }

        const { contentType } = parsed.data;

        if (!StorageService.is_configured()) {
            return ResponseWriter.custom(
                res,
                false,
                "STORAGE_NOT_CONFIGURED",
                "Image uploads are not configured on this server",
                503,
            );
        }

        if (!StorageService.is_allowed_type(contentType)) {
            return ResponseWriter.invalid_data(res, `Unsupported image type: ${contentType}`);
        }

        try {
            const signed = await StorageService.signed_upload_url(contentType, "uploads");
            return ResponseWriter.success(res, signed, "Upload URL created");
        } catch (err) {
            console.error("[uploads:signed-upload]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
