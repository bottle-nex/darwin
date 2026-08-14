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
