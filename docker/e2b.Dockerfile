# Using pre built image of e2b that contains some coding packages
FROM e2bdev/code-interpreter:latest

# Installation of curl, ca-certificates, git, tar, jq, pip, node
RUN apt-get update \
    && apt-get install -y curl ca-certificates git tar jq pipx \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Installation of github cli
ENV GH_CLI_VERSION=2.97.0
RUN curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_CLI_VERSION}/gh_${GH_CLI_VERSION}_linux_amd64.tar.gz" -o /tmp/gh.tar.gz \
    && tar -xzf /tmp/gh.tar.gz -C /tmp \
    && mv "/tmp/gh_${GH_CLI_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh \
    && rm -rf /tmp/gh.tar.gz "/tmp/gh_${GH_CLI_VERSION}_linux_amd64"

# Installation of claude code cli
ENV CLAUDE_CODE_CLI_VERSION=2.1.236
RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_CLI_VERSION}" \
    && claude --version

# Installation of codex cli
ENV CODEX_CLI_VERSION=0.151.0
RUN npm install -g "@openai/codex@${CODEX_CLI_VERSION}" \
    && codex --version

# Installation of opencode cli
ENV OPENCODE_CLI_VERSION=1.18.25
RUN npm install -g "opencode-ai@${OPENCODE_CLI_VERSION}" \
    && opencode --version

# Installation of graphify from python (it builds a code graph and let the grep cmd result faster)
ENV GRAPHIFY_VERSION=0.9.43
ENV PIPX_HOME=/opt/pipx
ENV PIPX_BIN_DIR=/usr/local/bin
RUN pipx install "graphifyy==${GRAPHIFY_VERSION}" \
    && graphify --version

<<<<<<< HEAD
COPY packages/sandbox-mcp/dist/index.js /opt/darwin/sandbox-mcp/index.js
COPY docker/sandbox-mcp.runtime.package.json /opt/darwin/sandbox-mcp/package.json
RUN cd /opt/darwin/sandbox-mcp && npm install --omit=dev
=======
# Uploading the mcp client
COPY packages/sandbox-mcp/dist/index.js /opt/matcha/sandbox-mcp/index.js
COPY docker/sandbox-mcp.runtime.package.json /opt/matcha/sandbox-mcp/package.json
RUN cd /opt/matcha/sandbox-mcp && npm install --omit=dev
>>>>>>> b6fcad70 (updated e2b related files.)

# Installation of playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/home/user/.cache/ms-playwright

# Installation of fonts package for rendering broad unicode fonts
# and uzip to unzip the chromium package
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       unzip fonts-liberation fonts-dejavu-core fonts-noto-core fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

<<<<<<< HEAD
COPY packages/capsule-check/dist/index.js /opt/darwin/capsule-check/index.js
COPY docker/capsule-check.runtime.package.json /opt/darwin/capsule-check/package.json
RUN cd /opt/darwin/capsule-check \
=======
# Uploading of capsule check package
COPY packages/capsule-check/dist/index.js /opt/matcha/capsule-check/index.js
COPY docker/capsule-check.runtime.package.json /opt/matcha/capsule-check/package.json

# Installation of chromium for playwright
RUN cd /opt/matcha/capsule-check \
>>>>>>> b6fcad70 (updated e2b related files.)
    && npm install --omit=dev \
    && npx playwright install --with-deps chromium \
    && chmod -R a+rX /opt/darwin/capsule-check /home/user/.cache/ms-playwright

# Installation fo pnpm and yarn
ENV PNPM_VERSION=11.22.0
ENV YARN_VERSION=4.18.0
RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate \
    && corepack prepare "yarn@${YARN_VERSION}" --activate

# Installation of bun
ENV BUN_VERSION=1.3.2
ENV BUN_INSTALL=/opt/darwin/bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}" \
    && BUN_BIN="$(find /opt /root /home /usr/local -maxdepth 4 -type f -name bun 2>/dev/null | head -1)" \
    && test -n "${BUN_BIN}" \
    && install -m 0755 "${BUN_BIN}" /usr/local/bin/bun \
    && chmod -R a+rX /opt/darwin/bun \
    && bun --version
