import { api } from "./api";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/avif";

/**
 * The PUT goes straight to GCS with a bare fetch, deliberately not the api client —
 * sending our Authorization header to Google would invalidate the signature.
 */
export async function upload_image(file: File): Promise<string> {
    const { data } = await api.post("/admin/uploads/signed-url", { contentType: file.type });
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
