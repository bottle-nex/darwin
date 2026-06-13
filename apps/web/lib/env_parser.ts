export default function parse_env(text: string): { key: string; value: string }[] {
    const out: { key: string; value: string }[] = [];
    for (const raw of text.split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const stripped = line.startsWith("export ") ? line.slice(7) : line;
        const eq = stripped.indexOf("=");
        if (eq === -1) continue;
        const key = stripped.slice(0, eq).trim();
        let value = stripped.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (key) out.push({ key, value });
    }
    return out;
}
