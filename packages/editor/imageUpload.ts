import { type Editor, Extension } from "@tiptap/core";

export type ImageUploader = (file: File) => Promise<string>;

interface ImageUploadOptions {
    upload: ImageUploader | null;
}

interface ImageUploadStorage {
    upload: ImageUploader | null;
}

declare module "@tiptap/core" {
    interface Storage {
        imageUpload: ImageUploadStorage;
    }
}

/**
 * Where an image goes when it is inserted. Without an uploader the file is
 * inlined as a data URL, which suits an issue description but not a post: the
 * post sanitizer allows only http and https, so a data URL is dropped on save.
 */
export const ImageUpload = Extension.create<ImageUploadOptions, ImageUploadStorage>({
    name: "imageUpload",
    addOptions() {
        return { upload: null };
    },
    addStorage() {
        return { upload: this.options.upload };
    },
});

export function imageUploader(editor: Editor): ImageUploader | null {
    return editor.storage.imageUpload?.upload ?? null;
}
