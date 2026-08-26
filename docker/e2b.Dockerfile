FROM e2bdev/code-interpreter:latest

RUN apt-get update \
    && apt-get install -y curl ca-certificates git tar jq pipx \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# gh CLI: install the static binary directly rather than adding the apt repo — no
# apt-key/sources.list step to get wrong. Pinned rather than resolved at build time
# against api.github.com, which E2B's build network couldn't reach reliably. Bump by
# checking https://github.com/cli/cli/releases for a newer version.
#
# Pins are ENV rather than ARG on purpose: this file is built through the E2B template
# builder (see apps/vm/src/scripts/script.build_sandbox_template.ts), whose Dockerfile
# parser supports FROM/RUN/COPY/ENV/WORKDIR/USER/CMD but not ARG.
ENV GH_CLI_VERSION=2.97.0
RUN curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_CLI_VERSION}/gh_${GH_CLI_VERSION}_linux_amd64.tar.gz" -o /tmp/gh.tar.gz \
    && tar -xzf /tmp/gh.tar.gz -C /tmp \
    && mv "/tmp/gh_${GH_CLI_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh \
    && rm -rf /tmp/gh.tar.gz "/tmp/gh_${GH_CLI_VERSION}_linux_amd64"

RUN npm install -g @anthropic-ai/claude-code

# graphify builds the code graph the solving agent queries instead of grepping for
# structure. Baked in rather than installed per run so onboarding pays no install cost
# and never depends on PyPI being reachable mid-job. Pinned for the same reason gh is:
# a version that moves under us changes the graph without changing this repo. Bump by
# checking https://pypi.org/project/graphifyy/ for a newer release.
ENV GRAPHIFY_VERSION=0.9.43
ENV PIPX_HOME=/opt/pipx
ENV PIPX_BIN_DIR=/usr/local/bin
RUN pipx install "graphifyy==${GRAPHIFY_VERSION}" \
    && graphify --version

COPY packages/sandbox-mcp/dist/index.js /opt/matcha/sandbox-mcp/index.js
COPY docker/sandbox-mcp.runtime.package.json /opt/matcha/sandbox-mcp/package.json
RUN cd /opt/matcha/sandbox-mcp && npm install --omit=dev

# Product Diff renders a project's real components in a real browser, so the template carries
# Chromium and the fonts it needs. Without the font packages every glyph renders as a tofu box
# on both revisions — the diff comes out clean and tells you nothing.
#
# Browsers go where Playwright looks by default for the sandbox user, not somewhere in /opt that a
# runtime env var would have to point at. Dockerfile ENV does not reach the processes E2B runs, so
# an /opt install builds fine and then fails every launch with "Executable doesn't exist" — a
# failure that surfaces hours later, nowhere near its cause. The image builds as root and sandboxes
# run as `user`, hence the chmod below.
ENV PLAYWRIGHT_BROWSERS_PATH=/home/user/.cache/ms-playwright

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       unzip fonts-liberation fonts-dejavu-core fonts-noto-core fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

COPY packages/capsule-check/dist/index.js /opt/matcha/capsule-check/index.js
COPY docker/capsule-check.runtime.package.json /opt/matcha/capsule-check/package.json
RUN cd /opt/matcha/capsule-check \
    && npm install --omit=dev \
    && npx playwright install --with-deps chromium \
    && chmod -R a+rX /opt/matcha/capsule-check /home/user/.cache/ms-playwright

# Prepared at build time rather than on demand: a sandbox may have no registry reach at the
# moment it needs to install a project, and corepack would otherwise try to download the manager
# then. Pins are ENV for the same reason the others are — the parser has no ARG.
ENV PNPM_VERSION=11.22.0
ENV YARN_VERSION=4.18.0
RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate \
    && corepack prepare "yarn@${YARN_VERSION}" --activate

# Placed in /usr/local/bin the same way gh is, rather than trusting an ENV PATH line: bun's
# installer picks its own destination, and a PATH that is subtly wrong produces an image where
# every bun project silently fails to install.
ENV BUN_VERSION=1.3.2
ENV BUN_INSTALL=/opt/matcha/bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}" \
    && BUN_BIN="$(find /opt /root /home /usr/local -maxdepth 4 -type f -name bun 2>/dev/null | head -1)" \
    && test -n "${BUN_BIN}" \
    && install -m 0755 "${BUN_BIN}" /usr/local/bin/bun \
    && chmod -R a+rX /opt/matcha/bun \
    && bun --version
