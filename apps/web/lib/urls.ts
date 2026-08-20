const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"])/gi;

export function urlSplitPattern() {
    return new RegExp(URL_PATTERN.source, "i");
}

export function isUrl(value: string) {
    return new RegExp(`^${URL_PATTERN.source}$`, "i").test(value.trim());
}

export function withProtocol(value: string) {
    const trimmed = value.trim();
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
