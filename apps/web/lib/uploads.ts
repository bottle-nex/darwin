import { SIGNED_UPLOAD_URL } from "@/routes/api_routes";

import { apiClient } from "./axios";

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
