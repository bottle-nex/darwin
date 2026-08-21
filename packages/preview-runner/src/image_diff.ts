import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { compare } from "odiff-bin";
import { PNG } from "pngjs";

export type DiffOutcome =
    | { changed: false; diffPercentage: 0 }
    | { changed: true; diffPercentage: number }
    | { error: string };

function pad_to(source: PNG, width: number, height: number): PNG {
    if (source.width === width && source.height === height) return source;

    const canvas = new PNG({ width, height });
    canvas.data.fill(0xff);
    PNG.bitblt(source, canvas, 0, 0, source.width, source.height, 0, 0);
    return canvas;
}

/**
 * Compares two screenshots and writes a picture of what moved.
 *
 * Both images are first placed on a white canvas the size of the larger one. Without that step a
 * component that simply grew taller reports as an unusable "layout difference" instead of the
 * ordinary pixel difference it really is — and that is the most common change a pull request makes.
 *
 * @example
 * await diff_png("base.png", "head.png", "diff.png", 0.1);
 * // { changed: true, diffPercentage: 3.41 }
 */
export async function diff_png(
    basePath: string,
    headPath: string,
    diffPath: string,
    threshold: number,
): Promise<DiffOutcome> {
    try {
        const base = PNG.sync.read(readFileSync(basePath));
        const head = PNG.sync.read(readFileSync(headPath));
        const width = Math.max(base.width, head.width);
        const height = Math.max(base.height, head.height);

        const paddedBasePath = `${basePath}.padded.png`;
        const paddedHeadPath = `${headPath}.padded.png`;
        writeFileSync(paddedBasePath, PNG.sync.write(pad_to(base, width, height)));
        writeFileSync(paddedHeadPath, PNG.sync.write(pad_to(head, width, height)));

        const result = await compare(paddedBasePath, paddedHeadPath, diffPath, {
            threshold,
            antialiasing: true,
            diffColor: "#cd2cc9",
        });

        rmSync(paddedBasePath, { force: true });
        rmSync(paddedHeadPath, { force: true });

        if (result.match) return { changed: false, diffPercentage: 0 };
        if (result.reason === "pixel-diff") {
            return { changed: true, diffPercentage: Number(result.diffPercentage.toFixed(2)) };
        }
        return { error: `image comparison failed: ${result.reason}` };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}
