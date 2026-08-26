const REPLAY_RESOURCE_PREFIX = "/__matcha_replay_resource";
const REWRITABLE_CONTENT_TYPES = new Set([
    "application/javascript",
    "application/json",
    "application/ld+json",
    "application/manifest+json",
    "application/xhtml+xml",
    "application/xml",
    "image/svg+xml",
    "text/css",
    "text/html",
    "text/javascript",
    "text/plain",
    "text/xml",
]);

function normalized_content_type(value: string): string {
    return value.toLowerCase().split(";", 1)[0]?.trim() ?? "";
}

function origin_token(origin: string): string {
    return Buffer.from(origin, "utf8").toString("base64url");
}

function decoded_origin(token: string): string | null {
    if (!/^[A-Za-z0-9_-]{1,500}$/.test(token)) return null;
    try {
        const origin = Buffer.from(token, "base64url").toString("utf8");
        const url = new URL(origin);
        return url.origin === origin && ["http:", "https:"].includes(url.protocol) ? origin : null;
    } catch {
        return null;
    }
}

function replay_runtime_bootstrap(origins: string[]): string {
    const deliveryOrigins = Object.fromEntries(
        origins.map((origin) => [origin, replay_delivery_origin_path(origin)]),
    );
    const serializedOrigins = JSON.stringify(deliveryOrigins).replaceAll("<", "\\u003c");
    return `<script>(()=>{const origins=${serializedOrigins};const blocked="/__matcha_replay_blocked";const rewrite=(value)=>{try{const url=new URL(String(value),document.baseURI);if(!["http:","https:","ws:","wss:"].includes(url.protocol))return String(value);const mapped=origins[url.origin];if(mapped)return mapped+url.pathname+url.search+url.hash;if(url.origin===location.origin)return String(value);return blocked}catch{return blocked}};const originalFetch=window.fetch.bind(window);window.fetch=(input,init)=>{const request=input instanceof Request?new Request(rewrite(input.url),input):new Request(rewrite(input),init);return originalFetch(new Request(request,{credentials:"same-origin"}))};const originalOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...rest){return originalOpen.call(this,method,rewrite(url),...rest)};const originalSetAttribute=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){const normalized=String(name).toLowerCase();return originalSetAttribute.call(this,name,["src","href","poster","data","action"].includes(normalized)?rewrite(value):value)};for(const [constructor,name] of [[HTMLImageElement,"src"],[HTMLScriptElement,"src"],[HTMLLinkElement,"href"],[HTMLSourceElement,"src"],[HTMLMediaElement,"src"]]){const descriptor=Object.getOwnPropertyDescriptor(constructor.prototype,name);if(descriptor?.get&&descriptor.set)Object.defineProperty(constructor.prototype,name,{configurable:descriptor.configurable,enumerable:descriptor.enumerable,get:descriptor.get,set(value){descriptor.set.call(this,rewrite(value))}})}if(window.Worker){const OriginalWorker=window.Worker;window.Worker=class extends OriginalWorker{constructor(url,options){super(rewrite(url),options)}}}const originalWindowOpen=window.open.bind(window);window.open=(url,...rest)=>originalWindowOpen(url?rewrite(url):url,...rest);document.addEventListener("click",event=>{const target=event.target instanceof Element?event.target.closest("a[href]"):null;if(target)target.href=rewrite(target.href)},true)})();</script>`;
}

function inject_replay_runtime(documentBody: string, origins: string[]): string {
    const bootstrap = replay_runtime_bootstrap(origins);
    const head = /<head(?:\s[^>]*)?>/i.exec(documentBody);
    if (!head || head.index === undefined) return `${bootstrap}${documentBody}`;
    const insertion = head.index + head[0].length;
    return `${documentBody.slice(0, insertion)}${bootstrap}${documentBody.slice(insertion)}`;
}

export function replay_delivery_origin_path(origin: string): string {
    const normalized = new URL(origin).origin;
    return `${REPLAY_RESOURCE_PREFIX}/${origin_token(normalized)}`;
}

export function replay_delivery_path(value: string): string {
    const url = new URL(value);
    return `${replay_delivery_origin_path(url.origin)}${url.pathname}${url.search}`;
}

export function replay_original_url(pathWithQuery: string): string | null {
    const value = new URL(pathWithQuery, "http://replay.internal");
    const segments = value.pathname.split("/");
    if (`/${segments[1]}` !== REPLAY_RESOURCE_PREFIX || !segments[2]) return null;
    const origin = decoded_origin(segments[2]);
    if (!origin) return null;
    const originalPath = `/${segments.slice(3).join("/")}`;
    return new URL(`${originalPath}${value.search}`, origin).toString();
}

export function rewrite_replay_delivery_body(
    body: Buffer,
    contentType: string,
    resourceUrls: string[],
): Buffer {
    if (!replay_body_requires_rewrite(contentType)) return body;
    const origins = [...new Set(resourceUrls.map((value) => new URL(value).origin))].sort(
        (left, right) => right.length - left.length,
    );
    let rewritten = body.toString("utf8");
    for (const origin of origins) {
        const deliveryOrigin = replay_delivery_origin_path(origin);
        const hostReference = `//${new URL(origin).host}`;
        rewritten = rewritten.replaceAll(origin, deliveryOrigin);
        rewritten = rewritten.replaceAll(
            origin.replaceAll("/", "\\/"),
            deliveryOrigin.replaceAll("/", "\\/"),
        );
        rewritten = rewritten.replaceAll(hostReference, deliveryOrigin);
        rewritten = rewritten.replaceAll(
            hostReference.replaceAll("/", "\\/"),
            deliveryOrigin.replaceAll("/", "\\/"),
        );
    }
    if (normalized_content_type(contentType) === "text/html") {
        rewritten = rewritten.replace(/\s+integrity=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
        rewritten = inject_replay_runtime(rewritten, origins);
    }
    return Buffer.from(rewritten, "utf8");
}

export function replay_body_requires_rewrite(contentType: string): boolean {
    return REWRITABLE_CONTENT_TYPES.has(normalized_content_type(contentType));
}

export function replay_content_security_policy(frameOrigin: string): string {
    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "media-src 'self' data: blob:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-src 'self'",
        `frame-ancestors 'self' ${frameOrigin}`,
    ].join("; ");
}

export function replay_shell_content_security_policy(
    frameOrigin: string,
    contentOrigin: string,
): string {
    return [
        "default-src 'none'",
        "style-src 'unsafe-inline'",
        `frame-src ${contentOrigin}`,
        "form-action 'none'",
        "base-uri 'none'",
        `frame-ancestors ${frameOrigin}`,
    ].join("; ");
}

export function replay_delivery_shell(contentUrl: string): Buffer {
    const escapedUrl = contentUrl
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    return Buffer.from(
        `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{box-sizing:border-box;width:100%;height:100%;margin:0;border:0}body{overflow:hidden;background:#fff}</style></head><body><iframe title="Interactive replay" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" referrerpolicy="no-referrer" src="${escapedUrl}"></iframe></body></html>`,
        "utf8",
    );
}
