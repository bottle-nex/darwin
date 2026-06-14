FROM e2bdev/code-interpreter:latest

# Install NodeJS
RUN curl -fsSl https://dev.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs

# Install Claude Code
RUN npm install -g @anthropic-ai/claude-code