FROM e2bdev/code-interpreter:latest

RUN apt-get update \
    && apt-get install -y curl ca-certificates git tar \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# gh CLI: install the static binary directly rather than adding the apt repo — no
# apt-key/sources.list step to get wrong. Pinned rather than resolved at build time
# against api.github.com, which E2B's build network couldn't reach reliably. Bump by
# checking https://github.com/cli/cli/releases for a newer version.
ARG GH_CLI_VERSION=2.97.0
RUN curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_CLI_VERSION}/gh_${GH_CLI_VERSION}_linux_amd64.tar.gz" -o /tmp/gh.tar.gz \
    && tar -xzf /tmp/gh.tar.gz -C /tmp \
    && mv "/tmp/gh_${GH_CLI_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh \
    && rm -rf /tmp/gh.tar.gz "/tmp/gh_${GH_CLI_VERSION}_linux_amd64"

RUN npm install -g @anthropic-ai/claude-code

COPY packages/sandbox-mcp/dist/index.js /opt/matcha/sandbox-mcp/index.js
COPY docker/sandbox-mcp.runtime.package.json /opt/matcha/sandbox-mcp/package.json
RUN cd /opt/matcha/sandbox-mcp && npm install --omit=dev
