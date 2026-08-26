import { expect, test } from "bun:test";

import {
    replay_content_security_policy,
    replay_delivery_path,
    replay_delivery_shell,
    replay_original_url,
    replay_shell_content_security_policy,
    rewrite_replay_delivery_body,
} from "./service.product_diff_replay_delivery";

const resources = [
    "https://preview.customer.test/pricing",
    "https://cdn.customer.test/assets/app.js",
    "https://api.customer.test/catalog/items",
];

test("round-trips a recorded absolute URL through an origin-scoped gateway path", () => {
    const original = "https://cdn.customer.test/assets/app.js?locale=en";
    const deliveryPath = replay_delivery_path(original);

    expect(deliveryPath).toStartWith("/__matcha_replay_resource/");
    expect(replay_original_url(deliveryPath)).toBe(original);
});

test("rewrites recorded origins in executable text without changing unknown origins", () => {
    const body = Buffer.from(
        `fetch("https://api.customer.test/catalog/items"); import("https://cdn.customer.test/assets/app.js"); const image = "//cdn.customer.test/assets/image.png"; fetch("https://unrecorded.test/leak")`,
    );

    const rewritten = rewrite_replay_delivery_body(body, "application/javascript", resources);
    const text = rewritten.toString("utf8");

    expect(text).toContain(replay_delivery_path("https://api.customer.test/catalog/items"));
    expect(text).toContain(replay_delivery_path("https://cdn.customer.test/assets/app.js"));
    expect(text).not.toContain("https://api.customer.test");
    expect(text).not.toContain("https://cdn.customer.test");
    expect(text).not.toContain("//cdn.customer.test");
    expect(text).toContain(`${replay_delivery_path("https://cdn.customer.test/assets/image.png")}`);
    expect(text).toContain("https://unrecorded.test/leak");
});

test("leaves binary artifact bytes unchanged", () => {
    const bytes = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]);

    expect(rewrite_replay_delivery_body(bytes, "application/wasm", resources)).toEqual(bytes);
});

test("injects the replay runtime before application scripts and removes stale integrity hashes", () => {
    const body = Buffer.from(
        '<!doctype html><html><head><script integrity="sha256-old" src="https://cdn.customer.test/assets/app.js"></script></head></html>',
    );

    const rewritten = rewrite_replay_delivery_body(body, "text/html", resources).toString("utf8");

    expect(rewritten).toContain("/__matcha_replay_blocked");
    expect(rewritten.indexOf("/__matcha_replay_blocked")).toBeLessThan(
        rewritten.indexOf('src="/__matcha_replay_resource'),
    );
    expect(rewritten).not.toContain("integrity=");
    const bootstrap = rewritten.slice(
        rewritten.indexOf("<script>") + "<script>".length,
        rewritten.indexOf("</script>"),
    );
    expect(() => new Function(bootstrap)).not.toThrow();
});

test("allows only the replay gateway for browser network capabilities", () => {
    const policy = replay_content_security_policy("https://app.trymatcha.test");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("img-src 'self' data: blob:");
    expect(policy).toContain("font-src 'self' data:");
    expect(policy).toContain("media-src 'self' data: blob:");
    expect(policy).toContain("worker-src 'self' blob:");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-src 'self'");
    expect(policy).toContain("frame-ancestors 'self' https://app.trymatcha.test");
    expect(policy).not.toContain("https://preview.customer.test");
});

test("creates a trusted shell that can frame only its artifact content origin", () => {
    const contentOrigin = "https://content-artifact.replay.trymatcha.test";
    const contentUrl = `${contentOrigin}/billing?capability=secret&state="expanded"`;
    const shell = replay_delivery_shell(contentUrl).toString("utf8");
    const policy = replay_shell_content_security_policy(
        "https://app.trymatcha.test",
        contentOrigin,
    );

    expect(shell).toContain('sandbox="allow-scripts allow-same-origin allow-forms allow-modals"');
    expect(shell).toContain(
        'src="https://content-artifact.replay.trymatcha.test/billing?capability=secret&amp;state=&quot;expanded&quot;"',
    );
    expect(shell).not.toContain("allow-top-navigation");
    expect(shell).not.toContain("allow-popups");
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain(`frame-src ${contentOrigin}`);
    expect(policy).toContain("frame-ancestors https://app.trymatcha.test");
});
