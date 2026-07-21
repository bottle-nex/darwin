FROM e2bdev/code-interpreter:latest

RUN apt-get update \
    && apt-get install -y curl ca-certificates git \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code
