import { apiClient } from "./api";
import { SIGNED_UPLOAD_URL } from "@/routes/api_routes";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/avif";

export async function uploadImage(file: File): Promise<string> {
    const { data } = await apiClient.post(SIGNED_UPLOAD_URL, { contentType: file.type });
    const { uploadUrl, publicUrl } = data.data as { uploadUrl: string; publicUrl: string };

    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`upload failed with ${response.status}`);
    }

    return publicUrl;
}
