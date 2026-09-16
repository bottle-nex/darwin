// pm2 process definitions for a server deployment.
//
// Kept in the repo on purpose: this file previously existed only on the deployment box, so
// when that machine went away the process layout went with it and had to be reconstructed
// from memory. Ports here must match the nginx site and the *_URL values in .env.
//
// `interpreter: 'none'` matters — without it pm2 tries to run these through node, which
// breaks both the Next.js binary and bun.

const BUN = process.env.BUN_PATH || `${process.env.HOME}/.bun/bin/bun`;

module.exports = {
    apps: [
        {
            name: "darwin-web",
            cwd: "./apps/web",
            script: "node_modules/.bin/next",
            args: "start -p 4400",
            interpreter: "none",
            env: { NODE_ENV: "production" },
            instances: 1,
            max_memory_restart: "1G",
        },
        {
            name: "darwin-admin",
            cwd: "./apps/admin",
            script: "node_modules/.bin/next",
            args: "start -p 4401",
            interpreter: "none",
            env: { NODE_ENV: "production" },
            instances: 1,
            max_memory_restart: "1G",
        },
        {
            name: "darwin-server",
            cwd: "./apps/server",
            script: BUN,
            args: "run src/index.ts",
            interpreter: "none",
            exec_mode: "fork",
            env: { NODE_ENV: "production", SERVER_PORT: 4402 },
            instances: 1,
            max_memory_restart: "1G",
        },
        {
            name: "darwin-vm",
            cwd: "./apps/vm",
            script: BUN,
            args: "run index.ts",
            interpreter: "none",
            exec_mode: "fork",
            instances: 1,
            max_memory_restart: "1G",
        },
        {
            name: "darwin-router",
            cwd: "./apps/router",
            script: BUN,
            args: "run src/index.ts",
            interpreter: "none",
            exec_mode: "fork",
            instances: 1,
            max_memory_restart: "512M",
        },
        {
            name: "darwin-guards",
            cwd: "./apps/guards",
            script: BUN,
            args: "run src/index.ts",
            interpreter: "none",
            exec_mode: "fork",
            instances: 1,
            max_memory_restart: "512M",
        },
    ],
};
