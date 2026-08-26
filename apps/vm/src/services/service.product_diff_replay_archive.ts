import { posix } from "node:path";

import {
    PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN,
    type ProductDiffManifestV4,
    replayArtifactKeys,
} from "@trymatcha/types";

function shell_argument(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function build_replay_archive_command(
    replayDir: string,
    archivePath: string,
    manifest: ProductDiffManifestV4,
): string {
    const artifactDirectories = [
        ...new Set(
            [...replayArtifactKeys(manifest)].map((artifactKey) => {
                if (!PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN.test(artifactKey)) {
                    throw new Error("V4 manifest contains an invalid replay artifact key");
                }
                return posix.dirname(artifactKey.slice("replay/".length));
            }),
        ),
    ].sort();
    if (artifactDirectories.length === 0) {
        throw new Error("V4 manifest contains no publishable replay artifacts");
    }
    return `tar --format=ustar -czf ${shell_argument(archivePath)} -C ${shell_argument(replayDir)} -- ${artifactDirectories.map(shell_argument).join(" ")}`;
}
