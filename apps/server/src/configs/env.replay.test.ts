import { expect, test } from "bun:test";

const env_module = new URL("./env.ts", import.meta.url).pathname;

function validate_environment(overrides: Record<string, string | undefined>) {
    const environment = { ...process.env };
    for (const [name, value] of Object.entries(overrides)) {
        if (value === undefined) delete environment[name];
        else environment[name] = value;
    }
    return Bun.spawnSync([process.execPath, "-e", `await import(${JSON.stringify(env_module)})`], {
        env: environment,
        stdout: "pipe",
        stderr: "pipe",
    });
}

const production_origins = {
    SERVER_NODE_ENV: "production",
    SERVER_WEB_URL: "https://app.trymatcha.app",
    SERVER_ADMIN_URL: "https://admin.trymatcha.app",
    SERVER_PUBLIC_API_URL: "https://api.trymatcha.app",
    SERVER_PRODUCT_DIFF_REPLAY_ENABLED: "true",
};

test("rejects an enabled replay deployment without an origin", () => {
    const result = validate_environment({
        ...production_origins,
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: undefined,
    });

    expect(result.exitCode).not.toBe(0);
});

test("rejects an insecure replay origin outside local development", () => {
    const result = validate_environment({
        ...production_origins,
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: "http://replay.trymatchausercontent.app",
    });

    expect(result.exitCode).not.toBe(0);
});

test("rejects a replay origin on the Matcha application site", () => {
    const result = validate_environment({
        ...production_origins,
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: "https://replay.trymatcha.app",
    });

    expect(result.exitCode).not.toBe(0);
});

test("accepts an HTTPS replay origin on a separate site", () => {
    const result = validate_environment({
        ...production_origins,
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: "https://replay.trymatchausercontent.app",
    });

    expect(result.exitCode).toBe(0);
});

test("accepts an HTTP loopback replay origin in local development", () => {
    const result = validate_environment({
        SERVER_NODE_ENV: "development",
        SERVER_WEB_URL: "http://localhost:3000",
        SERVER_ADMIN_URL: "http://localhost:5174",
        SERVER_PUBLIC_API_URL: "http://localhost:8080",
        SERVER_PRODUCT_DIFF_REPLAY_ENABLED: "true",
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: "http://replay.localhost:8080",
    });

    expect(result.exitCode).toBe(0);
});

test("rejects an HTTP replay origin on a remote development host", () => {
    const result = validate_environment({
        SERVER_NODE_ENV: "development",
        SERVER_WEB_URL: "http://localhost:3000",
        SERVER_ADMIN_URL: "http://localhost:5174",
        SERVER_PUBLIC_API_URL: "http://localhost:8080",
        SERVER_PRODUCT_DIFF_REPLAY_ENABLED: "true",
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: "http://10.0.0.2:8080",
    });

    expect(result.exitCode).not.toBe(0);
});

test("rejects a production replay origin without a registrable site", () => {
    const result = validate_environment({
        ...production_origins,
        SERVER_PRODUCT_DIFF_REPLAY_ORIGIN: "https://203.0.113.10",
    });

    expect(result.exitCode).not.toBe(0);
});
